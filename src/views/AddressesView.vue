<script setup>
import { ref, onUnmounted, nextTick } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAddresses } from '../stores/addressStore.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { addresses, addAddress, removeAddress, setDefault } = useAddresses()

// Marhamat, Andijan, Uzbekistan
const DEFAULT_LAT = 40.5553
const DEFAULT_LNG = 71.4742

const showMapPicker = ref(false)
const pickedAddress = ref('')
const pickingStatus = ref('')
const selectedLabel = ref('home')
const customLabel = ref('')
const comment = ref('')

const labels = [
  { id: 'home', emoji: '🏠', nameKey: 'addresses.label_home' },
  { id: 'work', emoji: '💼', nameKey: 'addresses.label_work' },
  { id: 'other', emoji: '📍', nameKey: 'addresses.label_other' },
]

let map = null
let marker = null
let abortCtrl = null
let debounce = null

async function reverseGeocode(lat, lng) {
  if (abortCtrl) abortCtrl.abort()
  abortCtrl = new AbortController()
  pickingStatus.value = t('checkout.detecting_address')
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`,
      { signal: abortCtrl.signal }
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    if (data?.display_name) {
      const road = data.address?.road || data.address?.pedestrian || ''
      const house = data.address?.house_number || ''
      const city = data.address?.city || data.address?.town || ''
      pickedAddress.value = road
        ? `${road}${house ? ' ' + house : ''}${city ? ', ' + city : ''}`
        : data.display_name.split(',').slice(0, 3).join(',')
    }
    pickingStatus.value = ''
  } catch (e) {
    if (e.name !== 'AbortError') {
      pickedAddress.value = t('checkout.address_unknown')
      pickingStatus.value = ''
    }
  }
}

function debouncedGeo(lat, lng) {
  clearTimeout(debounce)
  debounce = setTimeout(() => reverseGeocode(lat, lng), 300)
}

function openMapPicker() {
  showMapPicker.value = true
  pickedAddress.value = ''
  pickingStatus.value = ''
  selectedLabel.value = 'home'
  customLabel.value = ''
  comment.value = ''

  nextTick(() => {
    map = L.map('address-map', { zoomControl: true }).setView([DEFAULT_LAT, DEFAULT_LNG], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '', maxZoom: 19 }).addTo(map)

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;background:#2DB84B;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(45,184,75,0.5);border:3px solid white"></div>`,
      iconSize: [36, 36], iconAnchor: [18, 36],
    })

    marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { icon, draggable: true }).addTo(map)

    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      debouncedGeo(e.latlng.lat, e.latlng.lng)
    })
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      debouncedGeo(pos.lat, pos.lng)
    })

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          map.setView([latitude, longitude], 16)
          marker.setLatLng([latitude, longitude])
          reverseGeocode(latitude, longitude)
        },
        () => reverseGeocode(DEFAULT_LAT, DEFAULT_LNG),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else {
      reverseGeocode(DEFAULT_LAT, DEFAULT_LNG)
    }
  })
}

function closeMapPicker() {
  if (map) { map.remove(); map = null }
  if (abortCtrl) abortCtrl.abort()
  clearTimeout(debounce)
  showMapPicker.value = false
}

function saveAddress() {
  if (!pickedAddress.value || pickingStatus.value || !marker) return
  const labelObj = labels.find(l => l.id === selectedLabel.value)
  const label = selectedLabel.value === 'other' && customLabel.value.trim()
    ? customLabel.value.trim()
    : t(labelObj.nameKey)
  const pos = marker.getLatLng()
  addAddress({
    label,
    address: pickedAddress.value,
    lat: pos.lat,
    lng: pos.lng,
    comment: comment.value.trim(),
  })
  closeMapPicker()
}

