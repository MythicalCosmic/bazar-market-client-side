<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import CategoryIcon from '../components/CategoryIcon.vue'
import { useI18n } from '../i18n/index.js'
import { useRouter } from '../router/index.js'
import { products, categories, loadProducts, isLoading } from '../stores/productsStore.js'

const { t } = useI18n()
const { routeParams } = useRouter()

const selectedCat = ref(routeParams.value?.category || 'all')

onMounted(() => {
  loadProducts()
  if (routeParams.value?.category) {
    selectedCat.value = routeParams.value.category
  }
})

watch(routeParams, (params) => {
  if (params?.category) selectedCat.value = params.category
})

const filteredProducts = computed(() => {
  if (selectedCat.value === 'all') return products.value
  if (selectedCat.value === 'hot') return products.value.filter((p) => p.badge === 'HOT' || p.isFeatured)
  return products.value.filter((p) => p.category === selectedCat.value)
})
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="mt-3 px-4 flex gap-2">
        <div v-for="i in 5" :key="i" class="skeleton w-20 h-14 rounded-2xl flex-shrink-0"></div>
      </div>
      <div class="mt-4 px-4 grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
      </div>
    </template>

    <template v-else>
      <!-- Category chips -->
      <div class="mt-3 scroll-x flex gap-2 px-4 pb-1">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCat = cat.id"
          :class="[
            'flex flex-col items-center gap-1 flex-shrink-0 px-3 py-2 rounded-2xl transition-all duration-200 btn-press',
            selectedCat === cat.id ? 'text-white' : ''
          ]"
          :style="{
            background: selectedCat === cat.id ? 'var(--primary)' : 'var(--surface)',
            boxShadow: selectedCat === cat.id ? '0 4px 12px var(--primary-glow)' : '0 1px 4px var(--shadow)',
          }"
        >
          <CategoryIcon :icon="cat.icon" size="20" />
          <span
            :class="['text-[10px] font-bold whitespace-nowrap']"
            :style="{ color: selectedCat === cat.id ? 'white' : 'var(--text-secondary)' }"
          >{{ t(cat.labelKey) }}</span>
        </button>
      </div>

      <!-- Products grid -->
      <div class="mt-4 px-4 grid grid-cols-2 gap-3">
        <TransitionGroup name="fade">
          <ProductCard v-for="p in filteredProducts" :key="p.id" :product="p" />
        </TransitionGroup>
      </div>

      <!-- Empty category -->
      <div v-if="filteredProducts.length === 0" class="flex flex-col items-center py-16">
        <div class="text-5xl mb-3">🔍</div>
        <p class="text-sm font-bold" style="color: var(--text-tertiary)">{{ t('common.loading') }}</p>
      </div>
    </template>
  </div>
</template>
