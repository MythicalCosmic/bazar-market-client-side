<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'

const { total, subtotal, deliveryCost, discount, clearCart } = useCartStore()
const { formatNum } = useFormat()
const { navigate } = useRouter()
const { t } = useI18n()
const { isAuthenticated } = useAuth()

const selectedPayment = ref('card')
const locationStatus = ref('')
const addressText = ref('')

const paymentMethods = [
  { id: 'card', labelKey: 'checkout.card', emoji: '💳' },
  { id: 'cash', labelKey: 'checkout.cash', emoji: '💵' },
]

// Marhamat, Andijan, Uzbekistan
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
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`,
      { signal: abortController.signal }
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    if (data?.display_name) {
      const road = data.address?.road || data.address?.pedestrian || ''
      const house = data.address?.house_number || ''
      const city = data.address?.city || data.address?.town || ''
      addressText.value = road
        ? `${road}${house ? ' ' + house : ''}${city ? ', ' + city : ''}`
        : data.display_name.split(',').slice(0, 2).join(',')
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

function initMap(lat, lng) {
  map = L.map('leaflet-map', { zoomControl: true }).setView([lat, lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '', maxZoom: 19,
  }).addTo(map)

  const greenIcon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:#2DB84B;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(45,184,75,0.5);border:3px solid white"></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36],
  })

  marker = L.marker([lat, lng], { icon: greenIcon, draggable: true }).addTo(map)

  map.on('click', (e) => {
    marker.setLatLng(e.latlng)
    debouncedGetAddress(e.latlng.lat, e.latlng.lng)
  })
  marker.on('dragend', () => {
    const pos = marker.getLatLng()
    debouncedGetAddress(pos.lat, pos.lng)
  })

  getAddress(lat, lng)
}

onMounted(() => {
  if (!isAuthenticated.value) { navigate('register'); return }

  locationStatus.value = t('checkout.detecting_location')
  addressText.value = t('checkout.detecting_address')

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationStatus.value = '✅ ' + t('checkout.location_detected')
        initMap(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        locationStatus.value = '📍 ' + t('checkout.location_default')
        initMap(DEFAULT_LAT, DEFAULT_LNG)
      },
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

function placeOrder() {
  if (!isAuthenticated.value) { navigate('register'); return }
  clearCart()
  navigate('orders')
}
</script>

<template>
  <div class="min-h-screen" style="background: var(--bg-app)">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('cart')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('checkout.title') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-3 pb-32 flex flex-col gap-3">
      <!-- Map -->
      <div class="rounded-2xl overflow-hidden relative" style="height: 200px; box-shadow: 0 2px 12px var(--shadow)">
        <div id="leaflet-map" style="width: 100%; height: 100%; z-index: 1;"></div>
        <div class="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-1 rounded-lg"
          style="z-index: 999; background: var(--surface); color: var(--text-secondary); box-shadow: 0 2px 6px var(--shadow-lg)">
          {{ locationStatus }}
        </div>
      </div>

      <!-- Delivery info -->
      <div class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <div class="flex items-center justify-between px-4 py-3.5 border-b" style="border-color: var(--border)">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-width="2"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke-width="2"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('checkout.home') }}</p>
              <p class="text-xs font-bold truncate max-w-[220px]" style="color: var(--text-primary)">{{ addressText }}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between px-4 py-3.5 border-b" style="border-color: var(--border)">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
              </svg>
            </div>
            <div>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('checkout.phone') }}</p>
              <p class="text-xs font-bold" style="color: var(--text-primary)">+998 959 45 11</p>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between px-4 py-3.5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('checkout.delivery_time') }}</p>
              <p class="text-xs font-bold" style="color: var(--text-primary)">{{ t('checkout.delivery_minutes') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment -->
      <div class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="px-4 pt-3.5 pb-1 text-xs font-black" style="color: var(--text-primary)">{{ t('checkout.payment') }}</p>
        <div v-for="(method, idx) in paymentMethods" :key="method.id"
          @click="selectedPayment = method.id"
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
    </div>

    <!-- Order button -->
    <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 z-30 safe-bottom"
      style="background: var(--surface); box-shadow: 0 -4px 20px var(--shadow)">
      <button @click="placeOrder" class="w-full banner-bg text-white font-black text-base py-4 rounded-2xl btn-press"
        style="box-shadow: 0 6px 24px var(--primary-glow)">{{ t('checkout.place_order') }}</button>
    </div>
  </div>
</template>
