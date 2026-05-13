<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from '../i18n/index.js'
import { useAddresses } from '../stores/addressStore.js'
import { useRouter } from '../router/index.js'
import { useSearchStore } from '../stores/searchStore.js'

const { t, getLocalizedName } = useI18n()
const { addresses } = useAddresses()
const { navigate } = useRouter()
const { history, addToHistory, removeFromHistory, clearHistory, runSearch } = useSearchStore()

const showDropdown = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const isSearchFocused = ref(false)
const isSearching = ref(false)
let searchTimer = null
let searchSeq = 0

const trimmedQuery = computed(() => searchQuery.value.trim())
const showHistory = computed(() => isSearchFocused.value && !trimmedQuery.value && history.value.length > 0)
const showResults = computed(() => isSearchFocused.value && trimmedQuery.value.length > 0)
const panelOpen = computed(() => showHistory.value || showResults.value)

const currentAddress = computed(() => {
  const def = addresses.value.find(a => a.isDefault)
  return def ? def.address : 'Marhamat shahri'
})

const currentLabel = computed(() => {
  const def = addresses.value.find(a => a.isDefault)
  return def ? def.label : t('header.current_location')
})

function selectAddress(addr) {
  const { setDefault } = useAddresses()
  setDefault(addr.id)
  showDropdown.value = false
}

function goToAddresses() {
  showDropdown.value = false
  navigate('addresses')
}

function onSearchInput() {
  clearTimeout(searchTimer)
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    isSearching.value = false
    return
  }
  isSearching.value = true
  const seq = ++searchSeq
  searchTimer = setTimeout(async () => {
    const items = await runSearch(q)
    if (seq !== searchSeq) return
    searchResults.value = items
    isSearching.value = false
  }, 250)
}

function onSearchFocus() {
  isSearchFocused.value = true
}

function closeSearch() {
  isSearchFocused.value = false
}

function clearQuery() {
  searchQuery.value = ''
  searchResults.value = []
  isSearching.value = false
  nextTick(() => {
    const input = document.querySelector('.search-bar input')
    input?.focus()
  })
}

function goToProduct(product) {
  if (trimmedQuery.value) addToHistory(trimmedQuery.value)
  searchQuery.value = ''
  searchResults.value = []
  isSearchFocused.value = false
  navigate('product', { productId: product.id })
}

function applyHistory(entry) {
  searchQuery.value = entry
  onSearchInput()
}
</script>

