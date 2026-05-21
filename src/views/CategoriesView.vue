<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import { useI18n } from '../i18n/index.js'
import { useRouter } from '../router/index.js'
import { getCategoryTree, getProducts } from '../services/api.js'
import { categoryProducts, loadProducts } from '../stores/productsStore.js'

const { t, getLocalizedName } = useI18n()
const { routeParams } = useRouter()

const categoryTree = ref([])
const selectedParent = ref(null)
const selectedChild = ref(null)
const productsList = ref([])
const isLoading = ref(true)
const isLoadingProducts = ref(false)
const searchQuery = ref('')

// Vibrant palette-tinted card variants
const CARD_VARIANTS = [
  { bg: '#F2D9CB', accent: '#8F4226', big: '#B85C3A', ornament: '✦', tag: 'HIT' },
  { bg: '#DCE6DE', accent: '#0F5132', big: '#1E6F47', ornament: '❀', tag: null },
  { bg: '#F0DCC3', accent: '#8F4226', big: '#C99662', ornament: '✺', tag: 'YANGI' },
  { bg: '#F5EFE3', accent: '#5C2A2E', big: '#5C2A2E', ornament: '❋', tag: null },
  { bg: '#ECF3EE', accent: '#0F5132', big: '#1E6F47', ornament: '✣', tag: null },
  { bg: '#D9C0BF', accent: '#5C2A2E', big: '#5C2A2E', ornament: '✦', tag: 'TOP' },
]

function variantFor(idx) {
  return CARD_VARIANTS[idx % CARD_VARIANTS.length]
}

onMounted(async () => {
  // Load tree + product previews in parallel
  const [tree] = await Promise.all([
    getCategoryTree().catch(() => []),
    loadProducts().catch(() => null),
  ])
  categoryTree.value = tree
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
  await loadProductsFor(child.id)
}

async function goToSubcategory(parent, child) {
  selectedParent.value = parent
  selectedChild.value = child
  searchQuery.value = ''
  await loadProductsFor(child.id)
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

async function loadProductsFor(categoryId) {
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

// Up to 3 preview images for a category
function previewImages(catId, limit = 3) {
  const items = categoryProducts.value?.[catId] || []
  return items.filter(p => p.image).slice(0, limit)
}

function productCount(catId) {
  return categoryProducts.value?.[catId]?.length || 0
}
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <template v-if="isLoading">
      <div class="page-container mt-4 flex flex-col gap-4">
        <div class="skeleton h-3 w-20 mb-2"></div>
        <div class="skeleton h-9 w-2/3 mb-4"></div>
        <div class="skeleton h-10 w-full"></div>
        <div class="skeleton h-[200px] w-full mt-2"></div>
        <div class="grid grid-cols-2 gap-3 mt-2">
          <div v-for="i in 6" :key="i" class="skeleton h-[180px]"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Category Browse (fun colorful grid) ═══ -->
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

        <!-- ═══ Featured hero card ═══ -->
        <button v-if="featuredCategory" @click="selectParent(featuredCategory)"
          class="featured-card btn-press"
          :style="{ background: variantFor(0).bg }">
          <!-- Dot pattern -->
          <div class="dot-pattern"></div>
          <!-- Big italic number -->
          <span class="big-num" :style="{ color: variantFor(0).big }">01</span>

          <!-- "Editor's Pick" tag at top -->
          <div class="featured-tag-row">
            <div class="featured-tag" :style="{ background: variantFor(0).accent }">
              <span class="eyebrow-sm" style="color: var(--cream); letter-spacing: 0.2em;">{{ t('ed.editors_pick') }}</span>
            </div>
            <span class="card-ornament" :style="{ color: variantFor(0).accent }">{{ variantFor(0).ornament }}</span>
          </div>

          <h2 class="featured-name">{{ getLocalizedName(featuredCategory.name) }}</h2>
          <p class="featured-sub" :style="{ color: variantFor(0).accent }">
            {{ productCount(featuredCategory.id) || (featuredCategory.children?.length || 0) }}+ {{ t('cart.products').toLowerCase() }}
          </p>

          <!-- Product preview thumbnails (stacked) -->
          <div class="preview-stack" v-if="previewImages(featuredCategory.id, 4).length">
            <div v-for="(p, i) in previewImages(featuredCategory.id, 4)" :key="p.id"
              class="preview-thumb"
              :style="{ zIndex: 5 - i, marginLeft: i === 0 ? '0' : '-14px', transform: `rotate(${(i - 1.5) * 4}deg)` }">
              <img :src="p.image" :alt="getLocalizedName(p.name)" style="mix-blend-mode: multiply;" />
            </div>
          </div>
          <!-- Fallback initial if no products -->
          <div v-else class="featured-fallback">
            <span class="serif" style="font-size: 42px; font-weight: 500; color: var(--text-primary);">{{ getLocalizedName(featuredCategory.name).charAt(0) }}</span>
          </div>

          <div class="featured-arrow">
            <span class="eyebrow-sm" :style="{ color: variantFor(0).accent }">{{ t('ed.discover') }}</span>
            <span class="block flex-1 h-px" :style="{ background: variantFor(0).accent, opacity: 0.4 }"></span>
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" :style="{ color: variantFor(0).accent }">
              <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>

        <!-- ═══ Department grid (colorful staggered) ═══ -->
        <div class="dept-grid mt-3">
          <button v-for="(cat, idx) in restCategories" :key="cat.id" @click="selectParent(cat)"
            class="dept-card btn-press"
            :class="{ 'dept-card-tall': idx % 3 === 1 }"
            :style="{ background: variantFor(idx + 1).bg }">
            <!-- Dot pattern background -->
            <div class="dot-pattern dot-pattern-sm"></div>
            <!-- Big italic background number -->
            <span class="dept-num" :style="{ color: variantFor(idx + 1).big }">{{ String(idx + 2).padStart(2, '0') }}</span>
            <!-- Badge tag (HIT/YANGI/TOP) -->
            <span v-if="variantFor(idx + 1).tag" class="dept-tag" :style="{ background: variantFor(idx + 1).accent }">
              {{ variantFor(idx + 1).tag }}
            </span>
            <!-- Ornament -->
            <span class="dept-ornament" :style="{ color: variantFor(idx + 1).accent }">{{ variantFor(idx + 1).ornament }}</span>

            <div class="dept-content">
              <!-- Product preview row -->
              <div v-if="previewImages(cat.id, 3).length" class="preview-row">
                <div v-for="(p, i) in previewImages(cat.id, 3)" :key="p.id"
                  class="preview-mini"
                  :style="{ zIndex: 3 - i, marginLeft: i === 0 ? '0' : '-10px' }">
                  <img :src="p.image" :alt="getLocalizedName(p.name)" style="mix-blend-mode: multiply;" />
                </div>
              </div>
              <div v-else class="dept-thumb">
                <img v-if="cat.image" :src="cat.image" :alt="getLocalizedName(cat.name)" class="w-full h-full object-contain p-1" style="mix-blend-mode: multiply;" />
                <span v-else class="serif text-[20px]" style="color: var(--text-primary); font-weight: 500">{{ getLocalizedName(cat.name).charAt(0) }}</span>
              </div>

              <div class="dept-meta">
                <p class="dept-name">{{ getLocalizedName(cat.name) }}</p>
                <p class="dept-sub" :style="{ color: variantFor(idx + 1).accent }">
                  <template v-if="productCount(cat.id)">
                    {{ productCount(cat.id) }}+ {{ t('cart.products').toLowerCase() }}
                  </template>
                  <template v-else-if="cat.children?.length">
                    {{ cat.children.length }} {{ t('categories.subcategories') }}
                  </template>
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

/* Spinning ornament on title */
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

/* Dot patterns (subtle decorative background) */
.dot-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(26, 38, 32, 0.12) 1px, transparent 1px);
  background-size: 14px 14px;
  background-position: 0 0;
  opacity: 0.5;
  pointer-events: none;
  mask-image: radial-gradient(ellipse at top left, rgba(0, 0, 0, 0.8), transparent 70%);
}
.dot-pattern-sm {
  background-size: 10px 10px;
  opacity: 0.4;
}

/* ── Featured hero card ── */
.featured-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 18px 20px 18px;
  margin-bottom: 14px;
  border: 1px solid var(--hairline);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.32s cubic-bezier(.22,1,.36,1), border-color 0.32s ease, box-shadow 0.32s ease;
  text-align: left;
  box-shadow: 0 2px 8px rgba(26, 38, 32, 0.04);
}
.featured-card:active {
  transform: scale(0.985);
  box-shadow: 0 8px 24px rgba(26, 38, 32, 0.12);
}

