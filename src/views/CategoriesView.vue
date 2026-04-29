<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import { useI18n } from '../i18n/index.js'
import { useRouter } from '../router/index.js'
import { products, categories, loadProducts, isLoading } from '../stores/productsStore.js'
import { searchProducts } from '../services/api.js'

const { t, getLocalizedName } = useI18n()
const { routeParams } = useRouter()

const selectedCat = ref(routeParams.value?.category || 'all')
const searchQuery = ref('')
const searchResultProducts = ref([])
const isSearching = ref(false)

onMounted(async () => {
  loadProducts()
  if (routeParams.value?.category) selectedCat.value = routeParams.value.category
  if (routeParams.value?.search) {
    searchQuery.value = routeParams.value.search
    await doSearch(routeParams.value.search)
  }
})

watch(routeParams, async (params) => {
  if (params?.category) selectedCat.value = params.category
  if (params?.search) {
    searchQuery.value = params.search
    await doSearch(params.search)
  }
})

async function doSearch(q) {
  if (!q.trim()) { searchResultProducts.value = []; return }
  isSearching.value = true
  try {
    searchResultProducts.value = await searchProducts(q)
  } catch { searchResultProducts.value = [] }
  isSearching.value = false
}

const allCategories = computed(() => {
  const synthetic = [
    { id: 'all', name: { uz: 'Hammasi', ru: 'Все', en: 'All' }, image: null, icon: 'sparkles' },
  ]
  return [...synthetic, ...categories.value]
})

const filteredProducts = computed(() => {
  if (searchQuery.value.trim()) return searchResultProducts.value
  if (selectedCat.value === 'all') return products.value
  return products.value.filter((p) => p.category === selectedCat.value)
})
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <template v-if="isLoading">
      <div class="mt-3 px-4 flex gap-2">
        <div v-for="i in 5" :key="i" class="skeleton w-20 h-14 rounded-2xl flex-shrink-0"></div>
      </div>
      <div class="mt-4 px-4 grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
      </div>
    </template>

    <template v-else>
      <div class="mt-3 scroll-x flex gap-2 px-4 pb-1">
        <button
          v-for="cat in allCategories"
          :key="cat.id"
          @click="selectedCat = cat.id"
          :class="['flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-2xl transition-all duration-200 btn-press']"
          :style="{
            background: selectedCat === cat.id ? 'var(--primary)' : 'var(--surface)',
            boxShadow: selectedCat === cat.id ? '0 4px 12px var(--primary-glow)' : '0 1px 4px var(--shadow)',
          }"
        >
          <img v-if="cat.image" :src="cat.image" class="w-5 h-5 rounded object-cover" />
          <span :class="['text-xs font-bold whitespace-nowrap']"
            :style="{ color: selectedCat === cat.id ? 'white' : 'var(--text-secondary)' }">
            {{ getLocalizedName(cat.name) }}
          </span>
        </button>
      </div>

      <div class="mt-4 px-4 grid grid-cols-2 gap-3">
        <TransitionGroup name="fade">
          <ProductCard v-for="p in filteredProducts" :key="p.id" :product="p" />
        </TransitionGroup>
      </div>

      <div v-if="filteredProducts.length === 0 && !isLoading" class="flex flex-col items-center py-16">
        <div class="text-5xl mb-3">🔍</div>
        <p class="text-sm font-bold" style="color: var(--text-tertiary)">{{ t('common.loading') }}</p>
      </div>
    </template>
  </div>
</template>
