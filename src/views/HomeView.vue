<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useCartStore } from '../stores/cartStore.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import { featuredProducts, banners, categories, categoryProducts, loadProducts, isLoading } from '../stores/productsStore.js'

const { navigate } = useRouter()
const { t, getLocalizedName } = useI18n()
const { formatPrice, formatQty } = useFormat()
const { addToCart, getQty, decrement } = useCartStore()
const { isFavorite, toggleFavorite } = useFavorites()
const { isLoggedIn } = useAuth()

const sectionEmojis = ['🥤', '🥛', '🍞', '🍖', '🍬', '🍎', '🧴', '🥚', '🧀', '🍕']
const sectionGradients = [
  'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
  'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
  'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
  'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)',
  'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
  'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)',
  'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
  'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)',
]

onMounted(() => loadProducts())

function goToCategory(catId) { navigate('categories', { category: catId }) }

function handleBannerClick(banner) {
  if (banner.linkType === 'category') navigate('categories', { category: parseInt(banner.linkValue) })
  else if (banner.linkType === 'product') navigate('product', { productId: parseInt(banner.linkValue) })
}

function handleFav(product) {
  if (!isLoggedIn.value) { navigate('login'); return }
  toggleFavorite(product.id)
}
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="px-4 mt-3">
        <div class="skeleton h-[150px] rounded-2xl mb-4"></div>
        <div class="flex gap-3 mb-4"><div v-for="i in 4" :key="i" class="skeleton w-16 h-20 rounded-2xl flex-shrink-0"></div></div>
        <div class="skeleton h-6 w-40 rounded-xl mb-3"></div>
        <div class="flex gap-3"><div v-for="i in 3" :key="i" class="skeleton w-[155px] h-[230px] rounded-2xl flex-shrink-0"></div></div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Banner ═══ -->
      <div v-if="banners.length" class="mt-3 px-4">
        <div class="flex gap-3 scroll-x snap-x snap-mandatory">
          <div v-for="banner in banners" :key="banner.id"
            @click="handleBannerClick(banner)"
            class="flex-shrink-0 snap-center rounded-2xl overflow-hidden relative btn-press"
            :class="banner.linkType !== 'none' ? 'cursor-pointer' : ''"
            :style="{ width: banners.length > 1 ? 'calc(100% - 20px)' : '100%', height: '150px' }">
            <img v-if="banner.image" :src="banner.image" class="w-full h-full object-cover" />
            <div class="absolute inset-0" style="background: linear-gradient(transparent 30%, rgba(0,0,0,0.65))"></div>
            <p v-if="banner.title" class="absolute bottom-3 left-4 right-4 text-white text-sm font-black leading-tight">{{ banner.title }}</p>
          </div>
        </div>
      </div>

      <!-- ═══ Quick Categories ═══ -->
      <div v-if="categories.length" class="mt-4 px-4">
        <div class="scroll-x flex gap-3 pb-1">
          <button v-for="(cat, i) in categories" :key="cat.id" @click="goToCategory(cat.id)"
            class="flex-shrink-0 flex flex-col items-center gap-1.5 btn-press">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style="background: var(--primary-light)">
              {{ sectionEmojis[i % sectionEmojis.length] }}
            </div>
            <span class="text-[10px] font-bold whitespace-nowrap max-w-[56px] truncate" style="color: var(--text-secondary)">{{ getLocalizedName(cat.name) }}</span>
          </button>
        </div>
      </div>

      <!-- ═══ Featured 🔥 ═══ -->
      <div v-if="featuredProducts.length" class="mt-5">
        <div class="flex items-center justify-between px-4 mb-3">
          <h2 class="text-lg font-black" style="color: var(--text-primary)">{{ t('home.featured') }} 🔥</h2>
          <button @click="navigate('categories')" class="text-xs font-bold text-primary btn-press">{{ t('home.see_all') }} →</button>
        </div>
        <div class="scroll-x flex gap-3 px-4 pb-1">
          <div v-for="product in featuredProducts" :key="product.id"
            @click="navigate('product', { productId: product.id })"
            class="flex-shrink-0 w-[155px] rounded-2xl overflow-hidden btn-press"
            style="background: var(--surface); box-shadow: 0 2px 16px var(--shadow)">
            <div class="relative w-full flex items-center justify-center p-3" style="height: 130px; background: var(--img-bg);">
              <img v-if="product.image" :src="product.image" class="max-w-full max-h-full object-contain" style="mix-blend-mode: multiply;" />
              <span v-if="product.discountedPrice && product.discountedPrice < product.price"
                class="absolute top-2 left-2 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg" style="background: linear-gradient(135deg, #ff6b35, #e84545)">
                -{{ Math.round((1 - product.discountedPrice / product.price) * 100) }}%
              </span>
            </div>
            <div class="p-3">
              <p class="text-[11px] font-bold leading-tight line-clamp-2 mb-1.5" style="color: var(--text-primary)">{{ getLocalizedName(product.name) }}</p>
              <div class="flex items-center gap-1 mb-2">
                <p v-if="product.discountedPrice && product.discountedPrice < product.price" class="text-sm font-black text-primary">{{ formatPrice(product.discountedPrice) }}</p>
                <p :class="['text-[10px]', (product.discountedPrice && product.discountedPrice < product.price) ? 'line-through' : 'font-bold text-sm']"
                  :style="{ color: (product.discountedPrice && product.discountedPrice < product.price) ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
                  {{ formatPrice(product.price) }}
                </p>
              </div>
              <button v-if="getQty(product.id) === 0" @click.stop="addToCart(product)"
                class="w-full py-1.5 rounded-xl bg-primary text-white text-[10px] font-black flex items-center justify-center gap-1 btn-press"
                style="box-shadow: 0 3px 10px var(--primary-glow)">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                {{ t('cart.add') }}
              </button>
              <div v-else class="flex items-center justify-between" @click.stop>
                <button @click="decrement(product.id)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
                  <svg width="12" height="12" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                </button>
                <span class="text-xs font-black" style="color: var(--text-primary)">{{ formatQty(getQty(product.id), product.unit) }}</span>
                <button @click="addToCart(product)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
                  <svg width="12" height="12" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Category Product Sections ═══ -->
      <div v-for="(cat, catIdx) in categories" :key="'section-' + cat.id" class="mt-6">
        <template v-if="categoryProducts[cat.id]?.length">
          <!-- Section header with gradient accent -->
          <div class="px-4 mb-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ sectionEmojis[catIdx % sectionEmojis.length] }}</span>
                <h2 class="text-lg font-black" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</h2>
              </div>
              <button @click="goToCategory(cat.id)" class="text-xs font-bold text-primary btn-press flex items-center gap-1">
                {{ t('home.see_all') }}
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <!-- Gradient accent line -->
            <div class="h-0.5 mt-2 rounded-full" :style="{ background: sectionGradients[catIdx % sectionGradients.length] }"></div>
          </div>

          <!-- Horizontal product scroll -->
          <div class="scroll-x flex gap-3 px-4 pb-2">
            <div v-for="product in categoryProducts[cat.id]" :key="product.id"
              @click="navigate('product', { productId: product.id })"
              class="flex-shrink-0 w-[155px] rounded-2xl overflow-hidden btn-press"
              style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
              <!-- Image -->
              <div class="relative w-full flex items-center justify-center p-2" style="height: 120px; background: var(--img-bg);">
                <img v-if="product.image" :src="product.image" class="max-w-full max-h-full object-contain" style="mix-blend-mode: multiply;" />
                <svg v-else width="28" height="28" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>
                <!-- Discount -->
                <span v-if="product.discountedPrice && product.discountedPrice < product.price"
                  class="absolute top-1.5 left-1.5 text-white text-[8px] font-black px-1 py-0.5 rounded-md" style="background: linear-gradient(135deg, #ff6b35, #e84545)">
                  -{{ Math.round((1 - product.discountedPrice / product.price) * 100) }}%
                </span>
                <!-- Favorite -->
                <button @click.stop="handleFav(product)" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center btn-press"
                  :style="{ background: isFavorite(product.id) ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.8)' }">
                  <svg width="12" height="12" :class="isFavorite(product.id) ? 'text-red-500' : ''" :style="!isFavorite(product.id) ? 'color: var(--text-tertiary)' : ''"
                    :fill="isFavorite(product.id) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
                  </svg>
                </button>
              </div>
              <!-- Info -->
              <div class="p-2.5">
                <p class="text-[11px] font-bold leading-tight line-clamp-2 mb-1" style="color: var(--text-primary)">{{ getLocalizedName(product.name) }}</p>
                <div class="flex items-center gap-1 mb-1.5">
                  <p v-if="product.discountedPrice && product.discountedPrice < product.price" class="text-xs font-black text-primary">{{ formatPrice(product.discountedPrice) }}</p>
                  <p :class="['text-[10px]', (product.discountedPrice && product.discountedPrice < product.price) ? 'line-through' : 'font-bold']"
                    :style="{ color: (product.discountedPrice && product.discountedPrice < product.price) ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
                    {{ formatPrice(product.price) }}
                  </p>
                </div>
                <button v-if="getQty(product.id) === 0" @click.stop="addToCart(product)"
                  class="w-full py-1.5 rounded-lg bg-primary text-white text-[10px] font-black flex items-center justify-center gap-1 btn-press">
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="3" stroke-linecap="round"/></svg>
                  {{ t('cart.add') }}
                </button>
                <div v-else class="flex items-center justify-between" @click.stop>
                  <button @click="decrement(product.id)" class="w-6 h-6 rounded-full bg-primary flex items-center justify-center btn-press">
                    <svg width="10" height="10" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="3" stroke-linecap="round"/></svg>
                  </button>
                  <span class="text-[11px] font-black" style="color: var(--text-primary)">{{ formatQty(getQty(product.id), product.unit) }}</span>
                  <button @click="addToCart(product)" class="w-6 h-6 rounded-full bg-primary flex items-center justify-center btn-press">
                    <svg width="10" height="10" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="3" stroke-linecap="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
