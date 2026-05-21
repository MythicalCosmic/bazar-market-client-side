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
    <div class="cart-img">
      <img v-if="item.image" :src="item.image" :alt="getLocalizedName(item.name)" class="w-full h-full object-contain p-1" style="mix-blend-mode: multiply;" />
      <svg v-else width="22" height="22" style="color: var(--text-tertiary); opacity: 0.4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0 flex flex-col justify-center">
      <p class="cart-name truncate">{{ getLocalizedName(item.name) }}</p>
      <p v-if="parseFloat(item.quantity) !== (item.step || 1)" class="text-[10.5px] mt-0.5 tabular" style="color: var(--text-tertiary)">
        {{ formatPrice(item.price) }} × {{ formatQty(item.quantity, item.unit) }}
      </p>
      <p v-else class="text-[10.5px] mt-0.5 tabular" style="color: var(--text-tertiary)">
        {{ formatQty(item.quantity, item.unit) }}
      </p>
    </div>

    <!-- Price + Qty -->
    <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
      <p class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.01em;">{{ formatPrice(item.price * parseFloat(item.quantity)) }}</p>
      <div class="cart-qty">
        <button @click="decrement(item.id)" class="cart-qty-btn btn-press" aria-label="decrement">
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="color: var(--text-primary)">
            <path d="M5 12h14" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="text-[11px] font-semibold text-center min-w-[26px] tabular" style="color: var(--text-primary)">{{ formatQty(item.quantity, item.unit) }}</span>
        <button @click="addToCart(item)" class="cart-qty-btn btn-press" aria-label="increment">
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="color: var(--text-primary)">
            <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-row {
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 14px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--hairline);
}
.cart-row:last-child {
  border-bottom: none;
}

.cart-img {
  width: 62px;
  height: 76px;
  background: var(--img-bg);
  border: 1px solid var(--hairline);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.cart-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.2;
}

.cart-qty {
  display: flex;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: 2px;
  padding: 2px;
}

.cart-qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 1px;
  background: var(--surface);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s ease;
}
.cart-qty-btn:active {
  background: var(--surface-secondary);
}
</style>
