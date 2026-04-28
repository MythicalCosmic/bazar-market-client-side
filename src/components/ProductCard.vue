<script setup>
// src/components/ProductCard.vue
import { computed } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'

const props = defineProps({
  product: { type: Object, required: true },
})

const { addToCart, decrement, getQty } = useCartStore()
const { formatPrice } = useFormat()
const qty = computed(() => getQty(props.product.id))
</script>

<template>
  <div
    class="product-card bg-white rounded-2xl p-3 flex flex-col gap-2 relative overflow-hidden"
    style="box-shadow: 0 2px 12px rgba(0,0,0,0.07)"
  >
    <!-- Badge -->
    <span
      v-if="product.badge"
      :class="[
        'absolute top-2 left-2 z-10 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg',
        product.badge === 'NEW' ? 'badge-new' : 'badge-hot',
      ]"
    >{{ product.badge }}</span>

    <!-- Image -->
    <div class="w-full aspect-square flex items-center justify-center p-1">
      <img :src="product.image" :alt="product.name" class="w-full h-full object-contain" style="max-height:110px"/>
    </div>

    <!-- Name & price -->
    <p class="text-xs font-bold text-gray-800 leading-tight line-clamp-2">{{ product.name }}</p>
    <p class="text-xs font-semibold text-gray-500">{{ formatPrice(product.price) }}</p>

    <!-- Add button -->
    <button
      v-if="qty === 0"
      @click="addToCart(product)"
      class="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-auto btn-press"
      style="box-shadow: 0 3px 10px rgba(45,184,75,0.4)"
    >
      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </button>

    <!-- Qty controls -->
    <div v-else class="flex items-center justify-between">
      <button @click="decrement(product.id)" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center btn-press">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="text-sm font-black text-gray-800">{{ qty }}</span>
      <button @click="addToCart(product)" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center btn-press">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>
