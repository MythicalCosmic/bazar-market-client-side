<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'
import { useAddresses } from '../stores/addressStore.js'
import { placeOrder as placeOrderAPI } from '../services/api.js'
import { ensureYmaps, reverseGeocode, locateMe, DEFAULT_LAT, DEFAULT_LNG } from '../composables/useYandexMaps.js'
import { useToast } from '../composables/useToast.js'

const { total, subtotal, deliveryCost, discount, clearCart, loadDeliveryInfo } = useCartStore()
const { formatNum } = useFormat()
const { navigate, routeParams } = useRouter()
const { t } = useI18n()
const { isAuthenticated, user } = useAuth()
const { addresses, loadAddresses, addAddress, removeAddress } = useAddresses()
const { error: toastError } = useToast()

const selectedPayment = ref('card')
const locationStatus = ref('')
const addressText = ref('')
const selectedAddressId = ref(null)
const showAddressPicker = ref(false)
const couponCode = ref(routeParams.value?.couponCode || '')
const userNote = ref('')
const isPlacing = ref(false)
const orderError = ref('')

// Live delivery point — tracks the map centre. When the user pans the map this
// becomes a custom location with no saved address behind it.
const pickedLat = ref(null)
const pickedLng = ref(null)
const mapMoving = ref(false) // map is being panned → lift the centre pin
const locating = ref(false)  // "find my location" in flight

// Post-order "save this address?" prompt (only for freshly-picked locations).
const showSavePrompt = ref(false)
const pendingSaveAddressId = ref(null)
const placedOrderId = ref(null)

const paymentMethods = [
  { id: 'card', labelKey: 'checkout.card', emoji: '💳' },
  { id: 'cash', labelKey: 'checkout.cash', emoji: '💵' },
]

let ymaps = null
let map = null
let debounceTimer = null
let geoSeq = 0

// Resolve the map centre to an address. Never lands on a dead-end "not found":
// falls back to a "selected point" label so the order can still go through.
async function geocodeAt(lat, lng) {
  const seq = ++geoSeq
  addressText.value = t('checkout.detecting_address')
  try {
    const line = await reverseGeocode(ymaps, [lat, lng])
    if (seq !== geoSeq) return
    addressText.value = line || t('maps.point_selected')
  } catch {
    if (seq !== geoSeq) return
    addressText.value = t('maps.point_selected')
  }
}

function debouncedGeocode(lat, lng) {
  addressText.value = t('checkout.detecting_address')
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => geocodeAt(lat, lng), 350)
}

async function initMap(lat, lng, { geocode } = {}) {
  try {
    ymaps = await ensureYmaps()
  } catch {
    locationStatus.value = '⚠️ ' + t('checkout.map_unavailable')
    return
  }
  pickedLat.value = lat
  pickedLng.value = lng
  map = new ymaps.Map('checkout-map',
    { center: [lat, lng], zoom: 16, controls: ['zoomControl'] },
    { suppressMapOpenBlock: true })
  // Centre-pin: the pin is a fixed overlay, the user pans the map under it.
  // A user-driven pan detaches any saved address and re-geocodes on settle.
  map.events.add('actionbegin', () => { mapMoving.value = true; selectedAddressId.value = null })
  map.events.add('boundschange', () => { const c = map.getCenter(); pickedLat.value = c[0]; pickedLng.value = c[1] })
  map.events.add('actionend', () => { mapMoving.value = false; const c = map.getCenter(); debouncedGeocode(c[0], c[1]) })
  if (geocode) geocodeAt(lat, lng)
}

function selectAddress(addr) {
  selectedAddressId.value = addr.id
  addressText.value = addr.address
  showAddressPicker.value = false
  if (addr.lat && addr.lng) {
    pickedLat.value = addr.lat
    pickedLng.value = addr.lng
    // Programmatic recentre — no actionend fires, so the saved address text stays.
    if (map) map.setCenter([addr.lat, addr.lng], 16)
  }
}

async function useMyLocation() {
  if (locating.value || !map) return
  locating.value = true
  try {
    const c = await locateMe()
    pickedLat.value = c[0]
    pickedLng.value = c[1]
    selectedAddressId.value = null
    map.setCenter(c, 17)
    geocodeAt(c[0], c[1])
  } catch {
    toastError(t('maps.locate_failed'))
  } finally {
    locating.value = false
  }
}

