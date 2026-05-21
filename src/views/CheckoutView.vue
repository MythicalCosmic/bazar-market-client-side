<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'
import { useAddresses } from '../stores/addressStore.js'
import { placeOrder as placeOrderAPI } from '../services/api.js'
import { ensureLeaflet } from '../composables/useLeaflet.js'
import { useToast } from '../composables/useToast.js'

const { total, subtotal, deliveryCost, discount, clearCart } = useCartStore()
const { formatNum } = useFormat()
const { navigate, routeParams } = useRouter()
const { t } = useI18n()
const { isAuthenticated, user } = useAuth()
const { addresses, loadAddresses } = useAddresses()
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

const paymentMethods = [
  { id: 'card', labelKey: 'checkout.card', descKey: 'payment.card_desc' },
  { id: 'cash', labelKey: 'checkout.cash', descKey: 'ed.settle_arrival' },
]

const DEFAULT_LAT = 40.5553
const DEFAULT_LNG = 71.4742

let map = null
let marker = null
let abortController = null
let debounceTimer = null

async function getAddress(lat, lng) {
  if (abortController) abortController.abort()
  abortController = new AbortController()
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`, { signal: abortController.signal })
    if (!res.ok) throw new Error()
    const data = await res.json()
    if (data?.display_name) {
      const road = data.address?.road || data.address?.pedestrian || ''
      const house = data.address?.house_number || ''
      const city = data.address?.city || data.address?.town || ''
      addressText.value = road ? `${road}${house ? ' ' + house : ''}${city ? ', ' + city : ''}` : data.display_name.split(',').slice(0, 2).join(',')
    }
  } catch (e) {
    if (e.name !== 'AbortError') addressText.value = t('checkout.address_unknown')
  }
}

function debouncedGetAddress(lat, lng) {
  addressText.value = t('checkout.detecting_address')
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => getAddress(lat, lng), 300)
}

async function initMap(lat, lng) {
  let L
  try {
    L = await ensureLeaflet()
  } catch {
    locationStatus.value = t('checkout.map_unavailable')
    return
  }
  map = L.map('leaflet-map', { zoomControl: true }).setView([lat, lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '', maxZoom: 19 }).addTo(map)
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;background:#0F5132;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(15,81,50,0.5);border:2px solid #F5EFE3"></div>`,
    iconSize: [32, 32], iconAnchor: [16, 32],
  })
  marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
  map.on('click', (e) => { marker.setLatLng(e.latlng); debouncedGetAddress(e.latlng.lat, e.latlng.lng) })
  marker.on('dragend', () => { const pos = marker.getLatLng(); debouncedGetAddress(pos.lat, pos.lng) })
  getAddress(lat, lng)
}

async function selectAddress(addr) {
  selectedAddressId.value = addr.id
  addressText.value = addr.address
  showAddressPicker.value = false
  if (addr.lat && addr.lng) {
    if (map && marker) {
      map.setView([addr.lat, addr.lng], 16)
      marker.setLatLng([addr.lat, addr.lng])
    }
  }
}

onMounted(async () => {
  if (!isAuthenticated.value) { navigate('login'); return }

  await loadAddresses()

  const defaultAddr = addresses.value.find(a => a.isDefault)
  if (defaultAddr) {
    selectedAddressId.value = defaultAddr.id
    addressText.value = defaultAddr.address
  }

  locationStatus.value = t('checkout.detecting_location')
  if (!addressText.value) addressText.value = t('checkout.detecting_address')

  const startLat = defaultAddr?.lat || DEFAULT_LAT
  const startLng = defaultAddr?.lng || DEFAULT_LNG

  if (defaultAddr?.lat && defaultAddr?.lng) {
    locationStatus.value = t('checkout.location_detected')
    initMap(startLat, startLng)
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { locationStatus.value = t('checkout.location_detected'); initMap(pos.coords.latitude, pos.coords.longitude) },
      () => { locationStatus.value = t('checkout.location_default'); initMap(DEFAULT_LAT, DEFAULT_LNG) },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  } else {
    locationStatus.value = t('checkout.location_unavailable')
    initMap(DEFAULT_LAT, DEFAULT_LNG)
  }
})

onUnmounted(() => {
  if (map) { map.remove(); map = null }
  if (abortController) abortController.abort()
  clearTimeout(debounceTimer)
})

