<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAddresses } from '../stores/addressStore.js'
import { updateAddressAPI } from '../services/api.js'
import { useToast } from '../composables/useToast.js'
import { ensureYmaps, reverseGeocode, locateMe, DEFAULT_LAT, DEFAULT_LNG } from '../composables/useYandexMaps.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { addresses, addAddress, removeAddress, setDefault, loadAddresses } = useAddresses()
const { error: toastError } = useToast()

const showMapPicker = ref(false)
const pickedAddress = ref('')
const pickingStatus = ref('')
const selectedLabel = ref('home')
const customLabel = ref('')
const comment = ref('')
const editingId = ref(null) // null = adding new, number = editing existing
const isSaving = ref(false)
const mapError = ref('')
const mapMoving = ref(false) // map is being panned → lift the centre pin
const locating = ref(false)  // "find my location" in flight

// Live delivery point — the map centre, kept in sync as the user pans.
const pickedLat = ref(DEFAULT_LAT)
const pickedLng = ref(DEFAULT_LNG)

const deleteTarget = ref(null) // address pending deletion confirmation
const isDeleting = ref(false)

const labels = [
  { id: 'home', emoji: '🏠', nameKey: 'addresses.label_home' },
  { id: 'work', emoji: '💼', nameKey: 'addresses.label_work' },
  { id: 'other', emoji: '📍', nameKey: 'addresses.label_other' },
]

let ymaps = null
let map = null
let debounce = null
let geoSeq = 0

onMounted(() => loadAddresses())

// Resolve the address for a point. Always leaves pickedAddress non-empty so the
// Save button never gets stuck — falls back to "selected point" or the last
// good address rather than a dead-end "not found".
async function geocodeAt(lat, lng) {
  const seq = ++geoSeq
  pickingStatus.value = t('checkout.detecting_address')
  try {
    const line = await reverseGeocode(ymaps, [lat, lng])
    if (seq !== geoSeq) return
    pickedAddress.value = line || pickedAddress.value || t('maps.point_selected')
  } catch {
    if (seq !== geoSeq) return
    pickedAddress.value = pickedAddress.value || t('maps.point_selected')
  }
  if (seq === geoSeq) pickingStatus.value = ''
}

function debouncedGeo(lat, lng) { clearTimeout(debounce); debounce = setTimeout(() => geocodeAt(lat, lng), 350) }

// Centre-pin map: the pin is a fixed HTML overlay, the user pans the map under
// it, and we geocode the map centre on every settle.
async function setupMap(lat, lng) {
  try {
    ymaps = await ensureYmaps()
  } catch {
    mapError.value = t('addresses.map_unavailable')
    return
  }
  mapError.value = ''
  pickedLat.value = lat
  pickedLng.value = lng
  map = new ymaps.Map('address-map',
    { center: [lat, lng], zoom: 17, controls: ['zoomControl'] },
    { suppressMapOpenBlock: true })
  map.events.add('actionbegin', () => { mapMoving.value = true })
  map.events.add('boundschange', () => {
    const c = map.getCenter()
    pickedLat.value = c[0]
    pickedLng.value = c[1]
  })
  // Geocode once the pan/zoom settles, not on every intermediate frame.
  map.events.add('actionend', () => {
    mapMoving.value = false
    const c = map.getCenter()
    debouncedGeo(c[0], c[1])
  })
}

async function useMyLocation() {
  if (locating.value || !map) return
  locating.value = true
  try {
    const c = await locateMe()
    pickedLat.value = c[0]
    pickedLng.value = c[1]
    map.setCenter(c, 17)
    geocodeAt(c[0], c[1])
  } catch {
    toastError(t('maps.locate_failed'))
  } finally {
    locating.value = false
  }
}

function openMapPicker(addr = null) {
  editingId.value = addr ? addr.id : null
  pickedAddress.value = addr ? addr.address : ''
  pickingStatus.value = ''
  comment.value = addr ? (addr.comment || '') : ''

  // Set label
  if (addr) {
    const match = labels.find(l => t(l.nameKey) === addr.label)
    selectedLabel.value = match ? match.id : 'other'
    if (!match) customLabel.value = addr.label
    else customLabel.value = ''
  } else {
    selectedLabel.value = 'home'
    customLabel.value = ''
  }

  showMapPicker.value = true

  nextTick(async () => {
    const startLat = addr?.lat || DEFAULT_LAT
    const startLng = addr?.lng || DEFAULT_LNG
    await setupMap(startLat, startLng)
    if (!map) return // Yandex failed to load

    // Editing → start on the saved address; adding → always Marhamat (no GPS).
    map.setCenter([startLat, startLng], 16)
    geocodeAt(startLat, startLng)
  })
}

