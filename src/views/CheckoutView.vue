<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'
import { useAddresses } from '../stores/addressStore.js'
import { placeOrder as placeOrderAPI, checkDelivery } from '../services/api.js'

const { total, subtotal, deliveryCost, discount, clearCart, setDeliveryCost } = useCartStore()
const { formatNum } = useFormat()
const { navigate } = useRouter()
const { t } = useI18n()
const { isAuthenticated, user } = useAuth()
const { addresses, loadAddresses } = useAddresses()

const selectedPayment = ref('card')
const locationStatus = ref('')
const addressText = ref('')
const selectedAddressId = ref(null)
const showAddressPicker = ref(false)
const couponCode = ref('')
const userNote = ref('')
const isPlacing = ref(false)
const orderError = ref('')

const paymentMethods = [
  { id: 'card', labelKey: 'checkout.card', emoji: '💳' },
  { id: 'cash', labelKey: 'checkout.cash', emoji: '💵' },
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
  try {
    const delivery = await checkDelivery(lat, lng)
    if (delivery.available && delivery.zone) setDeliveryCost(parseFloat(delivery.zone.delivery_fee) || 0)
  } catch {}
}

function debouncedGetAddress(lat, lng) {
  addressText.value = t('checkout.detecting_address')
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => getAddress(lat, lng), 300)
}

function initMap(lat, lng) {
  map = L.map('leaflet-map', { zoomControl: true }).setView([lat, lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '', maxZoom: 19 }).addTo(map)
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:#2DB84B;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(45,184,75,0.5);border:3px solid white"></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36],
  })
  marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
  map.on('click', (e) => { marker.setLatLng(e.latlng); debouncedGetAddress(e.latlng.lat, e.latlng.lng) })
  marker.on('dragend', () => { const pos = marker.getLatLng(); debouncedGetAddress(pos.lat, pos.lng) })
  getAddress(lat, lng)
}

function selectAddress(addr) {
  selectedAddressId.value = addr.id
  addressText.value = addr.address
  showAddressPicker.value = false
  if (addr.lat && addr.lng && map && marker) {
    map.setView([addr.lat, addr.lng], 16)
    marker.setLatLng([addr.lat, addr.lng])
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
    locationStatus.value = '✅ ' + t('checkout.location_detected')
    initMap(startLat, startLng)
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { locationStatus.value = '✅ ' + t('checkout.location_detected'); initMap(pos.coords.latitude, pos.coords.longitude) },
      () => { locationStatus.value = '📍 ' + t('checkout.location_default'); initMap(DEFAULT_LAT, DEFAULT_LNG) },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  } else {
    locationStatus.value = '❌ ' + t('checkout.location_unavailable')
    initMap(DEFAULT_LAT, DEFAULT_LNG)
  }
})

onUnmounted(() => {
  if (map) { map.remove(); map = null }
  if (abortController) abortController.abort()
  clearTimeout(debounceTimer)
})

async function handlePlaceOrder() {
  if (!isAuthenticated.value) { navigate('login'); return }
  const addrId = selectedAddressId.value || addresses.value.find(a => a.isDefault)?.id
  if (!addrId) { orderError.value = t('checkout.select_address'); return }
  orderError.value = ''
  isPlacing.value = true
  try {
    await placeOrderAPI({ address_id: addrId, payment_method: selectedPayment.value, coupon_code: couponCode.value || undefined, user_note: userNote.value || undefined })
    clearCart()
    navigate('orders')
  } catch (e) {
    orderError.value = e.message || 'Error'
  } finally {
    isPlacing.value = false
  }
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
      <div class="rounded-2xl overflow-hidden relative" style="height: 200px; box-shadow: 0 2px 12px var(--shadow)">
        <div id="leaflet-map" style="width: 100%; height: 100%; z-index: 1;"></div>
        <div class="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-1 rounded-lg" style="z-index: 999; background: var(--surface); color: var(--text-secondary); box-shadow: 0 2px 6px var(--shadow-lg)">{{ locationStatus }}</div>
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
  </div>
</template>