onMounted(async () => {
  if (!isAuthenticated.value) { navigate('login'); return }

  // Refresh the delivery fee / minimum on entry — the startup fetch may have
  // failed or run before this build was current.
  loadDeliveryInfo()

  await loadAddresses()

  const defaultAddr = addresses.value.find(a => a.isDefault)
  if (defaultAddr) {
    selectedAddressId.value = defaultAddr.id
    addressText.value = defaultAddr.address
  }

  if (!addressText.value) addressText.value = t('checkout.detecting_address')
  // Persistent hint under the map; only swapped out if the map fails to load.
  locationStatus.value = t('maps.move_hint')

  if (defaultAddr?.lat && defaultAddr?.lng) {
    initMap(defaultAddr.lat, defaultAddr.lng, { geocode: false })
  } else {
    // Open on Marhamat (Andijon) and resolve that point's address.
    initMap(DEFAULT_LAT, DEFAULT_LNG, { geocode: true })
  }
})

onUnmounted(() => {
  if (map) { map.destroy(); map = null }
  clearTimeout(debounceTimer)
})

async function handlePlaceOrder() {
  // Re-entrancy guard at function entry — :disabled alone races with rapid taps.
  if (isPlacing.value) return
  if (!isAuthenticated.value) { navigate('login'); return }

  let addrId = selectedAddressId.value
  const usingMapPick = !addrId
  const addressReady = addressText.value && addressText.value !== t('checkout.detecting_address')

  if (usingMapPick && (!pickedLat.value || !pickedLng.value || !addressReady)) {
    orderError.value = t('checkout.select_address')
    return
  }

  orderError.value = ''
  isPlacing.value = true
  let createdAddrId = null
  try {
    // No saved address — persist the picked map location so the order can
    // reference it (the API requires an address_id). We offer to keep it later.
    if (usingMapPick) {
      const before = new Set(addresses.value.map(a => a.id))
      const res = await addAddress({
        label: t('addresses.label_home'),
        address: addressText.value,
        lat: pickedLat.value,
        lng: pickedLng.value,
        isDefault: before.size === 0, // first address becomes the default
      })
      addrId = res?.id ?? addresses.value.find(a => !before.has(a.id))?.id
      if (!addrId) throw new Error(t('common.error_generic'))
      createdAddrId = addrId
    }

    const body = {
      address_id: addrId,
      payment_method: selectedPayment.value,
    }
    if (couponCode.value) body.coupon_code = couponCode.value
    if (userNote.value) body.user_note = userNote.value
    const data = await placeOrderAPI(body)
    clearCart()
    const newOrderId = data?.order_id || data?.id

    if (createdAddrId) {
      // Ordered against a freshly-picked location — ask whether to keep it.
      pendingSaveAddressId.value = createdAddrId
      placedOrderId.value = newOrderId || null
      showSavePrompt.value = true
      return
    }
    if (newOrderId) navigate('orders', { highlightOrderId: newOrderId, placed: true })
    else navigate('orders')
  } catch (e) {
    // Roll back the address we created if the order itself failed.
    if (createdAddrId) { try { await removeAddress(createdAddrId) } catch {} }
    orderError.value = e.message || t('common.error_generic')
    toastError(orderError.value)
    if (e.status === 400 && /cart is empty/i.test(e.message || '')) navigate('cart')
  } finally {
    isPlacing.value = false
  }
}

// "Save this address?" — yes keeps it and opens the addresses page.
function keepPickedAddress() {
  showSavePrompt.value = false
  pendingSaveAddressId.value = null
  navigate('addresses')
}

// No — discard the address that was only created to place the order.
async function discardPickedAddress() {
  showSavePrompt.value = false
  const id = pendingSaveAddressId.value
  pendingSaveAddressId.value = null
  if (id) { try { await removeAddress(id) } catch {} }
  if (placedOrderId.value) navigate('orders', { highlightOrderId: placedOrderId.value, placed: true })
  else navigate('orders')
}
</script>

