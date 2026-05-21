<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import { useI18n } from '../i18n/index.js'
import { useRouter } from '../router/index.js'
import { getCategoryTree, getProducts } from '../services/api.js'

const { t, getLocalizedName } = useI18n()
const { routeParams } = useRouter()

const categoryTree = ref([])
const selectedParent = ref(null)
const selectedChild = ref(null)
const productsList = ref([])
const isLoading = ref(true)
const isLoadingProducts = ref(false)
const searchQuery = ref('')

// Palette-tinted card variants (cycles through to give each card distinct character)
const CARD_VARIANTS = [
  { bg: 'var(--terracotta-light)', accent: 'var(--terracotta)', big: 'var(--terracotta)', ornament: '✦' },
  { bg: 'var(--sage-light)',       accent: 'var(--primary)',    big: 'var(--primary)',    ornament: '❀' },
  { bg: 'var(--saffron-light)',    accent: 'var(--terracotta-dark)', big: 'var(--terracotta-dark)', ornament: '✺' },
  { bg: 'var(--cream)',            accent: 'var(--bordeaux)',   big: 'var(--bordeaux)',   ornament: '❋' },
  { bg: 'var(--primary-tint)',     accent: 'var(--primary-mid)', big: 'var(--primary-mid)', ornament: '✣' },
  { bg: 'var(--bordeaux-light)',   accent: 'var(--bordeaux)',   big: 'var(--bordeaux)',   ornament: '✦' },
]

function variantFor(idx) {
  return CARD_VARIANTS[idx % CARD_VARIANTS.length]
}

onMounted(async () => {
  try {
    categoryTree.value = await getCategoryTree()
  } catch {}
  isLoading.value = false

  if (routeParams.value?.category) {
    const parent = categoryTree.value.find(c => c.id === routeParams.value.category)
    if (parent && routeParams.value.subcategory) {
      const child = (parent.children || []).find(c => c.id === routeParams.value.subcategory)
      if (child) { await goToSubcategory(parent, child); return }
    }
    selectParentById(routeParams.value.category)
  }
})

watch(routeParams, async (params) => {
  if (params?.category) {
    const parent = categoryTree.value.find(c => c.id === params.category)
    if (parent && params.subcategory) {
      const child = (parent.children || []).find(c => c.id === params.subcategory)
      if (child) { await goToSubcategory(parent, child); return }
    }
    selectParentById(params.category)
  }
})

function selectParentById(id) {
  const parent = categoryTree.value.find(c => c.id === id)
  if (parent) selectParent(parent)
}

async function selectParent(cat) {
  selectedParent.value = cat
  selectedChild.value = null
  searchQuery.value = ''
  await loadAllProducts(cat)
}

async function selectChild(child) {
  selectedChild.value = child
  await loadProducts(child.id)
}

async function goToSubcategory(parent, child) {
  selectedParent.value = parent
  selectedChild.value = child
  searchQuery.value = ''
  await loadProducts(child.id)
}

async function loadAllProducts(cat) {
  isLoadingProducts.value = true
  try {
    const childIds = (cat.children || []).map(c => c.id)
    const allIds = [cat.id, ...childIds]
    const results = await Promise.all(
      allIds.map(id => getProducts({ category_id: id, per_page: 50 }).catch(() => ({ items: [] })))
    )
    const seen = new Set()
    const merged = []
    for (const result of results) {
      for (const product of (result.items || [])) {
        if (!seen.has(product.id)) { seen.add(product.id); merged.push(product) }
      }
    }
    productsList.value = merged
  } catch { productsList.value = [] }
  isLoadingProducts.value = false
}

async function loadProducts(categoryId) {
  isLoadingProducts.value = true
  try {
    const result = await getProducts({ category_id: categoryId, per_page: 50 })
    productsList.value = result.items || []
  } catch { productsList.value = [] }
  isLoadingProducts.value = false
}

function goBack() {
  searchQuery.value = ''
  if (selectedChild.value) {
    selectedChild.value = null
    loadAllProducts(selectedParent.value)
  } else if (selectedParent.value) {
    selectedParent.value = null
    productsList.value = []
  }
}

