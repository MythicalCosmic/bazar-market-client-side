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
    class="group rounded-2xl flex flex-col relative overflow-hidden cursor-pointer transition-all duration-200"
    style="background: var(--surface); box-shadow: 0 1px 8px var(--shadow)">

    <!-- Image area -->
    <div class="relative overflow-hidden rounded-t-2xl" style="background: var(--img-bg);">
      <div class="w-full flex items-center justify-center p-4" style="height: 150px;">
        <img v-if="product.image" :src="product.image" :alt="getLocalizedName(product.name)"
          class="max-w-full max-h-full object-contain transition-transform duration-300" style="mix-blend-mode: multiply;" />
        <svg v-else width="36" height="36" style="color: var(--surface-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>

      <!-- Badges -->
      <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
        <span v-if="hasDiscount" class="text-white text-[10px] font-black px-2 py-0.5 rounded-lg" style="background: #ef4444;">-{{ discountPercent }}%</span>
        <span v-if="product.badge === 'HOT'" class="text-white text-[10px] font-black px-2 py-0.5 rounded-lg badge-hot">{{ t('badge.hot') }}</span>
      </div>

      <!-- Favorite -->
      <button @click.stop="handleFav"
        class="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center btn-press transition-all duration-200"
        :style="{ background: fav ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }">
        <svg width="16" height="16" :class="fav ? 'text-red-500' : ''" :style="!fav ? 'color: var(--text-tertiary)' : ''"
          :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <!-- Out of stock overlay -->
      <div v-if="product.inStock === false" class="absolute inset-0 flex items-center justify-center" style="background: rgba(0,0,0,0.4)">
        <span class="text-white text-xs font-black px-3 py-1.5 rounded-xl" style="background: rgba(0,0,0,0.6)">{{ t('product.out_of_stock') }}</span>
      </div>
    </div>

    <!-- Info -->
    <div class="p-3 flex flex-col flex-1">
      <p class="text-[12px] font-bold leading-snug line-clamp-2 mb-1" style="color: var(--text-primary)">{{ getLocalizedName(product.name) }}</p>

      <!-- Price row -->
      <div class="flex items-baseline gap-1.5 mt-auto mb-2">
        <p v-if="hasDiscount" class="text-sm font-black text-primary">{{ formatPrice(product.discountedPrice) }}</p>
        <p :class="[hasDiscount ? 'text-[10px] line-through' : 'text-sm font-black']"
          :style="{ color: hasDiscount ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
          {{ formatPrice(product.price) }}
        </p>
      </div>

      <!-- Add / Qty -->
      <button v-if="product.inStock !== false && qty === 0" @click.stop="addToCart(product)"
        class="w-full py-2 rounded-xl bg-primary text-white text-[11px] font-black flex items-center justify-center gap-1.5 btn-press"
        style="box-shadow: 0 2px 8px var(--primary-glow)">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
        {{ t('cart.add') }}
      </button>
      <div v-else-if="qty > 0" class="flex items-center justify-between rounded-xl py-1 px-1" style="background: var(--primary-light)">
        <button @click.stop="decrement(product.id)" class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center btn-press">
          <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
        </button>
        <span class="text-xs font-black text-primary">{{ formatQty(qty, product.unit) }}</span>
        <button @click.stop="addToCart(product)" class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center btn-press">
          <svg width="14" height="14" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>
