<script setup>

import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'

const props = defineProps({
  item: { type: Object, required: true },
})

const { addToCart, decrement } = useCartStore()
const { formatPrice, formatQty } = useFormat()
const { getLocalizedName } = useI18n()
</script>

<template>
  <div class="rounded-2xl p-3 flex items-center gap-3" style="background: var(--surface); box-shadow: 0 2px 10px var(--shadow)">
    <!-- Image -->
    <div class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style="background: var(--img-bg);">
      <img v-if="item.image" :src="item.image" :alt="getLocalizedName(item.name)" class="w-full h-full object-contain rounded-xl" style="mix-blend-mode: var(--img-blend);" />
      <svg v-else width="24" height="24" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/><path d="M21 15l-5-5L5 21" stroke-width="2"/>
      </svg>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="text-xs font-bold truncate" style="color: var(--text-primary)">{{ getLocalizedName(item.name) }}</p>
      <p class="text-xs font-black mt-0.5" style="color: var(--text-primary)">{{ formatPrice(item.price) }}</p>
      <p v-if="parseFloat(item.quantity) !== (item.step || 1)" class="text-[10px] font-semibold" style="color: var(--text-tertiary)">
        {{ formatPrice(item.price) }} × {{ formatQty(item.quantity, item.unit) }}
      </p>
    </div>

    <!-- Qty controls -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <button @click="decrement(item.id)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
        <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M5 12h14" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="text-xs font-black text-center min-w-[32px]" style="color: var(--text-primary)">{{ formatQty(item.quantity, item.unit) }}</span>
      <button @click="addToCart(item)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
        <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>
