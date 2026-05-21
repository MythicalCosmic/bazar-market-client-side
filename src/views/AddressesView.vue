<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAddresses } from '../stores/addressStore.js'
import { updateAddressAPI } from '../services/api.js'
import { useToast } from '../composables/useToast.js'
import { ensureLeaflet } from '../composables/useLeaflet.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { addresses, addAddress, removeAddress, setDefault, loadAddresses } = useAddresses()
const { error: toastError } = useToast()

const DEFAULT_LAT = 40.5553
const DEFAULT_LNG = 71.4742

const showMapPicker = ref(false)
const pickedAddress = ref('')
const pickingStatus = ref('')
const selectedLabel = ref('home')
const customLabel = ref('')
const comment = ref('')
const editingId = ref(null)
const isSaving = ref(false)
const mapError = ref('')

const deleteTarget = ref(null)
const isDeleting = ref(false)

const labels = [
  { id: 'home', nameKey: 'addresses.label_home' },
  { id: 'work', nameKey: 'addresses.label_work' },
  { id: 'other', nameKey: 'addresses.label_other' },
]

let map = null
let marker = null
let abortCtrl = null
let debounce = null

onMounted(() => loadAddresses())

async function reverseGeocode(lat, lng) {
  if (abortCtrl) abortCtrl.abort()
  abortCtrl = new AbortController()
  pickingStatus.value = t('checkout.detecting_address')
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`, { signal: abortCtrl.signal })
    if (!res.ok) throw new Error()
    const data = await res.json()
    if (data?.display_name) {
      const road = data.address?.road || data.address?.pedestrian || ''
      const house = data.address?.house_number || ''
      const city = data.address?.city || data.address?.town || ''
      pickedAddress.value = road ? `${road}${house ? ' ' + house : ''}${city ? ', ' + city : ''}` : data.display_name.split(',').slice(0, 3).join(',')
    }
    pickingStatus.value = ''
  } catch (e) {
    if (e.name !== 'AbortError') { pickedAddress.value = t('checkout.address_unknown'); pickingStatus.value = '' }
  }
}

function debouncedGeo(lat, lng) { clearTimeout(debounce); debounce = setTimeout(() => reverseGeocode(lat, lng), 300) }

async function setupMap(lat, lng) {
  let L
  try {
    L = await ensureLeaflet()
  } catch {
    mapError.value = t('addresses.map_unavailable')
    return
  }
  mapError.value = ''
  map = L.map('address-map', { zoomControl: true }).setView([lat, lng], 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '', maxZoom: 19 }).addTo(map)
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;background:#0F5132;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(15,81,50,0.5);border:2px solid #F5EFE3"></div>`,
    iconSize: [32, 32], iconAnchor: [16, 32],
  })
  marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
  map.on('click', (e) => { marker.setLatLng(e.latlng); debouncedGeo(e.latlng.lat, e.latlng.lng) })
  marker.on('dragend', () => { const pos = marker.getLatLng(); debouncedGeo(pos.lat, pos.lng) })
}

