<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import AuthImage from '../components/AuthImage.vue'
import { useI18n } from '../i18n/index.js'
import { useRouter } from '../router/index.js'
import { getCategoryTree, getProducts, searchProducts } from '../services/api.js'

const { t, getLocalizedName } = useI18n()
const { routeParams } = useRouter()

const categoryTree = ref([])
const selectedParent = ref(null)
const selectedChild = ref(null)
const productsList = ref([])
const isLoading = ref(true)
const isLoadingProducts = ref(false)

onMounted(async () => {
  try {
    categoryTree.value = await getCategoryTree()
  } catch {}
  isLoading.value = false

  // Handle route params
  if (routeParams.value?.category) {
    selectParentById(routeParams.value.category)
  }
  if (routeParams.value?.search) {
    await doSearch(routeParams.value.search)
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
  await loadProducts(cat.id)
}

async function selectChild(child) {
  selectedChild.value = child
  await loadProducts(child.id)
}

async function loadProducts(categoryId) {
  isLoadingProducts.value = true
  try {
    const result = await getProducts({ category_id: categoryId, per_page: 50 })
    productsList.value = result.items || []
  } catch { productsList.value = [] }
  isLoadingProducts.value = false
}

async function doSearch(q) {
  if (!q.trim()) return
  isLoadingProducts.value = true
  try {
    productsList.value = await searchProducts(q)
  } catch { productsList.value = [] }
  isLoadingProducts.value = false
}

function goBack() {
  if (selectedChild.value) {
    selectedChild.value = null
    loadProducts(selectedParent.value.id)
  } else if (selectedParent.value) {
    selectedParent.value = null
    productsList.value = []
  }
}

const currentSubcategories = computed(() => {
  if (!selectedParent.value) return []
  return selectedParent.value.children || []
})
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="mt-4 px-4 grid grid-cols-2 gap-3">
        <div v-for="i in 6" :key="i" class="skeleton h-[100px] rounded-2xl"></div>
      </div>
    </template>

    <template v-else>
      <!-- No parent selected: show category grid -->
      <div v-if="!selectedParent" class="mt-4 px-4">
        <h2 class="text-base font-black mb-3" style="color: var(--text-primary)">{{ t('nav.categories') }}</h2>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="cat in categoryTree"
            :key="cat.id"
            @click="selectParent(cat)"
            class="rounded-2xl p-4 flex flex-col items-center gap-2 btn-press transition-all"
            style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)"
          >
            <div class="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden" style="background: var(--primary-light)">
              <AuthImage v-if="cat.image" :src="cat.image" class="w-full h-full object-cover" />
              <svg v-else width="24" height="24" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="2" stroke-width="2"/>
                <rect x="14" y="3" width="7" height="7" rx="2" stroke-width="2"/>
                <rect x="3" y="14" width="7" height="7" rx="2" stroke-width="2"/>
                <rect x="14" y="14" width="7" height="7" rx="2" stroke-width="2"/>
              </svg>
            </div>
            <p class="text-xs font-black text-center" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</p>
            <p v-if="cat.children.length" class="text-[10px] font-semibold" style="color: var(--text-tertiary)">
              {{ cat.children.length }} {{ t('categories.subcategories') }}
            </p>
          </button>
        </div>
      </div>

      <!-- Parent selected: show breadcrumb + subcategories + products -->
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
        <div v-if="currentSubcategories.length" class="scroll-x flex gap-2 px-4 pb-2">
          <button
            @click="selectedChild = null; loadProducts(selectedParent.id)"
            :class="['flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl transition-all duration-200 btn-press']"
            :style="{
              background: !selectedChild ? 'var(--primary)' : 'var(--surface)',
              boxShadow: !selectedChild ? '0 4px 12px var(--primary-glow)' : '0 1px 4px var(--shadow)',
              color: !selectedChild ? 'white' : 'var(--text-secondary)',
            }"
          >
            <span class="text-xs font-bold whitespace-nowrap">{{ t('categories.all_in') }} {{ getLocalizedName(selectedParent.name) }}</span>
          </button>
          <button
            v-for="sub in currentSubcategories"
            :key="sub.id"
            @click="selectChild(sub)"
            :class="['flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl transition-all duration-200 btn-press']"
            :style="{
              background: selectedChild?.id === sub.id ? 'var(--primary)' : 'var(--surface)',
              boxShadow: selectedChild?.id === sub.id ? '0 4px 12px var(--primary-glow)' : '0 1px 4px var(--shadow)',
              color: selectedChild?.id === sub.id ? 'white' : 'var(--text-secondary)',
            }"
          >
            <AuthImage v-if="sub.image" :src="sub.image" class="w-4 h-4 rounded object-cover" />
            <span class="text-xs font-bold whitespace-nowrap">{{ getLocalizedName(sub.name) }}</span>
          </button>
        </div>

        <!-- Products -->
        <div v-if="isLoadingProducts" class="px-4 mt-2 grid grid-cols-2 gap-3">
          <div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
        </div>
        <div v-else-if="productsList.length" class="px-4 mt-2 grid grid-cols-2 gap-3">
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