<template>
  <div class="min-h-screen" style="background: var(--bg-app)">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('cart')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg width="20" height="20" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('checkout.title') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-3 pb-32 flex flex-col gap-3">
      <!-- Map -->
      <div class="rounded-2xl overflow-hidden relative" style="height: 220px; box-shadow: 0 2px 12px var(--shadow)">
        <div id="checkout-map" style="width: 100%; height: 100%; z-index: 1;"></div>

        <!-- Fixed centre pin: pan the map underneath it -->
        <div class="map-pin" :class="{ lifted: mapMoving }">
          <svg width="36" height="44" viewBox="0 0 40 48" fill="none">
            <path d="M20 47C20 47 36 30.5 36 18C36 8.6 28.8 1 20 1C11.2 1 4 8.6 4 18C4 30.5 20 47 20 47Z" fill="var(--primary)" stroke="white" stroke-width="2"/>
            <circle cx="20" cy="18" r="6.5" fill="white"/>
          </svg>
        </div>
        <div class="map-pin-dot"></div>

        <!-- Find my location -->
        <button @click="useMyLocation" :class="['map-fab btn-press', { busy: locating }]" :aria-label="t('maps.my_location')">
          <svg v-if="!locating" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" stroke-width="2"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2" stroke-width="2" stroke-linecap="round"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" class="animate-spin"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="44" stroke-dashoffset="14" opacity="0.9"/></svg>
        </button>

        <div class="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-1 rounded-lg" style="z-index: 6; background: var(--surface); color: var(--text-secondary); box-shadow: 0 2px 6px var(--shadow-lg)">{{ locationStatus }}</div>
      </div>

      <!-- Address selector -->
      <div class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <!-- Current address (tappable) -->
        <button @click="showAddressPicker = !showAddressPicker" class="w-full flex items-center justify-between px-4 py-3.5 btn-press text-left">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
              <svg width="16" height="16" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('checkout.home') }}</p>
              <p class="text-xs font-bold truncate" style="color: var(--text-primary)">{{ addressText }}</p>
            </div>
          </div>
          <svg width="16" height="16" class="flex-shrink-0 transition-transform" :style="{ color: 'var(--text-tertiary)', transform: showAddressPicker ? 'rotate(180deg)' : '' }" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
        </button>

        <!-- Address dropdown -->
        <div v-if="showAddressPicker && addresses.length" class="border-t" style="border-color: var(--border)">
          <button
            v-for="addr in addresses"
            :key="addr.id"
            @click="selectAddress(addr)"
            class="w-full flex items-center gap-3 px-4 py-3 btn-press text-left border-b"
            :style="{ borderColor: 'var(--border)', background: selectedAddressId === addr.id ? 'var(--primary-light)' : '' }"
          >
            <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" :style="{ background: selectedAddressId === addr.id ? 'var(--primary)' : 'var(--surface-secondary)' }">
              <svg width="14" height="14" :class="selectedAddressId === addr.id ? 'text-white' : ''" :style="selectedAddressId !== addr.id ? 'color: var(--text-tertiary)' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black" style="color: var(--text-primary)">{{ addr.label }}</p>
              <p class="text-[10px] font-semibold truncate" style="color: var(--text-tertiary)">{{ addr.address }}</p>
            </div>
            <svg v-if="selectedAddressId === addr.id" width="16" height="16" class="text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button @click="navigate('addresses')" class="w-full flex items-center gap-3 px-4 py-3 btn-press text-left">
            <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
            </div>
            <span class="text-xs font-black text-primary">{{ t('addresses.add_new') }}</span>
          </button>
        </div>

        <!-- No addresses -->
        <div v-if="showAddressPicker && !addresses.length" class="border-t px-4 py-3" style="border-color: var(--border)">
          <button @click="navigate('addresses')" class="w-full flex items-center gap-3 btn-press text-left">
            <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
            </div>
            <span class="text-xs font-black text-primary">{{ t('addresses.add_new') }}</span>
          </button>
        </div>

        <!-- Phone -->
        <div class="flex items-center px-4 py-3.5 border-t" style="border-color: var(--border)">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
              <svg width="16" height="16" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/></svg>
            </div>
            <div>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('checkout.phone') }}</p>
              <p class="text-xs font-bold" style="color: var(--text-primary)">{{ user?.phone || '' }}</p>
            </div>
          </div>
        </div>

        <!-- Time -->
        <div class="flex items-center px-4 py-3.5 border-t" style="border-color: var(--border)">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
              <svg width="16" height="16" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
            <div>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('checkout.delivery_time') }}</p>
              <p class="text-xs font-bold" style="color: var(--text-primary)">{{ t('checkout.delivery_minutes') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Note -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-xs font-black mb-2" style="color: var(--text-primary)">{{ t('checkout.note') }}</p>
        <textarea v-model="userNote" :placeholder="t('checkout.note_placeholder')" rows="2"
          class="w-full text-sm font-semibold px-3 py-2.5 rounded-xl outline-none resize-none"
          style="background: var(--surface-secondary); color: var(--text-primary)"></textarea>
      </div>

      <!-- Payment -->
      <div class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="px-4 pt-3.5 pb-1 text-xs font-black" style="color: var(--text-primary)">{{ t('checkout.payment') }}</p>
        <div v-for="(method, idx) in paymentMethods" :key="method.id" @click="selectedPayment = method.id"
          :class="['flex items-center justify-between px-4 py-3.5 btn-press', idx < paymentMethods.length - 1 ? 'border-b' : '']"
          :style="{ borderColor: 'var(--border)' }">
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ method.emoji }}</span>
            <span class="text-sm font-bold" style="color: var(--text-primary)">{{ t(method.labelKey) }}</span>
          </div>
          <div class="radio-outer" :class="{ active: selectedPayment === method.id }">
            <div v-if="selectedPayment === method.id" class="radio-inner"></div>
          </div>
        </div>
      </div>

      <!-- Order summary -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-sm font-black mb-3" style="color: var(--text-primary)">{{ t('cart.your_order') }}</p>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between">
            <span class="text-xs font-semibold" style="color: var(--text-secondary)">{{ t('cart.products') }}</span>
            <span class="text-xs font-bold" style="color: var(--text-primary)">{{ formatNum(subtotal) }} {{ t('currency') }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs font-semibold" style="color: var(--text-secondary)">{{ t('cart.delivery') }}</span>
            <span class="text-xs font-bold" style="color: var(--text-primary)">{{ formatNum(deliveryCost) }} {{ t('currency') }}</span>
          </div>
          <div v-if="discount > 0" class="flex justify-between">
            <span class="text-xs font-semibold" style="color: var(--text-secondary)">{{ t('cart.discount') }}</span>
            <span class="text-xs font-bold text-red-500">-{{ formatNum(discount) }} {{ t('currency') }}</span>
          </div>
          <div class="h-px" style="background: var(--border)"></div>
          <div class="flex justify-between">
            <span class="text-sm font-black" style="color: var(--text-primary)">{{ t('checkout.total') }}</span>
            <span class="text-sm font-black" style="color: var(--text-primary)">{{ formatNum(total) }} {{ t('currency') }}</span>
          </div>
        </div>
      </div>

      <p v-if="orderError" class="text-xs font-bold text-red-500 text-center">{{ orderError }}</p>
    </div>

    <!-- Order button -->
    <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 z-30 safe-bottom" style="background: var(--surface); box-shadow: 0 -4px 20px var(--shadow)">
      <button @click="handlePlaceOrder" :disabled="isPlacing"
        class="w-full banner-bg text-white font-black text-base py-4 rounded-2xl btn-press transition-opacity"
        :class="{ 'opacity-60': isPlacing }"
        style="box-shadow: 0 6px 24px var(--primary-glow)">
        {{ isPlacing ? t('common.loading') : t('checkout.place_order') }}
      </button>
    </div>

    <!-- Save picked address prompt -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showSavePrompt" class="fixed inset-0 z-[120] flex items-end justify-center" style="background: rgba(0,0,0,0.4)">
          <div class="w-full max-w-[480px] rounded-t-[28px] p-6 safe-bottom" style="background: var(--surface)">
            <div class="flex flex-col items-center mb-5">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" style="background: var(--primary-light)">
                <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold" style="color: var(--text-primary)">{{ t('checkout.save_address_title') }}</h3>
              <p class="text-sm font-medium mt-1 text-center" style="color: var(--text-tertiary)">{{ addressText }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="keepPickedAddress" class="w-full bg-primary text-white font-bold py-3.5 rounded-2xl btn-press">{{ t('checkout.save_address_yes') }}</button>
              <button @click="discardPickedAddress" class="w-full font-bold py-3.5 rounded-2xl btn-press" style="background: var(--surface-secondary); color: var(--text-primary)">{{ t('checkout.save_address_no') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