const currentSubcategories = computed(() => {
  if (!selectedParent.value) return []
  return selectedParent.value.children || []
})

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categoryTree.value
  const q = searchQuery.value.trim().toLowerCase()
  return categoryTree.value.filter(cat => {
    const name = getLocalizedName(cat.name).toLowerCase()
    if (name.includes(q)) return true
    return (cat.children || []).some(ch => getLocalizedName(ch.name).toLowerCase().includes(q))
  })
})

const featuredCategory = computed(() => filteredCategories.value[0] || null)
const restCategories = computed(() => filteredCategories.value.slice(1))
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="page-container mt-4 flex flex-col gap-4">
        <div class="skeleton h-3 w-20 mb-2"></div>
        <div class="skeleton h-9 w-2/3 mb-4"></div>
        <div class="skeleton h-10 w-full"></div>
        <div class="skeleton h-[180px] w-full mt-2"></div>
        <div class="grid grid-cols-2 gap-3 mt-2">
          <div v-for="i in 6" :key="i" class="skeleton h-[140px]"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Category Browse (fun grid) ═══ -->
      <div v-if="!selectedParent" class="page-container mt-4">
        <!-- Editorial title with ornament -->
        <div class="mb-5 relative">
          <div class="flex items-center gap-2 mb-2">
            <span class="num-label text-[11px] tabular">№ 01</span>
            <span class="block w-4 h-px" style="background: var(--hairline)"></span>
            <p class="eyebrow-sm">{{ t('ed.browse') }}</p>
          </div>
          <h1 class="display text-[34px]" style="color: var(--text-primary)">
            {{ t('ed.all_dep_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.all_dep_italic') }}</span>
          </h1>
          <!-- Decorative ornament floating top-right -->
          <span class="ornament-deco">✦</span>
          <div class="hairline mt-4"></div>
        </div>

        <!-- Search -->
        <div class="search-field mb-6">
          <svg width="15" height="15" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
          </svg>
          <input v-model="searchQuery" :placeholder="t('categories.search_placeholder')" type="text" class="search-input" />
          <button v-if="searchQuery" @click="searchQuery = ''" :aria-label="t('common.clear')" class="btn-press">
            <svg width="13" height="13" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Featured hero card (first category) -->
        <button v-if="featuredCategory" @click="selectParent(featuredCategory)"
          class="featured-card btn-press"
          :style="{ background: variantFor(0).bg }">
          <!-- Big floating italic number (decorative) -->
          <span class="big-num" :style="{ color: variantFor(0).big }">01</span>
          <!-- Content -->
          <div class="featured-content">
            <div class="flex items-center gap-2 mb-2">
              <span class="block w-4 h-px" :style="{ background: variantFor(0).accent }"></span>
              <p class="eyebrow-sm" :style="{ color: variantFor(0).accent }">{{ t('ed.editors_pick') }}</p>
            </div>
            <h2 class="featured-name">{{ getLocalizedName(featuredCategory.name) }}</h2>
            <p v-if="featuredCategory.children?.length" class="featured-sub">
              {{ featuredCategory.children.length }} {{ t('categories.subcategories') }}
            </p>
            <div class="featured-arrow">
              <span class="eyebrow-sm" :style="{ color: variantFor(0).accent }">{{ t('ed.discover') }}</span>
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" :style="{ color: variantFor(0).accent }">
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <!-- Thumbnail -->
          <div class="featured-thumb">
            <img v-if="featuredCategory.image" :src="featuredCategory.image" :alt="getLocalizedName(featuredCategory.name)" class="w-full h-full object-contain" style="mix-blend-mode: multiply;" />
            <span v-else class="featured-initial serif">{{ getLocalizedName(featuredCategory.name).charAt(0) }}</span>
          </div>
          <!-- Ornament -->
          <span class="card-ornament" :style="{ color: variantFor(0).accent }">{{ variantFor(0).ornament }}</span>
        </button>

        <!-- Department grid (staggered, colorful) -->
        <div class="dept-grid mt-3">
          <button v-for="(cat, idx) in restCategories" :key="cat.id" @click="selectParent(cat)"
            class="dept-card btn-press"
            :class="{ 'dept-card-tall': idx % 3 === 1 }"
            :style="{ background: variantFor(idx + 1).bg }">
            <!-- Big italic number in background -->
            <span class="dept-num" :style="{ color: variantFor(idx + 1).big }">{{ String(idx + 2).padStart(2, '0') }}</span>
            <!-- Ornament -->
            <span class="dept-ornament" :style="{ color: variantFor(idx + 1).accent }">{{ variantFor(idx + 1).ornament }}</span>
            <!-- Content -->
            <div class="dept-content">
              <div class="dept-thumb">
                <img v-if="cat.image" :src="cat.image" :alt="getLocalizedName(cat.name)" class="w-full h-full object-contain p-1" style="mix-blend-mode: multiply;" />
                <span v-else class="serif text-[18px]" style="color: var(--text-primary); font-weight: 500">{{ getLocalizedName(cat.name).charAt(0) }}</span>
              </div>
              <div class="dept-meta">
                <p class="dept-name">{{ getLocalizedName(cat.name) }}</p>
                <p v-if="cat.children?.length" class="dept-sub" :style="{ color: variantFor(idx + 1).accent }">
                  {{ cat.children.length }} {{ t('categories.subcategories') }}
                </p>
              </div>
            </div>
          </button>
        </div>

        <!-- Closing ornament -->
        <div class="closing-ornament">
          <span class="block w-12 h-px" style="background: var(--hairline)"></span>
          <span class="num-label text-[14px]" style="color: var(--terracotta)">✦</span>
          <span class="block w-12 h-px" style="background: var(--hairline)"></span>
        </div>

        <!-- No results -->
        <div v-if="!filteredCategories.length && searchQuery" class="flex flex-col items-center pt-16 px-8 text-center">
          <p class="num-label text-[12px] mb-3">— {{ t('ed.empty_n') }} —</p>
          <h3 class="display text-[22px]" style="color: var(--text-primary)">{{ t('categories.no_products') }}</h3>
          <p class="serif-italic text-[13px] mt-2" style="color: var(--text-secondary)">{{ t('search.try_different') }}</p>
        </div>
      </div>

      <!-- ═══ Products View ═══ -->
      <div v-else class="page-container mt-4">
        <button @click="goBack" class="flex items-center gap-2 btn-press mb-4">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="eyebrow-sm">{{ t('ed.back_to_dep') }}</span>
        </button>

        <div class="mb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="num-label text-[11px] tabular">{{ t('ed.department') }}</span>
            <span class="block w-4 h-px" style="background: var(--hairline)"></span>
            <p class="eyebrow-sm" v-if="selectedChild">{{ t('ed.subcategory') }}</p>
          </div>
          <h1 class="display text-[30px]" style="color: var(--text-primary)">
            {{ selectedChild ? getLocalizedName(selectedChild.name) : getLocalizedName(selectedParent.name) }}
          </h1>
          <p v-if="selectedChild" class="serif-italic text-[14px] mt-1" style="color: var(--text-tertiary)">{{ t('ed.in_category') }} {{ getLocalizedName(selectedParent.name) }}</p>
          <div class="hairline mt-4"></div>
        </div>

        <div v-if="currentSubcategories.length" class="scroll-x flex gap-2 pb-4">
          <button @click="selectedChild = null; loadAllProducts(selectedParent)"
            class="chip-btn btn-press" :class="{ 'chip-active': !selectedChild }">
            <span class="eyebrow-sm">{{ t('categories.all_in') }}</span>
          </button>
          <button v-for="sub in currentSubcategories" :key="sub.id" @click="selectChild(sub)"
            class="chip-btn btn-press" :class="{ 'chip-active': selectedChild?.id === sub.id }">
            <span class="eyebrow-sm">{{ getLocalizedName(sub.name) }}</span>
          </button>
        </div>

        <div v-if="isLoadingProducts" class="mt-1 grid grid-cols-2 gap-3">
          <div v-for="i in 4" :key="i" class="skeleton h-[260px]"></div>
        </div>
        <div v-else-if="productsList.length" class="mt-1 grid grid-cols-2 gap-3">
          <ProductCard v-for="p in productsList" :key="p.id" :product="p" />
        </div>
        <div v-else class="flex flex-col items-center pt-16 px-8 text-center">
          <p class="num-label text-[12px] mb-3">— {{ t('ed.empty_shelves') }} —</p>
          <h3 class="display text-[22px]" style="color: var(--text-primary)">{{ t('categories.no_products') }}</h3>
          <p class="serif-italic text-[13px] mt-2" style="color: var(--text-secondary)">{{ t('ed.try_aisle') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-container {
  width: 100%;
  max-width: 480px;
  margin-inline: auto;
  padding-inline: 20px;
}

.ornament-deco {
  position: absolute;
  top: 0;
  right: 4px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 28px;
  color: var(--saffron);
  opacity: 0.7;
  animation: spin-slow 18s linear infinite;
  transform-origin: center;
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.search-field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  transition: border-color 0.2s ease;
  border-radius: 2px;
}
.search-field:focus-within {
  border-color: var(--text-primary);
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 14px;
  color: var(--text-primary);
}
.search-input::placeholder {
  color: var(--text-tertiary);
  font-style: italic;
}

/* ── Featured hero card ── */
.featured-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 22px 22px 24px;
  margin-bottom: 12px;
  border: 1px solid var(--hairline);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.32s cubic-bezier(.22,1,.36,1), border-color 0.32s ease;
  text-align: left;
  min-height: 180px;
}
.featured-card:active {
  transform: scale(0.985);
}
.featured-card:hover {
  border-color: var(--text-primary);
}

.big-num {
  position: absolute;
  top: -20px;
  right: -10px;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 180px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  opacity: 0.12;
  pointer-events: none;
  user-select: none;
}

.featured-content {
  position: relative;
  z-index: 2;
  max-width: 65%;
}
.featured-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.0;
  color: var(--text-primary);
  margin: 4px 0 6px;
}
.featured-sub {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 13px;
  color: var(--text-secondary);
}
.featured-arrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.featured-thumb {
  position: absolute;
  bottom: 14px;
  right: 14px;
  width: 100px;
  height: 100px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 2;
  box-shadow: 0 8px 20px rgba(26, 38, 32, 0.10);
}
.featured-initial {
  font-size: 36px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.card-ornament {
  position: absolute;
  top: 14px;
  right: 14px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 18px;
  z-index: 2;
  animation: float-orn 4s ease-in-out infinite;
}
@keyframes float-orn {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(15deg); }
}

/* ── Department grid (staggered colorful) ── */
.dept-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

.dept-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 16px;
  border: 1px solid var(--hairline);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.32s cubic-bezier(.22,1,.36,1), border-color 0.32s ease;
  text-align: left;
  min-height: 140px;
}
.dept-card:active {
  transform: scale(0.96) rotate(-0.4deg);
}
.dept-card:hover {
  border-color: var(--text-primary);
}
.dept-card-tall {
  min-height: 180px;
}

.dept-num {
  position: absolute;
  bottom: -28px;
  right: -10px;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 120px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  opacity: 0.16;
  pointer-events: none;
  user-select: none;
}

.dept-ornament {
  position: absolute;
  top: 10px;
  right: 12px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 14px;
  opacity: 0.7;
}

.dept-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.dept-thumb {
  width: 52px;
  height: 52px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.dept-meta {
  margin-top: auto;
}
.dept-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.15;
}
.dept-sub {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-top: 6px;
}

.closing-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 32px;
  padding-bottom: 8px;
}

/* Chips */
.chip-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--hairline);
  transition: all 0.2s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.chip-active {
  background: var(--surface-ink);
  border-color: var(--surface-ink);
}
.chip-active .eyebrow-sm {
  color: var(--cream);
}
</style>
