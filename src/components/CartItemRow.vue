<script setup>
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'

const props = defineProps({
  item: { type: Object, required: true },
})

const { addToCart, decrement } = useCartStore()
const { formatPrice } = useFormat()
const { getLocalizedName } = useI18n()
</script>

<template>
  <div class="rounded-2xl p-3 flex items-center gap-3" style="background: var(--surface); box-shadow: 0 2px 10px var(--shadow)">
    <!-- Image -->
    <div class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style="background: var(--surface-secondary)">
      <img :src="item.image" :alt="getLocalizedName(item.name)" class="w-full h-full object-contain rounded-xl" />
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="text-xs font-bold truncate" style="color: var(--text-primary)">{{ getLocalizedName(item.name) }}</p>
      <p class="text-xs font-black mt-0.5" style="color: var(--text-primary)">{{ formatPrice(item.price) }}</p>
      <p v-if="item.quantity > 1" class="text-[10px] font-semibold" style="color: var(--text-tertiary)">
        {{ formatPrice(item.price) }} x {{ item.quantity }}
      </p>
    </div>

    <!-- Qty controls -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <button @click="decrement(item.id)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M5 12h14" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="text-sm font-black w-5 text-center" style="color: var(--text-primary)">{{ item.quantity }}</span>
      <button @click="addToCart(item)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>
