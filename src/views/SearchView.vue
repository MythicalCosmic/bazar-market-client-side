<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from '../i18n/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { useSearchStore } from '../stores/searchStore.js'

const { t, getLocalizedName } = useI18n()
const { formatPrice } = useFormat()
const { navigate, goBack } = useRouter()
const { history, addToHistory, removeFromHistory, clearHistory, runSearch } = useSearchStore()

const query = ref('')
const results = ref([])
const isSearching = ref(false)
const hasSearched = ref(false)
const inputRef = ref(null)
let searchTimer = null
let searchSeq = 0

const trimmed = computed(() => query.value.trim())
const hasQuery = computed(() => trimmed.value.length > 0)

onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})

function onInput() {
  clearTimeout(searchTimer)
  const q = trimmed.value
  if (!q) {
    results.value = []
    isSearching.value = false
    hasSearched.value = false
    return
  }
  isSearching.value = true
  const seq = ++searchSeq
  searchTimer = setTimeout(async () => {
    const items = await runSearch(q)
    if (seq !== searchSeq) return
    results.value = items
    isSearching.value = false
    hasSearched.value = true
  }, 220)
}

function clearQuery() {
  query.value = ''
  results.value = []
  hasSearched.value = false
  isSearching.value = false
  nextTick(() => inputRef.value?.focus())
}

function selectHistory(entry) {
  query.value = entry
  onInput()
}

function onSubmit() {
  if (!hasQuery.value) return
  addToHistory(trimmed.value)
}

function openProduct(product) {
  if (hasQuery.value) addToHistory(trimmed.value)
  navigate('product', { productId: product.id })
}

function discountPercent(p) {
  if (!p.discountedPrice || p.discountedPrice >= p.price) return 0
  return Math.round((1 - p.discountedPrice / p.price) * 100)
}
</script>

<template>
  <div class="min-h-screen pb-12" style="background: var(--bg-app)">
    <!-- Editorial search bar -->
    <div class="search-header safe-top">
      <div class="px-5 pt-3 pb-2 flex items-center justify-between">
        <button @click="goBack" class="flex items-center gap-2 btn-press">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="eyebrow-sm">{{ t('ed.back_word') }}</span>
        </button>
        <span class="num-label text-[11px] tabular">{{ t('ed.search_label') }}</span>
      </div>
      <div class="px-5 pb-3">
        <form @submit.prevent="onSubmit">
          <div class="search-field">
            <svg width="16" height="16" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              @input="onInput"
              type="search"
              enterkeyhint="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="t('header.search_placeholder')"
              class="search-input"
            />
            <button v-if="hasQuery" type="button" @click="clearQuery" class="btn-press" :aria-label="t('common.clear')">
              <svg width="13" height="13" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Recent searches -->
    <div v-if="!hasQuery && history.length" class="px-5 pt-5">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="num-label text-[11px] tabular">§</span>
          <p class="eyebrow-sm">{{ t('search.recent') }}</p>
        </div>
        <button @click="clearHistory" class="btn-press">
          <span class="eyebrow-sm" style="color: var(--bordeaux)">{{ t('search.clear_all') }}</span>
        </button>
      </div>
      <div class="hairline mb-3"></div>
      <div class="flex flex-col">
        <button v-for="entry in history" :key="entry" type="button" @click="selectHistory(entry)" class="history-row btn-press">
          <svg width="13" height="13" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="serif text-[15px] flex-1 text-left truncate" style="color: var(--text-primary); font-weight: 500">{{ entry }}</span>
          <span class="history-remove btn-press" role="button" :aria-label="t('common.clear')" @click.stop="removeFromHistory(entry)">
            <svg width="12" height="12" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
            </svg>
          </span>
        </button>
      </div>
    </div>

    <!-- Empty hero (no query, no history) -->
    <div v-else-if="!hasQuery" class="px-8 pt-20 text-center">
      <p class="num-label text-[14px] mb-3">— {{ t('ed.discover_section') }} —</p>
      <h2 class="display text-[28px] mb-3" style="color: var(--text-primary)">
        {{ t('search.hero_title') }}
      </h2>
      <p class="serif-italic text-[14.5px] max-w-[280px] mx-auto leading-relaxed" style="color: var(--text-secondary)">
        {{ t('search.hero_subtitle') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-else-if="isSearching && !results.length" class="px-5 pt-5">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 py-3 border-b" :style="{ borderColor: 'var(--hairline)' }">
        <div class="skeleton" style="width: 56px; height: 70px; flex-shrink: 0"></div>
        <div class="flex-1">
          <div class="skeleton h-3 mb-2" style="width: 70%"></div>
          <div class="skeleton h-3" style="width: 40%"></div>
        </div>
      </div>
    </div>

    <!-- No results -->
    <div v-else-if="hasSearched && !results.length" class="px-8 pt-16 text-center">
      <p class="num-label text-[14px] mb-3" style="color: var(--terracotta)">— {{ t('ed.empty_n') }} —</p>
      <h2 class="display text-[24px] mb-2" style="color: var(--text-primary)">
        {{ t('search.no_results') }}
      </h2>
      <p class="serif-italic text-[14px]" style="color: var(--text-secondary)">{{ t('search.try_different') }}</p>
    </div>

    <!-- Results -->
    <div v-else-if="results.length" class="px-5 pt-5">
      <div class="flex items-center gap-2 mb-3">
        <span class="num-label text-[11px] tabular">{{ String(results.length).padStart(2, '0') }}</span>
        <span class="block w-4 h-px" style="background: var(--hairline)"></span>
        <p class="eyebrow-sm">{{ t('search.results_count', { count: results.length }) }}</p>
      </div>
      <div class="hairline mb-2"></div>
      <div class="flex flex-col">
        <button v-for="product in results" :key="product.id" type="button" @click="openProduct(product)"
          class="result-row btn-press">
          <div class="result-img-wrap">
            <img v-if="product.image" :src="product.image" :alt="getLocalizedName(product.name)" class="result-img" style="mix-blend-mode: multiply;" />
            <svg v-else width="20" height="20" style="color: var(--text-tertiary); opacity: 0.4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.4">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <span v-if="discountPercent(product)" class="result-discount num-label text-[10px] tabular">−{{ discountPercent(product) }}%</span>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="result-name truncate">{{ getLocalizedName(product.name) }}</p>
            <p v-if="product.categoryName" class="text-[11px] mt-0.5 truncate" style="color: var(--text-tertiary)">{{ product.categoryName }}</p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500">{{ formatPrice(product.discountedPrice || product.price) }}</span>
              <span v-if="product.discountedPrice" class="text-[11px] line-through tabular" style="color: var(--text-muted)">{{ formatPrice(product.price) }}</span>
            </div>
          </div>
          <svg width="12" height="12" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(250, 247, 241, 0.92);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-bottom: 1px solid var(--hairline);
}
:root.dark .search-header,
.dark .search-header {
  background: rgba(14, 20, 17, 0.92);
}

.search-field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  transition: border-color 0.2s ease;
}
.search-field:focus-within {
  border-color: var(--text-primary);
}
.search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 14.5px;
  color: var(--text-primary);
}
.search-input::placeholder {
  color: var(--text-tertiary);
  font-style: italic;
}
.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.history-remove {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

/* Results */
.result-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.result-img-wrap {
  position: relative;
  width: 58px;
  height: 72px;
  background: var(--img-bg);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.result-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}
.result-discount {
  position: absolute;
  top: 2px;
  left: 2px;
  padding: 2px 5px;
  background: var(--bordeaux);
  color: var(--cream);
  line-height: 1;
}
.result-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.2;
}
</style>