onUnmounted(() => {
  if (map) { map.remove(); map = null }
  if (abortCtrl) abortCtrl.abort()
  clearTimeout(debounce)
})
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('addresses.title') }}</p>
      <button @click="openMapPicker" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press bg-primary">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="px-4 mt-4 flex flex-col gap-3">
      <div v-for="addr in addresses" :key="addr.id"
        class="rounded-2xl p-4 flex items-center gap-3"
        :style="{ background: 'var(--surface)', boxShadow: addr.isDefault ? '0 0 0 2px var(--primary), 0 2px 12px var(--shadow)' : '0 2px 12px var(--shadow)' }">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ addr.label }}</p>
            <span v-if="addr.isDefault" class="text-[9px] font-black text-primary px-1.5 py-0.5 rounded-md" style="background: var(--primary-light)">{{ t('addresses.default') }}</span>
          </div>
          <p class="text-xs font-semibold truncate mt-0.5" style="color: var(--text-tertiary)">{{ addr.address }}</p>
        </div>
        <div class="flex gap-1.5 flex-shrink-0">
          <button v-if="!addr.isDefault" @click="setDefault(addr.id)" class="w-8 h-8 rounded-lg flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button @click="removeAddress(addr.id)" class="w-8 h-8 rounded-lg flex items-center justify-center btn-press bg-red-500/10">
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <div v-if="!addresses.length" class="flex flex-col items-center py-20">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-4" style="background: var(--primary-light)">
          <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/>
          </svg>
        </div>
        <p class="text-lg font-black" style="color: var(--text-primary)">{{ t('addresses.empty_title') }}</p>
        <p class="text-sm font-semibold mt-1 text-center" style="color: var(--text-tertiary)">{{ t('addresses.empty_subtitle') }}</p>
        <button @click="openMapPicker" class="mt-5 bg-primary text-white font-black px-6 py-3 rounded-2xl btn-press" style="box-shadow: 0 4px 16px var(--primary-glow)">{{ t('addresses.add_new') }}</button>
      </div>
    </div>

    <!-- Map picker full screen -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showMapPicker" class="fixed inset-0 z-[100] flex flex-col" style="background: var(--bg-app)">
          <div class="flex items-center justify-between px-4 py-3" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
            <button @click="closeMapPicker" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
              <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <p class="text-base font-black" style="color: var(--text-primary)">{{ t('addresses.pick_on_map') }}</p>
            <div class="w-9"></div>
          </div>

          <div class="flex-1 relative" style="min-height: 200px">
            <div id="address-map" style="width: 100%; height: 100%;"></div>
          </div>

          <div class="px-4 pt-4 pb-6 safe-bottom overflow-y-auto" style="background: var(--surface); box-shadow: 0 -4px 20px var(--shadow); max-height: 55vh;">
            <!-- Address -->
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('addresses.selected_address') }}</p>
                <p class="text-sm font-bold truncate" style="color: var(--text-primary)">{{ pickingStatus || pickedAddress || t('addresses.tap_map') }}</p>
              </div>
            </div>

            <!-- Labels -->
            <p class="text-xs font-bold mb-2" style="color: var(--text-secondary)">{{ t('addresses.choose_label') }}</p>
            <div class="flex gap-2 mb-3">
              <button v-for="lbl in labels" :key="lbl.id" @click="selectedLabel = lbl.id"
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl btn-press transition-all text-sm font-bold"
                :style="{ background: selectedLabel === lbl.id ? 'var(--primary)' : 'var(--surface-secondary)', color: selectedLabel === lbl.id ? 'white' : 'var(--text-primary)' }">
                <span>{{ lbl.emoji }}</span><span>{{ t(lbl.nameKey) }}</span>
              </button>
            </div>

            <input v-if="selectedLabel === 'other'" v-model="customLabel" :placeholder="t('addresses.custom_label')"
              class="w-full text-sm font-bold px-4 py-2.5 rounded-xl outline-none mb-3" style="background: var(--surface-secondary); color: var(--text-primary)" />

            <!-- Comment -->
            <p class="text-xs font-bold mb-2" style="color: var(--text-secondary)">{{ t('addresses.comment') }}</p>
            <textarea v-model="comment" :placeholder="t('addresses.comment_placeholder')" rows="2"
              class="w-full text-sm font-semibold px-4 py-2.5 rounded-xl outline-none resize-none mb-3"
              style="background: var(--surface-secondary); color: var(--text-primary)"></textarea>

            <!-- Save -->
            <button @click="saveAddress" :disabled="!pickedAddress || !!pickingStatus"
              class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press transition-opacity"
              :class="{ 'opacity-50': !pickedAddress || !!pickingStatus }"
              style="box-shadow: 0 6px 24px var(--primary-glow)">{{ t('addresses.save_address') }}</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
