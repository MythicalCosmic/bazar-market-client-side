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
  <div class="cart-row">
    <!-- Image -->
    <div class="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden" style="background: var(--img-bg);">
      <img v-if="item.image" :src="item.image" :alt="getLocalizedName(item.name)" class="w-full h-full object-contain p-1" style="mix-blend-mode: multiply;" />
      <svg v-else width="24" height="24" style="color: var(--text-tertiary); opacity: 0.4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/><path d="M21 15l-5-5L5 21" stroke-width="2"/>
      </svg>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="text-[13px] font-semibold truncate" style="color: var(--text-primary)">{{ getLocalizedName(item.name) }}</p>
      <p class="text-[13px] font-bold mt-0.5" style="color: var(--text-primary)">{{ formatPrice(item.price) }}</p>
      <p v-if="parseFloat(item.quantity) !== (item.step || 1)" class="text-[10px] font-medium" style="color: var(--text-tertiary)">
        {{ formatPrice(item.price) }} × {{ formatQty(item.quantity, item.unit) }}
      </p>
    </div>

    <!-- Qty controls -->
    <div class="flex items-center gap-1.5 flex-shrink-0 cart-qty">
      <button @click="decrement(item.id)" class="cart-qty-btn btn-press">
        <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="text-xs font-bold text-center min-w-[28px] text-primary">{{ formatQty(item.quantity, item.unit) }}</span>
      <button @click="addToCart(item)" class="cart-qty-btn btn-press">
        <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.cart-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 12px var(--shadow);
}

.cart-qty {
  background: var(--primary-light);
  border-radius: 12px;
  padding: 3px;
}

.cart-qty-btn {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
