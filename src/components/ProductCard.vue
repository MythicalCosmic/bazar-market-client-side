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
  variant: { type: String, default: 'default' }, // default | editorial | minimal
})

const { addToCart, decrement, getQty } = useCartStore()
const { formatPrice, formatQty } = useFormat()
const { t, getLocalizedName } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()
const { isLoggedIn } = useAuth()
const { navigate } = useRouter()

const qty = computed(() => getQty(props.product.id))
const fav = computed(() => isFavorite(props.product.id))
const hasDiscount = computed(() => props.product.discountedPrice && props.product.discountedPrice < props.product.price)
const discountPercent = computed(() => hasDiscount.value ? Math.round((1 - props.product.discountedPrice / props.product.price) * 100) : 0)

async function handleFav() {
  if (!isLoggedIn.value) { navigate('login'); return }
  await toggleFavorite(props.product.id)
}
</script>

<template>
  <div @click="navigate('product', { productId: product.id })"
    class="product-card-wrap">

    <!-- Image area -->
    <div class="product-img-area">
      <div class="w-full flex items-center justify-center p-4 relative" style="height: 156px;">
        <img v-if="product.image" :src="product.image" :alt="getLocalizedName(product.name)"
          class="max-w-full max-h-full object-contain transition-transform duration-500 product-img" style="mix-blend-mode: multiply;" />
        <svg v-else width="36" height="36" style="color: var(--text-tertiary); opacity: 0.4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>

      <!-- Editorial discount badge (corner-cut style) -->
      <div v-if="hasDiscount" class="discount-corner">
        <span class="num-label text-[10px] leading-none">−{{ discountPercent }}<span class="text-[8px] align-top">%</span></span>
      </div>

      <!-- Favorite (hairline-bordered) -->
      <button @click.stop="handleFav"
        class="fav-btn btn-press"
        :class="{ 'fav-active': fav }">
        <svg width="13" height="13"
          :style="{ color: fav ? 'var(--terracotta)' : 'var(--text-tertiary)' }"
          :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <!-- Out of stock overlay -->
      <div v-if="product.inStock === false" class="absolute inset-0 flex items-center justify-center" style="background: rgba(26,38,32,0.55); backdrop-filter: blur(3px)">
        <span class="eyebrow text-[9px] px-3 py-1" style="color: var(--cream); background: rgba(26,38,32,0.7); border: 1px solid rgba(245,239,227,0.3); border-radius: 2px">{{ t('product.out_of_stock') }}</span>
      </div>
    </div>

    <!-- Editorial hairline divider -->
    <div class="hairline mx-3"></div>

    <!-- Info -->
    <div class="px-3 py-3 flex flex-col flex-1">
      <p class="product-name line-clamp-2 mb-auto">{{ getLocalizedName(product.name) }}</p>

      <!-- Price row -->
      <div class="flex items-baseline justify-between gap-2 mt-2 mb-2.5">
        <div class="flex items-baseline gap-1.5">
          <p v-if="hasDiscount" class="serif text-[16px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.02em;">{{ formatPrice(product.discountedPrice) }}</p>
          <p :class="[hasDiscount ? 'text-[10px] line-through tabular' : 'serif text-[16px] tabular']"
            :style="{ color: hasDiscount ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: hasDiscount ? '500' : '500', letterSpacing: '-0.02em' }">
            {{ formatPrice(product.price) }}
          </p>
        </div>
      </div>

      <!-- Add / Qty -->
      <button v-if="product.inStock !== false && qty === 0" @click.stop="addToCart(product)"
        class="add-btn btn-press">
        <span class="eyebrow-sm" style="color: inherit;">{{ t('cart.add') }}</span>
        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div v-else-if="qty > 0" class="qty-controls" @click.stop>
        <button @click.stop="decrement(product.id)" class="qty-btn-edit btn-press" aria-label="decrement">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <span class="text-[12px] font-semibold tabular" style="color: var(--text-primary)">{{ formatQty(qty, product.unit) }}</span>
        <button @click.stop="addToCart(product)" class="qty-btn-edit btn-press" aria-label="increment">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card-wrap {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.32s ease, border-color 0.32s ease;
  -webkit-tap-highlight-color: transparent;
}
.product-card-wrap:active {
  transform: scale(0.98) translateY(2px);
  box-shadow: var(--shadow);
}
.product-card-wrap:hover .product-img {
  transform: scale(1.04);
}

.product-img-area {
  position: relative;
  overflow: hidden;
  background: var(--img-bg);
}

.discount-corner {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--bordeaux);
  color: var(--cream);
  padding: 5px 10px 6px 10px;
  border-bottom-right-radius: 4px;
  z-index: 10;
}
.discount-corner .num-label {
  color: var(--cream);
}

.fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--hairline);
  transition: all 0.2s ease;
  z-index: 10;
}
.fav-active {
  border-color: var(--terracotta);
}

.product-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 13.5px;
  font-weight: 450;
  line-height: 1.22;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.add-btn {
  width: 100%;
  padding: 9px 0;
  border-radius: 2px;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}
.add-btn:active {
  background: var(--surface-ink);
  color: var(--cream);
  border-color: var(--surface-ink);
}
.add-btn:hover {
  background: var(--surface-ink);
  color: var(--cream);
  border-color: var(--surface-ink);
}

.qty-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  background: var(--surface-secondary);
  border: 1px solid var(--hairline);
  border-radius: 2px;
}

.qty-btn-edit {
  width: 26px;
  height: 26px;
  border-radius: 2px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, background 0.15s ease;
}
.qty-btn-edit:active {
  background: var(--surface-ink);
  color: var(--cream);
  transform: scale(0.92);
}
</style>
