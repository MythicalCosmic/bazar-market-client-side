<script setup>
// src/views/CheckoutView.vue
import { ref, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'

const { total, clearCart } = useCartStore()
const { formatNum } = useFormat()
const { navigate } = useRouter()

const selectedPayment = ref('payme')
const locationStatus = ref('Определяем местоположение...')
const addressText = ref('Определяем адрес...')

const paymentMethods = [
  { id: 'click', label: 'Click',                  emoji: '💳' },
  { id: 'payme', label: 'Payme',                  emoji: '💚' },
  { id: 'cash',  label: 'Наличными при доставке', emoji: '💵' },
]

const DEFAULT_LAT = 41.2995
const DEFAULT_LNG = 69.2401

let map = null
let marker = null

// Получаем адрес по координатам через OpenStreetMap Nominatim
async function getAddress(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`
    )
    const data = await res.json()
    if (data && data.display_name) {
      // Берём только улицу и номер дома
      const road = data.address?.road || data.address?.pedestrian || ''
      const house = data.address?.house_number || ''
      const city = data.address?.city || data.address?.town || ''
      if (road) {
        addressText.value = `${road}${house ? ' ' + house : ''}${city ? ', ' + city : ''}`
      } else {
        addressText.value = data.display_name.split(',').slice(0, 2).join(',')
      }
    }
  } catch {
    addressText.value = 'Адрес не определён'
  }
}

function initMap(lat, lng) {
  map = L.map('leaflet-map', { zoomControl: true }).setView([lat, lng], 16)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  const greenIcon = L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px;
        background: #2DB84B;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(45,184,75,0.5);
        border: 3px solid white;
      "></div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  })

  marker = L.marker([lat, lng], { icon: greenIcon, draggable: true }).addTo(map)
  marker.bindPopup('<b>Вы здесь</b>').openPopup()

  // Клик по карте — перемещает маркер и обновляет адрес
  map.on('click', async (e) => {
    marker.setLatLng(e.latlng)
    addressText.value = 'Определяем адрес...'
    await getAddress(e.latlng.lat, e.latlng.lng)
    marker.bindPopup(`<b>${addressText.value}</b>`).openPopup()
  })

  // Перетаскивание маркера — обновляет адрес
  marker.on('dragend', async () => {
    const pos = marker.getLatLng()
    addressText.value = 'Определяем адрес...'
    await getAddress(pos.lat, pos.lng)
    marker.bindPopup(`<b>${addressText.value}</b>`).openPopup()
  })

  // Сразу получаем адрес начальной точки
  getAddress(lat, lng)
}

onMounted(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        locationStatus.value = '✅ Местоположение определено'
        initMap(lat, lng)
      },
      () => {
        locationStatus.value = '📍 Ташкент (по умолчанию)'
        initMap(DEFAULT_LAT, DEFAULT_LNG)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    )
  } else {
    locationStatus.value = '❌ Геолокация недоступна'
    initMap(DEFAULT_LAT, DEFAULT_LNG)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

function placeOrder() {
  clearCart()
  navigate('orders')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-32">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-20"
      style="box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <button @click="navigate('cart')"
        class="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center btn-press">
        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="text-base font-black text-gray-900">Чек</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-3 flex flex-col gap-3">

      <!-- Leaflet Map -->
      <div class="rounded-2xl overflow-hidden relative"
        style="height: 180px; box-shadow: 0 2px 12px rgba(0,0,0,0.07)">
        <div id="leaflet-map" style="width: 100%; height: 100%; z-index: 1;"></div>

        <!-- Статус геолокации снизу -->
        <div class="absolute bottom-2 left-2 bg-white text-[10px] font-bold text-gray-600 px-2 py-1 rounded-lg"
          style="z-index: 999; box-shadow: 0 2px 6px rgba(0,0,0,0.15)">
          {{ locationStatus }}
        </div>

        <!-- Кнопка изменить -->
        <button
          class="absolute top-2 right-2 bg-white text-xs font-bold px-3 py-1.5 rounded-xl shadow btn-press"
          style="z-index: 999">
          Изменить
        </button>
      </div>

      <!-- Delivery info -->
      <div class="bg-white rounded-2xl overflow-hidden"
        style="box-shadow: 0 2px 12px rgba(0,0,0,0.06)">

        <!-- Address — меняется динамически -->
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-width="2"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke-width="2"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] text-gray-400 font-semibold">Дом</p>
              <!-- ВОТ ТУТ — текст меняется -->
              <p class="text-xs font-bold text-gray-800 truncate max-w-[220px]">
                {{ addressText }}
              </p>
            </div>
          </div>
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Phone -->
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
              </svg>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 font-semibold">Телефон</p>
              <p class="text-xs font-bold text-gray-800">+998 959 45 11</p>
            </div>
          </div>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Time -->
        <div class="flex items-center justify-between px-4 py-3.5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 font-semibold">Время доставки</p>
              <p class="text-xs font-bold text-gray-800">25-30 мин</p>
            </div>
          </div>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <!-- Payment methods -->
      <div class="bg-white rounded-2xl overflow-hidden"
        style="box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
        <div
          v-for="(method, idx) in paymentMethods"
          :key="method.id"
          @click="selectedPayment = method.id"
          :class="['flex items-center justify-between px-4 py-3.5 btn-press',
            idx < paymentMethods.length - 1 ? 'border-b border-gray-50' : '']"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ method.emoji }}</span>
            <span class="text-sm font-bold text-gray-800">{{ method.label }}</span>
          </div>
          <div :style="{
            width: '20px', height: '20px', borderRadius: '50%',
            border: selectedPayment === method.id ? '2px solid #2DB84B' : '2px solid #ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.15s'
          }">
            <div v-if="selectedPayment === method.id" style="
              width: 10px; height: 10px; border-radius: 50%; background: #2DB84B;
            "></div>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div class="flex items-center justify-between px-1 py-2">
        <span class="text-base font-black text-gray-900">Общее</span>
        <span class="text-base font-black text-gray-900">{{ formatNum(total) }} Сум</span>
      </div>

    </div>
  </div>

  <!-- Order button -->
  <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4 pb-6 pt-3 bg-white z-30"
    style="box-shadow: 0 -4px 20px rgba(0,0,0,0.08)">
    <button
      @click="placeOrder"
      class="w-full banner-bg text-white font-black text-base py-4 rounded-2xl btn-press"
      style="box-shadow: 0 6px 24px rgba(45,184,75,0.4)"
    >Заказать</button>
  </div>
</template>