function closeMapPicker() {
  if (map) { map.destroy(); map = null }
  clearTimeout(debounce)
  showMapPicker.value = false
}

async function saveAddress() {
  if (isSaving.value) return
  if (!pickedAddress.value || pickingStatus.value || !map) return
  const labelObj = labels.find(l => l.id === selectedLabel.value)
  if (!labelObj) return
  const label = selectedLabel.value === 'other' && customLabel.value.trim()
    ? customLabel.value.trim()
    : t(labelObj.nameKey)
  const lat = pickedLat.value
  const lng = pickedLng.value
  isSaving.value = true
  try {
    if (editingId.value) {
      await updateAddressAPI(editingId.value, {
        label, address_text: pickedAddress.value,
        latitude: lat, longitude: lng,
        comment: comment.value.trim(),
      })
      await loadAddresses(true)
    } else {
      await addAddress({ label, address: pickedAddress.value, lat, lng, comment: comment.value.trim() })
    }
    closeMapPicker()
  } catch (e) {
    toastError(e.message || t('common.error_generic'))
  } finally {
    isSaving.value = false
  }
}

function askDelete(addr) {
  deleteTarget.value = addr
}

async function confirmDelete() {
  if (isDeleting.value || !deleteTarget.value) return
  isDeleting.value = true
  try {
    await removeAddress(deleteTarget.value.id)
  } catch (e) {
    toastError(e.message || t('common.error_generic'))
  } finally {
    isDeleting.value = false
    deleteTarget.value = null
  }
}