async function handlePlaceOrder() {
  if (isPlacing.value) return
  if (!isAuthenticated.value) { navigate('login'); return }
  const addrId = selectedAddressId.value || addresses.value.find(a => a.isDefault)?.id
  if (!addrId) { orderError.value = t('checkout.select_address'); return }
  orderError.value = ''
  isPlacing.value = true
  try {
    const body = {
      address_id: addrId,
      payment_method: selectedPayment.value,
    }
    if (couponCode.value) body.coupon_code = couponCode.value
    if (userNote.value) body.user_note = userNote.value
    const data = await placeOrderAPI(body)
    clearCart()
    const newOrderId = data?.order_id || data?.id
    if (newOrderId) navigate('orders', { highlightOrderId: newOrderId, placed: true })
    else navigate('orders')
  } catch (e) {
    orderError.value = e.message || t('common.error_generic')
    toastError(orderError.value)
    if (e.status === 400 && /cart is empty/i.test(e.message || '')) navigate('cart')
  } finally {
    isPlacing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen" style="background: var(--bg-app)">
    <!-- Editorial header -->
    <div class="px-5 py-4 sticky top-0 z-20 checkout-header">
      <div class="flex items-center justify-between">
        <button @click="navigate('cart')" class="flex items-center gap-2 btn-press">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="eyebrow-sm">{{ t('ed.back_to_basket') }}</span>
        </button>
        <span class="num-label text-[11px] tabular">{{ t('ed.step_n_of') }} 02 / 02</span>
      </div>
    </div>

    <!-- Editorial title -->
    <div class="px-5 mt-4 mb-5">
      <div class="flex items-center gap-2 mb-2">
        <span class="num-label text-[11px] tabular">§</span>
        <p class="eyebrow-sm">{{ t('ed.checkout_word') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.place_order_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.place_order_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div class="px-5 pb-36 flex flex-col gap-6">
      <!-- Map -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="num-label text-[11px] tabular">01</span>
          <p class="eyebrow-sm">{{ t('ed.delivery_to') }}</p>
        </div>
        <div class="map-frame">
          <div id="leaflet-map" style="width: 100%; height: 100%; z-index: 1;"></div>
          <div class="map-frame-border"></div>
        </div>
        <p v-if="locationStatus" class="text-[11px] mt-2 serif-italic" style="color: var(--text-tertiary)">{{ locationStatus }}</p>
      </div>

      <!-- Address selector -->
      <div>
        <!-- Current address -->
        <button @click="showAddressPicker = !showAddressPicker" class="address-card btn-press">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <svg width="14" height="14" style="color: var(--terracotta)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <div class="flex-1 min-w-0 text-left">
              <p class="eyebrow-sm mb-0.5">{{ t('checkout.home') }}</p>
              <p class="serif text-[14.5px] truncate" style="color: var(--text-primary); font-weight: 500">{{ addressText }}</p>
            </div>
          </div>
          <svg width="11" height="11" :style="{ color: 'var(--text-tertiary)', transform: showAddressPicker ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
        </button>

        <!-- Dropdown -->
        <div v-if="showAddressPicker" class="address-dropdown">
          <button
            v-for="(addr, idx) in addresses"
            :key="addr.id"
            @click="selectAddress(addr)"
            class="address-item btn-press"
            :class="[selectedAddressId === addr.id ? 'address-item-active' : '', idx !== 0 ? 'border-t' : '']"
            :style="{ borderColor: 'var(--hairline)' }"
          >
            <span class="num-label text-[12px] flex-shrink-0">0{{ idx + 1 }}</span>
            <div class="flex-1 min-w-0 text-left">
              <p class="serif text-[14px]" style="color: var(--text-primary); font-weight: 500">{{ addr.label }}</p>
              <p class="text-[11px] truncate" style="color: var(--text-tertiary)">{{ addr.address }}</p>
            </div>
            <svg v-if="selectedAddressId === addr.id" width="13" height="13" style="color: var(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button @click="navigate('addresses')" class="address-item btn-press" :class="addresses.length ? 'border-t' : ''" :style="{ borderColor: 'var(--hairline)' }">
            <span class="text-[14px] font-light" style="color: var(--primary)">+</span>
            <span class="eyebrow-sm" style="color: var(--primary)">{{ t('addresses.add_new') }}</span>
          </button>
        </div>
      </div>

      <!-- Contact + Time -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">02</span>
          <p class="eyebrow-sm">{{ t('ed.contact_arrival') }}</p>
        </div>
        <div class="hairline mb-4"></div>
        <div class="grid grid-cols-2 gap-5">
          <div>
            <p class="eyebrow-sm mb-1">{{ t('checkout.phone') }}</p>
            <p class="serif text-[14.5px] tabular" style="color: var(--text-primary); font-weight: 500">{{ user?.phone || '—' }}</p>
          </div>
          <div>
            <p class="eyebrow-sm mb-1">{{ t('checkout.delivery_time') }}</p>
            <p class="serif text-[14.5px]" style="color: var(--text-primary); font-weight: 500">{{ t('checkout.delivery_minutes') }}</p>
          </div>
        </div>
      </div>

      <!-- Note -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">03</span>
          <p class="eyebrow-sm">{{ t('checkout.note') }}</p>
        </div>
        <div class="hairline mb-3"></div>
        <textarea v-model="userNote" :placeholder="t('checkout.note_placeholder')" rows="2"
          class="note-input"></textarea>
      </div>

      <!-- Payment -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">04</span>
          <p class="eyebrow-sm">{{ t('checkout.payment') }}</p>
        </div>
        <div class="hairline mb-3"></div>
        <div class="flex flex-col">
          <button v-for="method in paymentMethods" :key="method.id" @click="selectedPayment = method.id"
            class="payment-method btn-press">
            <div class="radio-outer" :class="{ active: selectedPayment === method.id }">
              <div v-if="selectedPayment === method.id" class="radio-inner"></div>
            </div>
            <div class="text-left flex-1">
              <p class="serif text-[15px]" style="color: var(--text-primary); font-weight: 500">{{ t(method.labelKey) }}</p>
              <p class="text-[11.5px]" style="color: var(--text-tertiary)">{{ t(method.descKey) }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Order summary -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">∑</span>
          <p class="eyebrow-sm">{{ t('cart.your_order') }}</p>
        </div>
        <div class="hairline mb-4"></div>
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-baseline">
            <span class="serif-italic text-[14px]" style="color: var(--text-secondary)">{{ t('cart.products') }}</span>
            <span class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500">{{ formatNum(subtotal) }} <span class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('currency') }}</span></span>
          </div>
          <div v-if="discount > 0" class="flex justify-between items-baseline">
            <span class="serif-italic text-[14px]" style="color: var(--text-secondary)">{{ t('cart.discount') }}</span>
            <span class="serif text-[15px] tabular" style="color: var(--bordeaux); font-weight: 500">−{{ formatNum(discount) }} <span class="eyebrow-sm" style="color: var(--bordeaux); opacity: 0.7">{{ t('currency') }}</span></span>
          </div>
          <div class="flex justify-between items-baseline">
            <span class="serif-italic text-[14px]" style="color: var(--text-secondary)">{{ t('cart.delivery') }}</span>
            <span class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500">{{ formatNum(deliveryCost) }} <span class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('currency') }}</span></span>
          </div>
          <div class="hairline-strong my-1"></div>
          <div class="flex justify-between items-baseline">
            <span class="eyebrow">{{ t('checkout.total') }}</span>
            <span class="serif text-[26px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.02em">{{ formatNum(total) }} <span class="eyebrow" style="color: var(--text-tertiary)">{{ t('currency') }}</span></span>
          </div>
        </div>
      </div>

      <p v-if="orderError" class="serif-italic text-[13px] text-center" style="color: var(--bordeaux)">{{ orderError }}</p>
    </div>

    <!-- Place order button -->
    <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-5 pt-3 z-30 safe-bottom checkout-fab-wrap">
      <button @click="handlePlaceOrder" :disabled="isPlacing"
        class="place-order-btn btn-press"
        :class="{ 'opacity-60': isPlacing }">
        <span class="eyebrow-sm" style="color: var(--cream)">{{ isPlacing ? t('common.loading') : t('checkout.place_order') }}</span>
        <svg v-if="!isPlacing" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--cream)">
          <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.checkout-header {
  background: rgba(250, 247, 241, 0.86);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-bottom: 1px solid var(--hairline);
}
:root.dark .checkout-header, .dark .checkout-header {
  background: rgba(14, 20, 17, 0.86);
}

.map-frame {
  position: relative;
  height: 200px;
  border: 1px solid var(--hairline);
  background: var(--surface-secondary);
  overflow: hidden;
}
.map-frame-border {
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(245, 239, 227, 0.4);
  pointer-events: none;
  z-index: 10;
}

.address-card {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.2s ease;
}
.address-card:active {
  border-color: var(--text-primary);
}

.address-dropdown {
  margin-top: 2px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-top: none;
}
.address-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
}
.address-item.border-t {
  border-top: 1px solid var(--hairline);
}
.address-item-active {
  background: var(--primary-tint);
}

.note-input {
  width: 100%;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-style: italic;
  font-size: 14px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  color: var(--text-primary);
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
}
.note-input:focus {
  border-color: var(--text-primary);
}
.note-input::placeholder {
  color: var(--text-tertiary);
  font-style: italic;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.payment-method:last-child {
  border-bottom: none;
}

.checkout-fab-wrap {
  background: linear-gradient(to top, var(--bg-app) 65%, transparent);
}

.place-order-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  background: var(--surface-ink);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: var(--shadow-lg);
  transition: opacity 0.2s ease;
}
</style>