.big-num {
  position: absolute;
  top: -25px;
  right: -12px;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 200px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  opacity: 0.16;
  pointer-events: none;
  user-select: none;
}

.featured-tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
}
.featured-tag {
  display: inline-block;
  padding: 5px 12px 6px;
  border-radius: 999px;
}

.featured-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.0;
  color: var(--text-primary);
  margin: 4px 0 4px;
  position: relative;
  z-index: 2;
}
.featured-sub {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}

.preview-stack {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  position: relative;
  z-index: 2;
  min-height: 64px;
}
.preview-thumb {
  width: 64px;
  height: 64px;
  background: var(--surface);
  border: 1.5px solid var(--surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(26, 38, 32, 0.12);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}
.preview-thumb img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}
.featured-card:hover .preview-thumb {
  transform: translateY(-2px) rotate(0deg) !important;
}

.featured-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  margin-bottom: 14px;
  position: relative;
  z-index: 2;
}

.featured-arrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  padding-top: 8px;
  position: relative;
  z-index: 2;
}

.card-ornament {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 18px;
  animation: float-orn 4s ease-in-out infinite;
}
@keyframes float-orn {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(15deg); }
}

/* ── Department grid ── */
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
  transition: transform 0.32s cubic-bezier(.22,1,.36,1), border-color 0.32s ease, box-shadow 0.32s ease;
  text-align: left;
  min-height: 170px;
  box-shadow: 0 1px 3px rgba(26, 38, 32, 0.03);
}
.dept-card:active {
  transform: scale(0.96) rotate(-0.6deg);
  box-shadow: 0 6px 16px rgba(26, 38, 32, 0.10);
}
.dept-card-tall {
  min-height: 210px;
}

.dept-num {
  position: absolute;
  bottom: -30px;
  right: -12px;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 130px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  opacity: 0.18;
  pointer-events: none;
  user-select: none;
}

.dept-tag {
  position: absolute;
  top: 10px;
  left: -2px;
  padding: 3px 10px 4px 12px;
  color: var(--cream);
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  z-index: 3;
  clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%);
}

.dept-ornament {
  position: absolute;
  top: 10px;
  right: 12px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 14px;
  opacity: 0.8;
  z-index: 3;
  animation: float-orn 5s ease-in-out infinite;
}

.dept-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.preview-row {
  display: flex;
  align-items: center;
  min-height: 44px;
}
.preview-mini {
  width: 44px;
  height: 44px;
  background: var(--surface);
  border: 1.5px solid var(--surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(26, 38, 32, 0.10);
}
.preview-mini img {
  width: 78%;
  height: 78%;
  object-fit: contain;
}

.dept-thumb {
  width: 48px;
  height: 48px;
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
  font-size: 9.5px;
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
