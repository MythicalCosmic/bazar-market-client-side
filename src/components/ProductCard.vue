<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'
import { useFavorites } from '../stores/favoritesStore.js'

const props = defineProps({
  product: { type: Object, required: true },
})

const { addToCart, decrement, getQty } = useCartStore()
const { formatPrice } = useFormat()
const { t, getLocalizedName } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()
const qty = computed(() => getQty(props.product.id))
const fav = computed(() => isFavorite(props.product.id))
</script>

<template>
  <div
    class="product-card rounded-2xl p-3 flex flex-col gap-2 relative overflow-hidden"
    style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)"
  >
    <!-- Badge -->
    <span
      v-if="product.badge"
      :class="[
        'absolute top-2 left-2 z-10 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg',
        product.badge === 'NEW' ? 'badge-new' : 'badge-hot',
      ]"
    >{{ product.badge === 'NEW' ? t('badge.new') : t('badge.hot') }}</span>

    <!-- Favorite button -->
    <button
      @click.stop="toggleFavorite(product.id)"
      class="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center btn-press transition-all"
      :style="{ background: fav ? 'rgba(239,68,68,0.1)' : 'var(--surface-secondary)' }"
    >
      <svg class="w-3.5 h-3.5 transition-colors" :class="fav ? 'text-red-500' : ''" :style="!fav ? 'color: var(--text-tertiary)' : ''"
        :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
      </svg>
    </button>

    <!-- Image -->
    <div class="w-full aspect-square flex items-center justify-center p-1">
      <img :src="product.image" :alt="getLocalizedName(product.name)" class="w-full h-full object-contain" style="max-height:110px"/>
    </div>

    <!-- Name & price -->
    <p class="text-xs font-bold leading-tight line-clamp-2" style="color: var(--text-primary)">
      {{ getLocalizedName(product.name) }}
    </p>
    <p class="text-xs font-semibold" style="color: var(--text-secondary)">
      {{ formatPrice(product.price) }}
    </p>

    <!-- Add button -->
    <button
      v-if="qty === 0"
      @click="addToCart(product)"
      class="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-auto btn-press"
      style="box-shadow: 0 3px 10px var(--primary-glow)"
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
      <span class="text-sm font-black" style="color: var(--text-primary)">{{ qty }}</span>
      <button @click="addToCart(product)" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center btn-press">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>