onUnmounted(() => {
  if (map) { map.destroy(); map = null }
  clearTimeout(debounce)
})
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg width="20" height="20" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('addresses.title') }}</p>
      <button @click="openMapPicker()" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press bg-primary">
        <svg width="20" height="20" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="px-4 mt-4 flex flex-col gap-3">
      <div v-for="addr in addresses" :key="addr.id"
        class="rounded-2xl p-4"
        :style="{ background: 'var(--surface)', boxShadow: addr.isDefault ? '0 0 0 2px var(--primary), 0 2px 12px var(--shadow)' : '0 2px 12px var(--shadow)' }">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
            <svg width="20" height="20" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-black" style="color: var(--text-primary)">{{ addr.label }}</p>
              <span v-if="addr.isDefault" class="text-[9px] font-black text-primary px-1.5 py-0.5 rounded-md" style="background: var(--primary-light)">{{ t('addresses.default') }}</span>
            </div>
            <p class="text-xs font-semibold truncate mt-0.5" style="color: var(--text-tertiary)">{{ addr.address }}</p>
            <p v-if="addr.comment" class="text-[10px] font-semibold truncate mt-0.5" style="color: var(--text-tertiary)">{{ addr.comment }}</p>
          </div>
        </div>
        <!-- Action buttons -->
        <div class="flex gap-2 mt-3 pt-3 border-t" style="border-color: var(--border)">
          <button v-if="!addr.isDefault" @click="setDefault(addr.id)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl btn-press" style="background: var(--surface-secondary)">
            <svg width="14" height="14" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="text-[10px] font-bold" style="color: var(--text-secondary)">{{ t('addresses.set_default') }}</span>
          </button>
          <button @click="openMapPicker(addr)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl btn-press" style="background: var(--surface-secondary)">
            <svg width="14" height="14" style="color: var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" stroke-width="2"/></svg>
            <span class="text-[10px] font-bold" style="color: var(--text-secondary)">{{ t('profile.edit') }}</span>
          </button>
          <button @click="askDelete(addr)" :aria-label="t('addresses.delete')" class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl btn-press bg-red-500/10">
            <svg width="14" height="14" class="text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <div v-if="!addresses.length" class="flex flex-col items-center py-20">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-4" style="background: var(--primary-light)">
          <svg width="40" height="40" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
        </div>
        <p class="text-lg font-black" style="color: var(--text-primary)">{{ t('addresses.empty_title') }}</p>
        <p class="text-sm font-semibold mt-1 text-center" style="color: var(--text-tertiary)">{{ t('addresses.empty_subtitle') }}</p>
        <button @click="openMapPicker()" class="mt-5 bg-primary text-white font-black px-6 py-3 rounded-2xl btn-press" style="box-shadow: 0 4px 16px var(--primary-glow)">{{ t('addresses.add_new') }}</button>
      </div>
    </div>

    <!-- Delete confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="deleteTarget" class="fixed inset-0 z-[120] flex items-end justify-center" style="background: rgba(0,0,0,0.4)" @click.self="deleteTarget = null">
          <div class="w-full max-w-[480px] rounded-t-[28px] p-6 safe-bottom" style="background: var(--surface)">
            <div class="flex flex-col items-center mb-5">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" style="background: rgba(239,68,68,0.08)">
                <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold" style="color: var(--text-primary)">{{ t('addresses.delete_confirm_title') }}</h3>
              <p class="text-sm font-medium mt-1 text-center" style="color: var(--text-tertiary)">{{ deleteTarget?.label }} — {{ deleteTarget?.address }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="confirmDelete" :disabled="isDeleting" class="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl btn-press transition-opacity" :class="{ 'opacity-60': isDeleting }">{{ isDeleting ? t('common.loading') : t('addresses.delete_yes') }}</button>
              <button @click="deleteTarget = null" :disabled="isDeleting" class="w-full font-bold py-3.5 rounded-2xl btn-press" style="background: var(--surface-secondary); color: var(--text-primary)">{{ t('profile.cancel') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Map picker -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showMapPicker" class="fixed inset-0 z-[100] flex flex-col" style="background: var(--bg-app)">
          <div class="flex items-center justify-between px-4 py-3" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
            <button @click="closeMapPicker" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
              <svg width="20" height="20" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <p class="text-base font-black" style="color: var(--text-primary)">{{ editingId ? t('profile.edit') : t('addresses.pick_on_map') }}</p>
            <div class="w-9"></div>
          </div>

          <div class="flex-1 relative" style="min-height: 200px">
            <div id="address-map" style="width: 100%; height: 100%;"></div>

            <!-- Fixed centre pin: pan the map underneath it -->
            <div v-if="!mapError" class="map-pin" :class="{ lifted: mapMoving }">
              <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
                <path d="M20 47C20 47 36 30.5 36 18C36 8.6 28.8 1 20 1C11.2 1 4 8.6 4 18C4 30.5 20 47 20 47Z" fill="var(--primary)" stroke="white" stroke-width="2"/>
                <circle cx="20" cy="18" r="6.5" fill="white"/>
              </svg>
            </div>
            <div v-if="!mapError" class="map-pin-dot"></div>

            <!-- Find my location -->
            <button v-if="!mapError" @click="useMyLocation" :class="['map-fab btn-press', { busy: locating }]" :aria-label="t('maps.my_location')">
              <svg v-if="!locating" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" stroke-width="2"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2" stroke-width="2" stroke-linecap="round"/></svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" class="animate-spin"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="44" stroke-dashoffset="14" opacity="0.9"/></svg>
            </button>

            <div v-if="mapError" class="absolute inset-0 flex items-center justify-center px-6 text-center text-xs font-semibold" style="background: var(--surface); color: var(--text-secondary)">
              {{ mapError }}
            </div>
          </div>

          <div class="px-4 pt-4 pb-6 safe-bottom overflow-y-auto" style="background: var(--surface); box-shadow: 0 -4px 20px var(--shadow); max-height: 55vh;">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
                <svg width="20" height="20" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('addresses.selected_address') }}</p>
                <p class="text-sm font-bold truncate" style="color: var(--text-primary)">{{ pickingStatus || pickedAddress || t('addresses.tap_map') }}</p>
              </div>
            </div>

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

            <p class="text-xs font-bold mb-2" style="color: var(--text-secondary)">{{ t('addresses.comment') }}</p>
            <textarea v-model="comment" :placeholder="t('addresses.comment_placeholder')" rows="2"
              class="w-full text-sm font-semibold px-4 py-2.5 rounded-xl outline-none resize-none mb-3"
              style="background: var(--surface-secondary); color: var(--text-primary)"></textarea>

            <button @click="saveAddress" :disabled="!pickedAddress || !!pickingStatus || isSaving"
              class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press transition-opacity"
              :class="{ 'opacity-50': !pickedAddress || !!pickingStatus || isSaving }"
              style="box-shadow: 0 6px 24px var(--primary-glow)">
              {{ isSaving ? t('common.loading') : (editingId ? t('profile.save') : t('addresses.save_address')) }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
