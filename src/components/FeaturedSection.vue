<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'

const props = defineProps({
  title: { type: String, default: '' },
  products: { type: Array, default: () => [] },
  onSeeAll: { type: Function, default: null },
  seeAllLabel: { type: String, default: '' },
})

const { addToCart, getQty, decrement } = useCartStore()
const { formatPrice } = useFormat()
const { getLocalizedName, t } = useI18n()
</script>

<template>
  <div v-if="products.length" class="mt-5">
    <!-- Section header -->
    <div class="flex items-center justify-between px-4 mb-3">
      <h2 class="text-base font-black" style="color: var(--text-primary)">{{ title }}</h2>
      <button
        v-if="onSeeAll"
        @click="onSeeAll"
        class="text-xs font-bold text-primary btn-press"
      >{{ seeAllLabel || t('home.see_all') }}</button>
    </div>

    <!-- Horizontal scroll -->
    <div class="scroll-x flex gap-3 px-4 pb-1">
      <div
        v-for="product in products"
        :key="product.id"
        class="flex-shrink-0 w-[140px] rounded-2xl p-3 flex flex-col gap-2 relative overflow-hidden product-card"
        style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)"
      >
        <!-- Badge -->
        <span
          v-if="product.badge"
          :class="[
            'absolute top-2 left-2 z-10 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg',
            product.badge === 'NEW' ? 'badge-new' : 'badge-hot',
          ]"
        >{{ product.badge === 'NEW' ? t('badge.new') : t('badge.hot') }}</span>

        <!-- Image -->
        <div class="w-full aspect-square flex items-center justify-center">
          <img :src="product.image" :alt="getLocalizedName(product.name)" class="w-full h-full object-contain" style="max-height: 90px" />
        </div>

        <!-- Name & price -->
        <p class="text-xs font-bold leading-tight line-clamp-2" style="color: var(--text-primary)">
          {{ getLocalizedName(product.name) }}
        </p>
        <p class="text-xs font-semibold" style="color: var(--text-secondary)">
          {{ formatPrice(product.price) }}
        </p>

        <!-- Add / Qty -->
        <button
          v-if="getQty(product.id) === 0"
          @click="addToCart(product)"
          class="w-7 h-7 rounded-full bg-primary flex items-center justify-center ml-auto btn-press"
          style="box-shadow: 0 3px 10px var(--primary-glow)"
        >
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div v-else class="flex items-center justify-between">
          <button @click="decrement(product.id)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
          <span class="text-sm font-black" style="color: var(--text-primary)">{{ getQty(product.id) }}</span>
          <button @click="addToCart(product)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
