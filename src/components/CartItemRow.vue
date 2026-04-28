<script setup>
// src/components/CartItemRow.vue
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'

const props = defineProps({
  item: { type: Object, required: true },
})

const { addToCart, decrement } = useCartStore()
const { formatPrice } = useFormat()
</script>

<template>
  <div class="bg-white rounded-2xl p-3 flex items-center gap-3" style="box-shadow: 0 2px 10px rgba(0,0,0,0.06)">
    <!-- Image -->
    <div class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
      <img :src="item.image" :alt="item.name" class="w-full h-full object-contain rounded-xl" />
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="text-xs font-bold text-gray-800 truncate">{{ item.name }}</p>
      <p class="text-xs font-black text-gray-900 mt-0.5">{{ formatPrice(item.price) }}</p>
      <p v-if="item.quantity > 1" class="text-[10px] text-gray-400 font-semibold">
        {{ formatPrice(item.price) }} x {{ item.quantity }}
      </p>
    </div>

    <!-- Qty controls -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <button
        @click="decrement(item.id)"
        class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press"
      >
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M5 12h14" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="text-sm font-black text-gray-800 w-5 text-center">{{ item.quantity }}</span>
      <button
        @click="addToCart(item)"
        class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press"
      >
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>
