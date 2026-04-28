<script setup>
// src/views/CategoriesView.vue
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import { CATEGORIES, PRODUCTS } from '../stores/productsStore.js'

const selectedCat = ref('all')

const filteredProducts = computed(() => {
  if (selectedCat.value === 'all') return PRODUCTS
  return PRODUCTS.filter((p) => p.category === selectedCat.value)
})
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Category chips row -->
    <div class="mt-3 scroll-x flex gap-2 px-4 pb-1">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.id"
        @click="selectedCat = cat.id"
        :class="[
          'flex flex-col items-center gap-1 flex-shrink-0 px-3 py-2 rounded-2xl transition-all btn-press',
          selectedCat === cat.id
            ? 'bg-primary text-white shadow-lg'
            : 'bg-white text-gray-600 shadow-sm',
        ]"
      >
        <span class="text-xl leading-none">{{ cat.emoji }}</span>
        <span
          :class="['text-[10px] font-bold whitespace-nowrap', selectedCat === cat.id ? 'text-white' : 'text-gray-600']"
        >{{ cat.label }}</span>
      </button>
    </div>

    <!-- Products grid -->
    <div class="mt-4 px-4 grid grid-cols-2 gap-3">
      <ProductCard
        v-for="p in filteredProducts"
        :key="p.id"
        :product="p"
      />
    </div>
  </div>
</template>
