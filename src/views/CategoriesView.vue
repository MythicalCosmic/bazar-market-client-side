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

// Soft pastel colors for category cards
const pastelColors = [
  { bg: '#F3E8FF', text: '#7C3AED' },  // purple
  { bg: '#FCE7F3', text: '#DB2777' },  // pink
  { bg: '#DBEAFE', text: '#2563EB' },  // blue
  { bg: '#D1FAE5', text: '#059669' },  // green
  { bg: '#FEF3C7', text: '#D97706' },  // amber
  { bg: '#FFE4E6', text: '#E11D48' },  // rose
  { bg: '#E0E7FF', text: '#4F46E5' },  // indigo
  { bg: '#CCFBF1', text: '#0D9488' },  // teal
  { bg: '#FDE68A', text: '#B45309' },  // yellow
  { bg: '#C7D2FE', text: '#4338CA' },  // violet
]

function getColor(index) {
  return pastelColors[index % pastelColors.length]
}

onMounted(async () => {
  try {
    categoryTree.value = await getCategoryTree()
  } catch {}
  isLoading.value = false

  if (routeParams.value?.category) {
    selectParentById(routeParams.value.category)
  }
})

watch(routeParams, (params) => {
  if (params?.category) selectParentById(params.category)
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
      <div class="mt-4 px-4 flex flex-col gap-4">
        <div class="skeleton h-8 w-40 rounded-xl"></div>
        <div class="grid grid-cols-3 gap-2.5">
          <div v-for="i in 6" :key="i" class="skeleton h-[120px] rounded-2xl"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Category Browse (no parent selected) ═══ -->
      <div v-if="!selectedParent" class="mt-3 px-4">
        <!-- Search -->
        <div class="flex items-center rounded-xl px-3 py-2.5 gap-2 mb-4" style="background: var(--surface-secondary)">
          <svg width="16" height="16" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input v-model="searchQuery" :placeholder="t('categories.search_placeholder')" type="text"
            class="bg-transparent outline-none text-sm font-semibold flex-1" style="color: var(--text-primary)" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="btn-press p-0.5">
            <svg width="14" height="14" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Category sections -->
        <div v-for="(cat, catIdx) in filteredCategories" :key="cat.id"
          class="mb-4 rounded-2xl p-4 overflow-hidden"
          style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
          <!-- Section title -->
          <h2 class="text-base font-black mb-3" style="color: var(--text-primary)">
            {{ getLocalizedName(cat.name) }}
          </h2>

          <!-- Subcategory cards grid -->
          <div v-if="cat.children && cat.children.length" class="grid gap-2.5"
            :class="cat.children.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'">
            <button
              v-for="(sub, subIdx) in cat.children"
              :key="sub.id"
              @click="goToSubcategory(cat, sub)"
              class="rounded-xl p-3 flex flex-col justify-between text-left btn-press overflow-hidden relative transition-transform"
              :style="{
                background: getColor(catIdx * 10 + subIdx).bg,
                minHeight: cat.children.length <= 2 ? '130px' : '110px',
              }"
            >
              <p class="text-[11px] font-black leading-tight pr-1 relative z-10" :style="{ color: getColor(catIdx * 10 + subIdx).text }">
                {{ getLocalizedName(sub.name) }}
              </p>
              <div class="flex justify-end mt-1">
                <img v-if="sub.image" :src="sub.image" :alt="getLocalizedName(sub.name)"
                  class="w-14 h-14 object-contain drop-shadow-sm" />
                <div v-else class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: getColor(catIdx * 10 + subIdx).text + '15' }">
                  <svg width="18" height="18" :style="{ color: getColor(catIdx * 10 + subIdx).text }" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>
                  </svg>
                </div>
              </div>
            </button>
          </div>

          <!-- No subcategories — show browse button -->
          <button v-else
            @click="selectParent(cat)"
            class="w-full rounded-xl p-3 flex items-center justify-between btn-press"
            :style="{ background: getColor(catIdx).bg }"
          >
            <p class="text-sm font-bold" :style="{ color: getColor(catIdx).text }">
              {{ t('categories.all_in') }} {{ getLocalizedName(cat.name) }}
            </p>
            <svg width="18" height="18" :style="{ color: getColor(catIdx).text }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- No results -->
        <div v-if="!filteredCategories.length && searchQuery" class="flex flex-col items-center py-16">
          <div class="text-5xl mb-3">🔍</div>
          <p class="text-sm font-bold" style="color: var(--text-tertiary)">{{ t('categories.no_products') }}</p>
        </div>
      </div>

      <!-- ═══ Inside a category (products view) ═══ -->
      <div v-else class="mt-3">
        <!-- Back + title -->
        <div class="flex items-center gap-2 px-4 mb-3">
          <button @click="goBack" class="w-8 h-8 rounded-xl flex items-center justify-center btn-press flex-shrink-0" style="background: var(--surface-secondary)">
            <svg width="18" height="18" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h2 class="text-base font-black" style="color: var(--text-primary)">{{ getLocalizedName(selectedParent.name) }}</h2>
        </div>

        <!-- Subcategory chips -->
        <div v-if="currentSubcategories.length" class="scroll-x flex gap-2 px-4 pb-3">
          <button
            @click="selectedChild = null; loadAllProducts(selectedParent)"
            class="flex items-center gap-1.5 flex-shrink-0 px-4 py-2.5 rounded-xl transition-all duration-200 btn-press"
            :style="{
              background: !selectedChild ? 'var(--primary)' : 'var(--surface)',
              boxShadow: !selectedChild ? '0 4px 12px var(--primary-glow)' : '0 1px 4px var(--shadow)',
              color: !selectedChild ? 'white' : 'var(--text-secondary)',
            }"
          >
            <span class="text-xs font-bold whitespace-nowrap">{{ t('categories.all_in') }} {{ getLocalizedName(selectedParent.name) }}</span>
          </button>
          <button
            v-for="(sub, idx) in currentSubcategories"
            :key="sub.id"
            @click="selectChild(sub)"
            class="flex items-center gap-1.5 flex-shrink-0 px-4 py-2.5 rounded-xl transition-all duration-200 btn-press"
            :style="{
              background: selectedChild?.id === sub.id ? getColor(idx).text : 'var(--surface)',
              boxShadow: selectedChild?.id === sub.id ? '0 4px 12px ' + getColor(idx).text + '40' : '0 1px 4px var(--shadow)',
              color: selectedChild?.id === sub.id ? 'white' : 'var(--text-secondary)',
            }"
          >
            <img v-if="sub.image" :src="sub.image" class="w-4 h-4 rounded object-cover" />
            <span class="text-xs font-bold whitespace-nowrap">{{ getLocalizedName(sub.name) }}</span>
          </button>
        </div>

        <!-- Products -->
        <div v-if="isLoadingProducts" class="px-4 mt-1 grid grid-cols-2 gap-3">
          <div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
        </div>
        <div v-else-if="productsList.length" class="px-4 mt-1 grid grid-cols-2 gap-3">
          <ProductCard v-for="p in productsList" :key="p.id" :product="p" />
        </div>
        <div v-else class="flex flex-col items-center py-16">
          <div class="text-5xl mb-3">📦</div>
          <p class="text-sm font-bold" style="color: var(--text-tertiary)">{{ t('categories.no_products') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