function openMapPicker(addr = null) {
  editingId.value = addr ? addr.id : null
  pickedAddress.value = addr ? addr.address : ''
  pickingStatus.value = ''
  comment.value = addr ? (addr.comment || '') : ''

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
    if (!map) return

    if (addr?.lat && addr?.lng) {
      map.setView([startLat, startLng], 16)
      reverseGeocode(startLat, startLng)
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { map.setView([pos.coords.latitude, pos.coords.longitude], 16); marker.setLatLng([pos.coords.latitude, pos.coords.longitude]); reverseGeocode(pos.coords.latitude, pos.coords.longitude) },
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

async function saveAddress() {
  if (isSaving.value) return
  if (!pickedAddress.value || pickingStatus.value || !marker) return
  const labelObj = labels.find(l => l.id === selectedLabel.value)
  if (!labelObj) return
  const label = selectedLabel.value === 'other' && customLabel.value.trim()
    ? customLabel.value.trim()
    : t(labelObj.nameKey)
  const pos = marker.getLatLng()
  isSaving.value = true
  try {
    if (editingId.value) {
      await updateAddressAPI(editingId.value, {
        label, address_text: pickedAddress.value,
        latitude: pos.lat, longitude: pos.lng,
        comment: comment.value.trim(),
      })
      await loadAddresses(true)
    } else {
      await addAddress({ label, address: pickedAddress.value, lat: pos.lat, lng: pos.lng, comment: comment.value.trim() })
    }
    closeMapPicker()
  } catch (e) {
    toastError(e.message || t('common.error_generic'))
  } finally {
    isSaving.value = false
  }
}

function askDelete(addr) { deleteTarget.value = addr }

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
  if (map) { map.remove(); map = null }
  if (abortCtrl) abortCtrl.abort()
  clearTimeout(debounce)
})
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">
    <!-- Editorial header -->
    <div class="px-5 pt-5 pb-3">
      <div class="flex items-center justify-between mb-3">
        <button @click="navigate('profile')" class="flex items-center gap-2 btn-press">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="eyebrow-sm">{{ t('ed.profile_word') }}</span>
        </button>
        <button @click="openMapPicker()" class="add-btn btn-press">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ t('ed.add_new_short') }}</span>
        </button>
      </div>
      <div class="flex items-center gap-2 mb-2">
        <span class="num-label text-[11px] tabular">№ {{ String(addresses.length || 0).padStart(2, '0') }}</span>
        <span class="block w-4 h-px" style="background: var(--hairline)"></span>
        <p class="eyebrow-sm">{{ t('ed.delivery_label') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.your_addr_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.addr_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div class="px-5 mt-5">
      <div v-if="addresses.length" class="flex flex-col">
        <div v-for="(addr, idx) in addresses" :key="addr.id" class="address-card" :class="{ 'address-card-default': addr.isDefault }">
          <div class="flex items-start gap-3">
            <span class="num-label text-[13px] flex-shrink-0 mt-0.5">0{{ idx + 1 }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2 mb-1">
                <p class="serif text-[17px]" style="color: var(--text-primary); font-weight: 500">{{ addr.label }}</p>
                <span v-if="addr.isDefault" class="eyebrow-sm" style="color: var(--primary)">{{ t('ed.default_word') }}</span>
              </div>
              <p class="text-[13px] truncate" style="color: var(--text-secondary)">{{ addr.address }}</p>
              <p v-if="addr.comment" class="serif-italic text-[11.5px] mt-1" style="color: var(--text-tertiary)">"{{ addr.comment }}"</p>
            </div>
          </div>
          <div class="flex gap-2 mt-3 pt-3 hairline-top">
            <button v-if="!addr.isDefault" @click="setDefault(addr.id)" class="action-pill btn-press">
              <span class="eyebrow-sm">{{ t('addresses.set_default') }}</span>
            </button>
            <button @click="openMapPicker(addr)" class="action-pill btn-press">
              <span class="eyebrow-sm">{{ t('profile.edit') }}</span>
            </button>
            <button @click="askDelete(addr)" :aria-label="t('addresses.delete')" class="action-pill-danger btn-press">
              <span class="eyebrow-sm" style="color: var(--bordeaux)">{{ t('addresses.delete') }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="px-3 pt-12 text-center">
        <p class="num-label text-[14px] mb-3">— № 00 —</p>
        <h2 class="display text-[24px] mb-2" style="color: var(--text-primary)">{{ t('addresses.empty_title') }}</h2>
        <p class="serif-italic text-[14px] leading-relaxed mb-6" style="color: var(--text-secondary)">{{ t('addresses.empty_subtitle') }}</p>
        <button @click="openMapPicker()" class="empty-cta btn-press">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ t('addresses.add_new') }}</span>
        </button>
      </div>
    </div>

    <!-- Delete confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="deleteTarget" class="fixed inset-0 z-[120] flex items-end justify-center" style="background: rgba(26, 38, 32, 0.55); backdrop-filter: blur(8px)" @click.self="deleteTarget = null">
          <div class="w-full max-w-[480px] confirm-sheet safe-bottom">
            <div class="text-center mb-5">
              <p class="num-label text-[12px] mb-2" style="color: var(--bordeaux)">— {{ t('ed.confirm_word') }} —</p>
              <h3 class="display text-[22px]" style="color: var(--text-primary)">{{ t('addresses.delete_confirm_title') }}</h3>
              <p class="serif-italic text-[13px] mt-2" style="color: var(--text-secondary)">{{ deleteTarget?.label }} — {{ deleteTarget?.address }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="deleteTarget = null" :disabled="isDeleting" class="confirm-cancel btn-press">
                <span class="eyebrow-sm">{{ t('profile.cancel') }}</span>
              </button>
              <button @click="confirmDelete" :disabled="isDeleting" class="confirm-action btn-press">
                <span class="eyebrow-sm" style="color: var(--cream)">{{ isDeleting ? t('common.loading') : t('addresses.delete_yes') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Map picker -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showMapPicker" class="fixed inset-0 z-[100] flex flex-col" style="background: var(--bg-app)">
          <div class="px-5 py-4 flex items-center justify-between" style="background: var(--surface); border-bottom: 1px solid var(--hairline)">
            <button @click="closeMapPicker" class="flex items-center gap-2 btn-press">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="eyebrow-sm">{{ t('ed.back_word') }}</span>
            </button>
            <p class="eyebrow">{{ editingId ? t('profile.edit') : t('addresses.pick_on_map') }}</p>
          </div>

          <div class="flex-1 relative" style="min-height: 200px">
            <div id="address-map" style="width: 100%; height: 100%;"></div>
            <div v-if="mapError" class="absolute inset-0 flex items-center justify-center px-6 text-center serif-italic" style="background: var(--surface); color: var(--text-secondary)">
              {{ mapError }}
            </div>
          </div>

          <div class="px-5 pt-5 pb-6 safe-bottom overflow-y-auto" style="background: var(--surface); border-top: 1px solid var(--hairline); max-height: 55vh;">
            <p class="eyebrow-sm mb-1">{{ t('addresses.selected_address') }}</p>
            <p class="serif text-[15px] mb-4 truncate" style="color: var(--text-primary); font-weight: 500">{{ pickingStatus || pickedAddress || t('addresses.tap_map') }}</p>

            <p class="eyebrow-sm mb-2">{{ t('addresses.choose_label') }}</p>
            <div class="flex gap-2 mb-4">
              <button v-for="lbl in labels" :key="lbl.id" @click="selectedLabel = lbl.id"
                class="label-chip btn-press"
                :class="{ 'label-chip-active': selectedLabel === lbl.id }">
                <span class="eyebrow-sm" :style="{ color: selectedLabel === lbl.id ? 'var(--cream)' : 'var(--text-primary)' }">{{ t(lbl.nameKey) }}</span>
              </button>
            </div>

            <input v-if="selectedLabel === 'other'" v-model="customLabel" :placeholder="t('addresses.custom_label')" class="form-input mb-4" />

            <p class="eyebrow-sm mb-2">{{ t('addresses.comment') }}</p>
            <textarea v-model="comment" :placeholder="t('addresses.comment_placeholder')" rows="2" class="form-input mb-5"></textarea>

            <button @click="saveAddress" :disabled="!pickedAddress || !!pickingStatus || isSaving"
              class="save-btn btn-press"
              :class="{ 'opacity-50': !pickedAddress || !!pickingStatus || isSaving }">
              <span class="eyebrow-sm" style="color: var(--cream)">{{ isSaving ? t('common.loading') : (editingId ? t('profile.save') : t('addresses.save_address')) }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.add-btn {
  padding: 8px 14px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}

.address-card {
  padding: 16px 18px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-bottom: none;
}
.address-card:last-child {
  border-bottom: 1px solid var(--hairline);
}
.address-card-default {
  border-left: 2px solid var(--primary);
}
.hairline-top {
  border-top: 1px solid var(--hairline);
}

.action-pill {
  padding: 7px 12px;
  background: transparent;
  border: 1px solid var(--hairline);
  cursor: pointer;
}
.action-pill-danger {
  padding: 7px 12px;
  background: transparent;
  border: 1px solid var(--bordeaux-light);
  cursor: pointer;
  margin-left: auto;
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  padding: 14px 24px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}

.label-chip {
  padding: 8px 14px;
  background: transparent;
  border: 1px solid var(--hairline);
  cursor: pointer;
}
.label-chip-active {
  background: var(--surface-ink);
  border-color: var(--surface-ink);
}

.form-input {
  width: 100%;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-style: italic;
  font-size: 14px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  outline: none;
  color: var(--text-primary);
  resize: none;
  transition: border-color 0.2s ease;
}
.form-input:focus {
  border-color: var(--text-primary);
}

.save-btn {
  width: 100%;
  padding: 16px 0;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
}

.confirm-sheet {
  background: var(--surface);
  padding: 28px 22px 24px;
  border-top: 1px solid var(--hairline);
}
.confirm-cancel,
.confirm-action {
  flex: 1;
  padding: 14px 0;
  background: var(--surface);
  border: 1px solid var(--hairline);
  cursor: pointer;
  text-align: center;
}
.confirm-action {
  background: var(--bordeaux);
  border-color: var(--bordeaux);
}
</style>
