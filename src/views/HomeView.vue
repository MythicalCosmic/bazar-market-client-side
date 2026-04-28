<script setup>
// src/views/HomeView.vue
import { useCartStore } from '../stores/cartStore.js'
import { useRouter } from '../router/index.js'
import ProductCard from '../components/ProductCard.vue'
import AppHeader from '../components/AppHeader.vue'
import { PRODUCTS } from '../stores/productsStore.js'
import { images } from '../assets/images.js'

const { navigate } = useRouter()
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Promo banner -->
    <div class="mt-3 mx-4">
      <div
        class="banner-bg rounded-3xl p-5 flex items-center justify-between overflow-hidden relative"
        style="min-height: 105px"
      >
        <div class="z-10">
          <p class="text-white text-5xl font-black leading-none">20%</p>
          <p class="text-green-100 text-xs font-semibold mt-1 leading-tight">Скидка на колу зеро</p>
        </div>
        <img
          :src="images.cola"
          alt="cola"
          class="absolute right-3 bottom-0 h-28 object-contain"
          style="filter: drop-shadow(0 4px 14px rgba(0,0,0,0.25))"
        />
      </div>
    </div>

    <!-- Products grid -->
    <div class="mt-4 px-4 grid grid-cols-2 gap-3">
      <ProductCard v-for="p in PRODUCTS" :key="p.id" :product="p" />
    </div>
  </div>
</template>
