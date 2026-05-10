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

const categoryColors = [
  { bg: '#ECFDF5', text: '#059669', accent: 'rgba(5,150,105,0.08)' },
  { bg: '#EFF6FF', text: '#2563EB', accent: 'rgba(37,99,235,0.08)' },
  { bg: '#FFF7ED', text: '#EA580C', accent: 'rgba(234,88,12,0.08)' },
  { bg: '#FDF2F8', text: '#DB2777', accent: 'rgba(219,39,119,0.08)' },
  { bg: '#F5F3FF', text: '#7C3AED', accent: 'rgba(124,58,237,0.08)' },
  { bg: '#ECFEFF', text: '#0891B2', accent: 'rgba(8,145,178,0.08)' },
  { bg: '#FFFBEB', text: '#D97706', accent: 'rgba(217,119,6,0.08)' },
  { bg: '#FEF2F2', text: '#DC2626', accent: 'rgba(220,38,38,0.08)' },
  { bg: '#F0FDF4', text: '#16A34A', accent: 'rgba(22,163,74,0.08)' },
  { bg: '#EEF2FF', text: '#4F46E5', accent: 'rgba(79,70,229,0.08)' },
]

function getColor(index) {
  return categoryColors[index % categoryColors.length]
}

function tileGridCols(count) {
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  return 'grid-cols-3'
}

function tileShape(count) {
  if (count <= 1) return 'cat-tile--wide'
  if (count === 2) return 'cat-tile--mid'
  return 'cat-tile--square'
}

function tilesFor(cat) {
  return cat.children?.length ? cat.children : [cat]
}

function openTile(cat, item) {
  if (cat.children?.length) goToSubcategory(cat, item)
  else selectParent(cat)
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
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="page-container mt-4 flex flex-col gap-4">
        <div class="skeleton h-12 w-full rounded-2xl"></div>
        <div class="skeleton h-5 w-32 rounded-md mt-2"></div>
        <div class="grid grid-cols-2 gap-2.5">
          <div v-for="i in 8" :key="i" class="skeleton h-[68px] rounded-2xl"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Category Browse ═══ -->
      <div v-if="!selectedParent" class="page-container mt-3">
        <!-- Search -->
        <div class="flex items-center rounded-2xl px-4 py-3 gap-2.5 mb-5 search-field">
          <svg width="16" height="16" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input v-model="searchQuery" :placeholder="t('categories.search_placeholder')" type="text"
            class="bg-transparent outline-none text-sm font-medium flex-1" style="color: var(--text-primary)" />
          <button v-if="searchQuery" @click="searchQuery = ''" :aria-label="t('common.clear')" class="btn-press p-0.5">
            <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Category sections -->
        <div v-for="(cat, catIdx) in filteredCategories" :key="cat.id" class="cat-section">
          <h2 class="cat-section-title">{{ getLocalizedName(cat.name) }}</h2>

          <div
            class="grid gap-2.5"
            :class="tileGridCols(tilesFor(cat).length)"
            :style="{ '--tile-bg': getColor(catIdx).bg }">
            <button
              v-for="item in tilesFor(cat)"
              :key="item.id"
              @click="openTile(cat, item)"
              class="cat-tile btn-press"
              :class="tileShape(tilesFor(cat).length)">
              <span class="cat-tile-name">{{ getLocalizedName(item.name) }}</span>
              <img
                v-if="item.image"
                :src="item.image"
                :alt="getLocalizedName(item.name)"
                class="cat-tile-img"
                loading="lazy" />
              <span v-else class="cat-tile-fallback">{{ getLocalizedName(item.name).charAt(0) }}</span>
            </button>
          </div>
        </div>

        <!-- No results -->
        <div v-if="!filteredCategories.length && searchQuery" class="flex flex-col items-center py-20">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4" style="background: var(--surface-secondary)">
            <svg width="28" height="28" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="text-sm font-semibold" style="color: var(--text-tertiary)">{{ t('categories.no_products') }}</p>
        </div>
      </div>

      <!-- ═══ Products View ═══ -->
      <div v-else class="page-container mt-3">
        <!-- Back + title -->
        <div class="flex items-center gap-2.5 mb-3">
          <button @click="goBack" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press flex-shrink-0" style="background: var(--surface-secondary)">
            <svg width="18" height="18" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h2 class="text-base font-bold" style="color: var(--text-primary)">{{ getLocalizedName(selectedParent.name) }}</h2>
        </div>

        <!-- Subcategory chips -->
        <div v-if="currentSubcategories.length" class="scroll-x flex gap-2 pb-3">
          <button
            @click="selectedChild = null; loadAllProducts(selectedParent)"
            class="chip-btn btn-press"
            :class="{ 'chip-active': !selectedChild }">
            <span class="text-xs font-semibold whitespace-nowrap">{{ t('categories.all_in') }} {{ getLocalizedName(selectedParent.name) }}</span>
          </button>
          <button
            v-for="(sub, idx) in currentSubcategories"
            :key="sub.id"
            @click="selectChild(sub)"
            class="chip-btn btn-press"
            :class="{ 'chip-active': selectedChild?.id === sub.id }">
            <img v-if="sub.image" :src="sub.image" class="w-4 h-4 rounded object-cover" />
            <span class="text-xs font-semibold whitespace-nowrap">{{ getLocalizedName(sub.name) }}</span>
          </button>
        </div>

        <!-- Products grid -->
        <div v-if="isLoadingProducts" class="mt-1 grid grid-cols-2 gap-3">
          <div v-for="i in 4" :key="i" class="skeleton h-[220px] rounded-[18px]"></div>
        </div>
        <div v-else-if="productsList.length" class="mt-1 grid grid-cols-2 gap-3">
          <ProductCard v-for="p in productsList" :key="p.id" :product="p" />
        </div>
        <div v-else class="flex flex-col items-center py-20">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4" style="background: var(--surface-secondary)">
            <svg width="28" height="28" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke-width="2"/>
            </svg>
          </div>
          <p class="text-sm font-semibold" style="color: var(--text-tertiary)">{{ t('categories.no_products') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Mobile-first viewport that doesn't stretch absurdly on desktop. */
.page-container {
  width: 100%;
  max-width: 480px;
  margin-inline: auto;
  padding-inline: 16px;
}

.search-field {
  background: var(--surface-secondary);
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}
.search-field:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.08);
}

.cat-section {
  margin-bottom: 22px;
}

.cat-section-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: var(--text-primary);
  margin: 0 2px 10px;
}

.cat-tile {
  position: relative;
  display: block;
  text-align: left;
  padding: 14px;
  border-radius: 18px;
  background: var(--tile-bg);
  overflow: hidden;
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.cat-tile:active {
  transform: scale(0.97);
}

.cat-tile--wide   { aspect-ratio: 5 / 2; }
.cat-tile--mid    { aspect-ratio: 5 / 3; }
.cat-tile--square { aspect-ratio: 1 / 1; }

.cat-tile-name {
  position: relative;
  z-index: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 60%;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.cat-tile-img {
  position: absolute;
  right: 0;
  bottom: 0;
  max-width: 70%;
  max-height: 85%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: right bottom;
  pointer-events: none;
  z-index: 1;
}

.cat-tile-fallback {
  position: absolute;
  right: 14px;
  bottom: 10px;
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
  color: var(--text-primary);
  opacity: 0.18;
  z-index: 1;
}

.chip-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 12px;
  background: var(--surface);
  color: var(--text-secondary);
  box-shadow: 0 1px 3px var(--shadow);
  transition: all 0.2s ease;
}
.chip-active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px var(--primary-glow);
}
</style>
