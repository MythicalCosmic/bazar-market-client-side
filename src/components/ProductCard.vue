<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import { useRouter } from '../router/index.js'

const props = defineProps({ product: { type: Object, required: true } })

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
    <div class="relative overflow-hidden" style="background: var(--img-bg); border-radius: 18px 18px 0 0;">
      <div class="w-full flex items-center justify-center p-4" style="height: 152px;">
        <img v-if="product.image" :src="product.image" :alt="getLocalizedName(product.name)"
          class="max-w-full max-h-full object-contain transition-transform duration-300" style="mix-blend-mode: multiply;" />
        <svg v-else width="36" height="36" style="color: var(--text-tertiary); opacity: 0.4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>

      <!-- Discount badge -->
      <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
        <span v-if="hasDiscount" class="discount-badge">-{{ discountPercent }}%</span>
      </div>

      <!-- Favorite -->
      <button @click.stop="handleFav"
        class="absolute top-2.5 right-2.5 z-10 fav-btn btn-press"
        :class="{ 'fav-active': fav }">
        <svg width="15" height="15" :class="fav ? 'text-red-500' : ''" :style="!fav ? 'color: var(--text-tertiary)' : ''"
          :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <!-- Out of stock overlay -->
      <div v-if="product.inStock === false" class="absolute inset-0 flex items-center justify-center" style="background: rgba(0,0,0,0.35); backdrop-filter: blur(2px)">
        <span class="text-white text-[11px] font-semibold px-3 py-1.5 rounded-full" style="background: rgba(0,0,0,0.5)">{{ t('product.out_of_stock') }}</span>
      </div>
    </div>

    <!-- Info -->
    <div class="p-3 flex flex-col flex-1">
      <p class="text-[12px] font-medium leading-snug line-clamp-2 mb-auto" style="color: var(--text-secondary)">{{ getLocalizedName(product.name) }}</p>

      <!-- Price row -->
      <div class="flex items-baseline gap-1.5 mt-2 mb-2.5">
        <p v-if="hasDiscount" class="text-[15px] font-bold text-primary">{{ formatPrice(product.discountedPrice) }}</p>
        <p :class="[hasDiscount ? 'text-[10px] line-through' : 'text-[15px] font-bold']"
          :style="{ color: hasDiscount ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
          {{ formatPrice(product.price) }}
        </p>
      </div>

      <!-- Add / Qty -->
      <button v-if="product.inStock !== false && qty === 0" @click.stop="addToCart(product)"
        class="add-btn btn-press">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
        {{ t('cart.add') }}
      </button>
      <div v-else-if="qty > 0" class="qty-controls" @click.stop>
        <button @click.stop="decrement(product.id)" class="qty-btn btn-press">
          <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
        </button>
        <span class="text-xs font-bold text-primary">{{ formatQty(qty, product.unit) }}</span>
        <button @click.stop="addToCart(product)" class="qty-btn btn-press">
          <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card-wrap {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 4px 16px var(--shadow);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}
.product-card-wrap:active {
  transform: scale(0.97);
}

.discount-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
  padding: 2px 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, #F97316, #EA580C);
}

.fav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}
.fav-active {
  background: rgba(239, 68, 68, 0.1);
}
.dark .fav-btn:not(.fav-active) {
  background: rgba(41, 37, 36, 0.9);
}

.add-btn {
  width: 100%;
  padding: 9px 0;
  border-radius: 12px;
  background: var(--primary);
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-shadow: 0 2px 8px var(--primary-glow);
  transition: all 0.2s ease;
}
.add-btn:active {
  transform: scale(0.96);
  box-shadow: 0 1px 4px var(--primary-glow);
}

.qty-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  padding: 3px;
  background: var(--primary-light);
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
}
.qty-btn:active {
  transform: scale(0.9);
}
</style>
