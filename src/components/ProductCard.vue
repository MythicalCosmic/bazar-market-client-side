<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import { useRouter } from '../router/index.js'

const props = defineProps({
  product: { type: Object, required: true },
})

const { addToCart, decrement, getQty } = useCartStore()
const { formatPrice } = useFormat()
const { t, getLocalizedName } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()
const { isLoggedIn } = useAuth()
const { navigate } = useRouter()

const qty = computed(() => getQty(props.product.id))
const fav = computed(() => isFavorite(props.product.id))
const desc = computed(() => getLocalizedName(props.product.description))
const hasDiscount = computed(() => props.product.discountedPrice && props.product.discountedPrice < props.product.price)
const isLowStock = computed(() => {
  const s = props.product.stockQty
  return s !== null && s !== undefined && s > 0 && s <= 10
})

async function handleFavorite() {
  if (!isLoggedIn.value) {
    navigate('login')
    return
  }
  await toggleFavorite(props.product.id)
}
</script>

<template>
  <div
    class="product-card rounded-2xl p-3 flex flex-col relative overflow-hidden"
    style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)"
  >
    <!-- Discount badge (takes priority) -->
    <span v-if="hasDiscount" class="absolute top-2 left-2 z-10 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg" style="background: linear-gradient(135deg, #ff6b35, #e84545)">
      -{{ Math.round((1 - product.discountedPrice / product.price) * 100) }}%
    </span>
    <!-- HOT/NEW badge (only when no discount) -->
    <span
      v-else-if="product.badge && product.badge !== 'SALE'"
      :class="[
        'absolute top-2 left-2 z-10 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg',
        product.badge === 'NEW' ? 'badge-new' : 'badge-hot',
      ]"
    >{{ product.badge === 'NEW' ? t('badge.new') : t('badge.hot') }}</span>

    <!-- Favorite button -->
    <button
      @click.stop="handleFavorite"
      class="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center btn-press transition-all"
      :style="{ background: fav ? 'rgba(239,68,68,0.15)' : 'var(--surface-secondary)' }"
    >
      <svg width="14" height="14" class="transition-colors" :class="fav ? 'text-red-500' : ''" :style="!fav ? 'color: var(--text-tertiary)' : ''"
        :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
      </svg>
    </button>

    <!-- Image -->
    <div class="w-full aspect-square flex items-center justify-center p-1 mb-1">
      <img v-if="product.image" :src="product.image" :alt="getLocalizedName(product.name)" class="w-full h-full object-contain" style="max-height:110px"/>
      <div v-else class="w-full h-full flex items-center justify-center rounded-xl" style="background: var(--surface-secondary)">
        <svg width="32" height="32" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
          <path d="M21 15l-5-5L5 21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <!-- Name -->
    <p class="text-xs font-bold leading-tight line-clamp-2 mb-0.5" style="color: var(--text-primary)">
      {{ getLocalizedName(product.name) }}
    </p>

    <!-- Description -->
    <p v-if="desc" class="text-[10px] font-semibold leading-tight line-clamp-1 mb-1" style="color: var(--text-tertiary)">
      {{ desc }}
    </p>

    <!-- Stock warning -->
    <p v-if="isLowStock" class="text-[9px] font-black text-orange-500 mb-1">
      {{ t('product.left_in_stock', { count: product.stockQty }) }}
    </p>

    <!-- Out of stock -->
    <p v-if="product.inStock === false" class="text-[9px] font-black text-red-500 mb-1">
      {{ t('product.out_of_stock') }}
    </p>

    <!-- Price -->
    <div class="flex items-center gap-1.5 mt-auto">
      <p v-if="hasDiscount" class="text-xs font-black text-primary">
        {{ formatPrice(product.discountedPrice) }}
      </p>
      <p :class="['text-xs font-semibold', hasDiscount ? 'line-through' : 'font-bold']"
        :style="{ color: hasDiscount ? 'var(--text-tertiary)' : 'var(--text-secondary)' }">
        {{ formatPrice(product.price) }}
      </p>
    </div>

    <!-- Add button / Qty controls -->
    <div class="mt-2">
      <div v-if="product.inStock === false" class="text-center">
        <span class="text-[10px] font-bold px-3 py-1.5 rounded-lg" style="background: var(--surface-secondary); color: var(--text-tertiary)">
          {{ t('product.out_of_stock') }}
        </span>
      </div>
      <button
        v-else-if="qty === 0"
        @click="addToCart(product)"
        class="w-full py-2 rounded-xl bg-primary flex items-center justify-center gap-1.5 btn-press"
        style="box-shadow: 0 3px 10px var(--primary-glow)"
      >
        <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <span class="text-white text-[11px] font-black">{{ t('cart.add') }}</span>
      </button>
      <div v-else class="flex items-center justify-between">
        <button @click="decrement(product.id)" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center btn-press">
          <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="text-sm font-black" style="color: var(--text-primary)">{{ qty }}</span>
        <button @click="addToCart(product)" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center btn-press">
          <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
