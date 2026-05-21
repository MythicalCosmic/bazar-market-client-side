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
        <div class="skeleton h-3 w-20 mb-2"></div>
        <div class="skeleton h-9 w-2/3 mb-4"></div>
        <div class="skeleton h-10 w-full"></div>
        <div class="flex flex-col gap-3 mt-2">
          <div v-for="i in 6" :key="i" class="skeleton h-[70px]"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Category Browse ═══ -->
      <div v-if="!selectedParent" class="page-container mt-4">
        <!-- Editorial title -->
        <div class="mb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="num-label text-[11px] tabular">№ 01</span>
            <span class="block w-4 h-px" style="background: var(--hairline)"></span>
            <p class="eyebrow-sm">{{ t('ed.browse') }}</p>
          </div>
          <h1 class="display text-[34px]" style="color: var(--text-primary)">
            {{ t('ed.all_dep_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.all_dep_italic') }}</span>
          </h1>
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

        <!-- Category list (editorial) -->
        <div class="flex flex-col">
          <button v-for="(cat, catIdx) in filteredCategories" :key="cat.id" @click="selectParent(cat)"
            class="dept-row btn-press">
            <div class="dept-num">
              <span class="num-label text-[13px]">0{{ catIdx + 1 }}</span>
            </div>
            <div class="dept-thumb">
              <img v-if="cat.image" :src="cat.image" :alt="getLocalizedName(cat.name)" class="w-full h-full object-contain p-1.5" style="mix-blend-mode: multiply;" />
              <span v-else class="serif text-[24px]" style="color: var(--text-primary); font-weight: 500">{{ getLocalizedName(cat.name).charAt(0) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="dept-name">{{ getLocalizedName(cat.name) }}</p>
              <p v-if="cat.children && cat.children.length" class="text-[11px] mt-0.5" style="color: var(--text-tertiary)">{{ cat.children.length }} {{ t('categories.subcategories') }}</p>
            </div>
            <svg width="12" height="12" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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
        <!-- Back -->
        <button @click="goBack" class="flex items-center gap-2 btn-press mb-4">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="eyebrow-sm">{{ t('ed.back_to_dep') }}</span>
        </button>

        <!-- Title -->
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

        <!-- Subcategory chips -->
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

        <!-- Products grid -->
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

.search-field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  transition: border-color 0.2s ease;
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

/* Department row */
.dept-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
  background: transparent;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
}
.dept-row:first-of-type {
  border-top: 1px solid var(--hairline);
}
.dept-num {
  flex-shrink: 0;
  width: 28px;
}
.dept-thumb {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  background: var(--img-bg);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.dept-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.15;
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
