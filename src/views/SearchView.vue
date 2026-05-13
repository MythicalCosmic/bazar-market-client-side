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
  <div class="min-h-screen pb-8" style="background: var(--bg-app)">
    <!-- ── Top search bar ── -->
    <div class="search-header safe-top">
      <div class="flex items-center gap-2 px-3 py-3">
        <button @click="goBack" class="back-btn btn-press" :aria-label="t('common.back')">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--text-primary)">
            <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <form @submit.prevent="onSubmit" class="flex-1">
          <div class="search-field">
            <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
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
            <button v-if="hasQuery" type="button" @click="clearQuery" class="clear-btn btn-press" :aria-label="t('common.clear')">
              <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Recent searches (no query) ── -->
    <div v-if="!hasQuery && history.length" class="px-4 pt-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="section-dot"></div>
          <h2 class="section-title">{{ t('search.recent') }}</h2>
        </div>
        <button @click="clearHistory" class="text-[12px] font-semibold btn-press" style="color: var(--primary)">
          {{ t('search.clear_all') }}
        </button>
      </div>
      <div class="history-list">
        <button
          v-for="entry in history"
          :key="entry"
          type="button"
          @click="selectHistory(entry)"
          class="history-row btn-press"
        >
          <div class="history-icon">
            <svg width="14" height="14" style="color: var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke-width="2"/>
              <path d="M12 7v5l3 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="history-text">{{ entry }}</span>
          <span
            class="history-remove btn-press"
            role="button"
            :aria-label="t('common.clear')"
            @click.stop="removeFromHistory(entry)"
          >
            <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
        </button>
      </div>
    </div>

    <!-- ── Empty hero (no query, no history) ── -->
    <div v-else-if="!hasQuery" class="flex flex-col items-center justify-center pt-24 px-8 text-center">
      <div class="empty-hero">
        <svg width="32" height="32" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke-width="2"/>
          <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="text-[15px] font-bold mt-4" style="color: var(--text-primary)">{{ t('search.hero_title') }}</p>
      <p class="text-[12px] font-medium mt-1.5" style="color: var(--text-tertiary)">{{ t('search.hero_subtitle') }}</p>
    </div>

    <!-- ── Loading ── -->
    <div v-else-if="isSearching && !results.length" class="px-4 pt-4">
      <div v-for="i in 4" :key="i" class="skeleton-row">
        <div class="skeleton skeleton-img"></div>
        <div class="flex-1">
          <div class="skeleton h-3.5 rounded-lg mb-2" style="width: 60%"></div>
          <div class="skeleton h-3 rounded-lg" style="width: 35%"></div>
        </div>
      </div>
    </div>

    <!-- ── No results ── -->
    <div v-else-if="hasSearched && !results.length" class="flex flex-col items-center justify-center pt-20 px-8 text-center">
      <div class="empty-hero" style="background: rgba(249, 115, 22, 0.08)">
        <svg width="32" height="32" style="color: var(--accent)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke-width="2"/>
          <path d="M8 11h6M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="text-[15px] font-bold mt-4" style="color: var(--text-primary)">{{ t('search.no_results') }}</p>
      <p class="text-[12px] font-medium mt-1.5" style="color: var(--text-tertiary)">{{ t('search.try_different') }}</p>
    </div>

    <!-- ── Results ── -->
    <div v-else-if="results.length" class="px-4 pt-3">
      <p class="text-[11px] font-semibold uppercase tracking-wider mb-2.5 px-1" style="color: var(--text-tertiary)">
        {{ t('search.results_count', { count: results.length }) }}
      </p>
      <div class="result-list">
        <button
          v-for="product in results"
          :key="product.id"
          type="button"
          @click="openProduct(product)"
          class="result-row btn-press"
        >
          <div class="result-img-wrap">
            <img v-if="product.image" :src="product.image" :alt="getLocalizedName(product.name)" class="result-img" style="mix-blend-mode: multiply;" />
            <svg v-else width="22" height="22" style="color: var(--text-tertiary); opacity: 0.4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
              <path d="M21 15l-5-5L5 21" stroke-width="2"/>
            </svg>
            <span v-if="discountPercent(product)" class="result-badge">-{{ discountPercent(product) }}%</span>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="result-name">{{ getLocalizedName(product.name) }}</p>
            <p v-if="product.categoryName" class="result-cat">{{ product.categoryName }}</p>
            <div class="flex items-baseline gap-1.5 mt-0.5">
              <span class="result-price">{{ formatPrice(product.discountedPrice || product.price) }}</span>
              <span v-if="product.discountedPrice" class="result-price-old">{{ formatPrice(product.price) }}</span>
            </div>
          </div>
          <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
  background: rgba(245, 250, 247, 0.92);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border);
}
:root.dark .search-header,
.dark .search-header {
  background: rgba(10, 15, 12, 0.92);
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 14px;
  background: var(--surface-secondary);
  border: 1.5px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-field:focus-within {
  border-color: var(--primary);
  background: var(--surface);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.08);
}
.search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}
.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}
.clear-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-tertiary);
  border: none;
  flex-shrink: 0;
}

/* ── Section header ── */
.section-dot {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: var(--primary);
}
.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

/* ── History rows ── */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.history-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 14px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.history-row:hover {
  background: var(--surface-secondary);
}
.history-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-secondary);
  flex-shrink: 0;
}
.history-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-remove {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  flex-shrink: 0;
  cursor: pointer;
}
.history-remove:hover {
  background: var(--surface-secondary);
}

/* ── Empty hero ── */
.empty-hero {
  width: 72px;
  height: 72px;
  border-radius: 24px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Skeleton ── */
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.skeleton-img {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  flex-shrink: 0;
}

/* ── Results ── */
.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 12px var(--shadow);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.result-img-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  flex-shrink: 0;
  background: var(--img-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.result-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}
.result-badge {
  position: absolute;
  top: 3px;
  left: 3px;
  font-size: 9px;
  font-weight: 800;
  color: white;
  padding: 2px 5px;
  border-radius: 6px;
  background: linear-gradient(135deg, #F97316, #EA580C);
  letter-spacing: 0.02em;
}
.result-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-cat {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-top: 1px;
}
.result-price {
  font-size: 13px;
  font-weight: 800;
  color: var(--primary);
}
.result-price-old {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-decoration: line-through;
}
</style>
