<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import { useRouter } from '../router/index.js'


const props = defineProps({
  title: { type: String, default: '' },
  products: { type: Array, default: () => [] },
  onSeeAll: { type: Function, default: null },
  seeAllLabel: { type: String, default: '' },
})

const { addToCart, getQty, decrement } = useCartStore()
const { formatPrice, formatQty } = useFormat()
const { getLocalizedName, t } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()
const { isLoggedIn } = useAuth()
const { navigate } = useRouter()

async function handleFavorite(product) {
  if (!isLoggedIn.value) { navigate('login'); return }
  await toggleFavorite(product.id)
}
</script>

<template>
  <div v-if="products.length" class="mt-5">
    <div class="flex items-center justify-between px-4 mb-3">
      <h2 class="text-base font-black" style="color: var(--text-primary)">{{ title }}</h2>
      <button v-if="onSeeAll" @click="onSeeAll" class="text-xs font-bold text-primary btn-press">
        {{ seeAllLabel || t('home.see_all') }}
      </button>
    </div>

    <div class="scroll-x flex gap-3 px-4 pb-1">
      <div
        v-for="product in products"
        :key="product.id"
        class="flex-shrink-0 w-[155px] rounded-2xl overflow-hidden relative product-card"
        style="background: var(--surface); box-shadow: 0 4px 16px var(--shadow)"
      >
        <!-- Image area with gradient overlay -->
        <div class="relative" style="height: 120px;">
          <div class="absolute inset-0 flex items-center justify-center p-3" style="background: var(--img-bg);">
            <img v-if="product.image" :src="product.image" :alt="getLocalizedName(product.name)" class="w-full h-full object-contain" style="mix-blend-mode: var(--img-blend);" />
            <svg v-else width="40" height="40" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
              <path d="M21 15l-5-5L5 21" stroke-width="2"/>
            </svg>
          </div>

          <!-- Badge -->
          <span v-if="product.badge" :class="['absolute top-2 left-2 z-10 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg', product.badge === 'NEW' ? 'badge-new' : 'badge-hot']">
            {{ product.badge === 'NEW' ? t('badge.new') : t('badge.hot') }}
          </span>

          <!-- Favorite -->
          <button @click.stop="handleFavorite(product)" class="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center btn-press"
            :style="{ background: isFavorite(product.id) ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.2)' }">
            <svg width="12" height="12" :class="isFavorite(product.id) ? 'text-red-500' : 'text-white'"
              :fill="isFavorite(product.id) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
            </svg>
          </button>

          <!-- Discount -->
          <span v-if="product.discountedPrice && product.discountedPrice < product.price"
            class="absolute bottom-2 left-2 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg" style="background: linear-gradient(135deg, #ff6b35, #e84545)">
            -{{ Math.round((1 - product.discountedPrice / product.price) * 100) }}%
          </span>
        </div>

        <!-- Info -->
        <div class="p-3">
          <p class="text-xs font-bold leading-tight line-clamp-2 mb-1" style="color: var(--text-primary)">
            {{ getLocalizedName(product.name) }}
          </p>

          <!-- Price -->
          <div class="flex items-center gap-1.5 mb-2">
            <p v-if="product.discountedPrice && product.discountedPrice < product.price" class="text-sm font-black text-primary">
              {{ formatPrice(product.discountedPrice) }}
            </p>
            <p :class="['text-xs', product.discountedPrice ? 'line-through font-semibold' : 'font-bold']"
              :style="{ color: product.discountedPrice && product.discountedPrice < product.price ? 'var(--text-tertiary)' : 'var(--text-secondary)' }">
              {{ formatPrice(product.price) }}
            </p>
          </div>

          <!-- Add / Qty -->
          <button
            v-if="getQty(product.id) === 0"
            @click="addToCart(product)"
            class="w-full py-1.5 rounded-xl bg-primary flex items-center justify-center gap-1 btn-press text-white text-[10px] font-black"
            style="box-shadow: 0 3px 10px var(--primary-glow)"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            {{ t('cart.add') }}
          </button>
          <div v-else class="flex items-center justify-between">
            <button @click="decrement(product.id)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
              <svg width="12" height="12" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="text-xs font-black" style="color: var(--text-primary)">{{ formatQty(getQty(product.id), product.unit) }}</span>
            <button @click="addToCart(product)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
              <svg width="12" height="12" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