<template>
  <header class="px-4 pt-3 pb-3 sticky top-0 z-30 header-glass">
    <!-- Location -->
    <div class="flex items-center justify-between mb-2.5 relative">
      <div class="flex items-center gap-2.5 cursor-pointer btn-press" @click="showDropdown = !showDropdown">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
          <svg width="14" height="14" class="text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-medium tracking-wider uppercase" style="color: var(--text-tertiary)">{{ currentLabel }}</p>
          <div class="flex items-center gap-0.5">
            <p class="text-sm font-bold leading-tight truncate" style="color: var(--text-primary)">{{ currentAddress }}</p>
            <svg width="14" height="14" class="flex-shrink-0 transition-transform duration-300" :style="{ color: 'var(--text-tertiary)', transform: showDropdown ? 'rotate(180deg)' : '' }" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Address dropdown -->
    <Transition name="slide-up">
      <div v-if="showDropdown" class="mb-3 rounded-2xl overflow-hidden"
        style="background: var(--surface); box-shadow: 0 8px 32px var(--shadow-lg); border: 1px solid var(--border)">
        <div v-if="addresses.length">
          <div v-for="addr in addresses" :key="addr.id" @click="selectAddress(addr)"
            class="flex items-center gap-3 px-4 py-3.5 btn-press border-b" :style="{ borderColor: 'var(--border)' }">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" :style="{ background: addr.isDefault ? 'var(--primary-light)' : 'var(--surface-secondary)' }">
              <svg width="16" height="16" :class="addr.isDefault ? 'text-primary' : ''" :style="!addr.isDefault ? 'color: var(--text-tertiary)' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold" style="color: var(--text-primary)">{{ addr.label }}</p>
              <p class="text-[10px] font-medium truncate" style="color: var(--text-tertiary)">{{ addr.address }}</p>
            </div>
            <svg v-if="addr.isDefault" width="16" height="16" class="text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
        <button @click="goToAddresses" class="w-full flex items-center gap-3 px-4 py-3.5 btn-press">
          <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
          </div>
          <span class="text-xs font-bold text-primary">{{ t('addresses.add_new') }}</span>
        </button>
      </div>
    </Transition>

    <!-- Search -->
    <div class="relative">
      <div class="flex items-center rounded-2xl px-4 py-3 gap-2.5 transition-all duration-200 search-bar"
        :class="{ 'search-active': panelOpen }">
        <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          @focus="onSearchFocus"
          type="text"
          :placeholder="t('header.search_placeholder')"
          class="bg-transparent outline-none text-sm font-medium flex-1"
          style="color: var(--text-primary)"
        />
        <button v-if="searchQuery" @click="clearQuery" class="btn-press p-1" :aria-label="t('common.clear')">
          <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- History panel (focused, no query) -->
      <div v-if="showHistory" class="search-panel">
        <div class="flex items-center justify-between px-4 pt-3 pb-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary)">{{ t('search.recent') }}</p>
          <button @click="clearHistory" class="text-[11px] font-semibold btn-press" style="color: var(--primary)">{{ t('search.clear_all') }}</button>
        </div>
        <div v-for="entry in history" :key="entry"
          @click="applyHistory(entry)"
          class="flex items-center gap-3 px-4 py-2.5 btn-press">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--surface-secondary)">
            <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke-width="2"/>
              <path d="M12 7v5l3 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="flex-1 min-w-0 text-sm font-medium truncate" style="color: var(--text-primary)">{{ entry }}</span>
          <button @click.stop="removeFromHistory(entry)" class="btn-press p-1" :aria-label="t('common.clear')">
            <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <!-- Results panel -->
      <div v-else-if="showResults" class="search-panel">
        <div v-if="isSearching && !searchResults.length" class="flex items-center gap-3 px-4 py-4">
          <div class="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style="border-color: var(--primary); border-top-color: transparent;"></div>
          <p class="text-xs font-medium" style="color: var(--text-secondary)">{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="!searchResults.length" class="px-4 py-5 text-center">
          <p class="text-sm font-semibold" style="color: var(--text-primary)">{{ t('search.no_results') }}</p>
          <p class="text-[11px] font-medium mt-1" style="color: var(--text-tertiary)">{{ t('search.try_different') }}</p>
        </div>
        <div v-for="product in searchResults.slice(0, 8)" :key="product.id"
          @click="goToProduct(product)"
          class="flex items-center gap-3 px-4 py-3 btn-press border-b" :style="{ borderColor: 'var(--border)' }">
          <img v-if="product.image" :src="product.image" class="w-11 h-11 rounded-xl object-contain flex-shrink-0" style="background: var(--surface-secondary)" />
          <div v-else class="w-11 h-11 rounded-xl flex-shrink-0" style="background: var(--surface-secondary)"></div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold truncate" style="color: var(--text-primary)">{{ getLocalizedName(product.name) }}</p>
            <p class="text-[10px] font-medium" style="color: var(--text-secondary)">{{ product.price ? product.price.toLocaleString() + " so'm" : '' }}</p>
          </div>
          <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </header>

  <!-- Backdrops -->
  <Teleport to="#app">
    <div v-if="showDropdown" class="fixed inset-0 z-20" @click="showDropdown = false"></div>
    <div v-if="panelOpen" class="fixed inset-0 z-20" @click="closeSearch"></div>
  </Teleport>
</template>

<style scoped>
.header-glass {
  background: rgba(245, 250, 247, 0.88);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border);
}
:root.dark .header-glass, .dark .header-glass {
  background: rgba(10, 15, 12, 0.88);
}

.search-bar {
  background: var(--surface-secondary);
  border: 1.5px solid transparent;
}
.search-bar:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.08);
}
.search-active {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.08);
}

.search-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 8px;
  border-radius: 16px;
  overflow: hidden;
  z-index: 50;
  background: var(--surface);
  box-shadow: 0 12px 48px var(--shadow-lg);
  border: 1px solid var(--border);
  max-height: 360px;
  overflow-y: auto;
}
</style>
