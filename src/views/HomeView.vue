<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
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

const categoryAccents = [
  { bg: '#ECFDF5', color: '#059669', glow: 'rgba(5,150,105,0.1)' },
  { bg: '#EFF6FF', color: '#2563EB', glow: 'rgba(37,99,235,0.1)' },
  { bg: '#FFF7ED', color: '#EA580C', glow: 'rgba(234,88,12,0.1)' },
  { bg: '#FDF2F8', color: '#DB2777', glow: 'rgba(219,39,119,0.1)' },
  { bg: '#F5F3FF', color: '#7C3AED', glow: 'rgba(124,58,237,0.1)' },
  { bg: '#ECFEFF', color: '#0891B2', glow: 'rgba(8,145,178,0.1)' },
  { bg: '#FFFBEB', color: '#D97706', glow: 'rgba(217,119,6,0.1)' },
  { bg: '#FEF2F2', color: '#DC2626', glow: 'rgba(220,38,38,0.1)' },
]

onMounted(() => { loadProducts().then(() => startBannerAuto()) })

function goToCategory(catId) { navigate('categories', { category: catId }) }

function handleBannerClick(banner) {
  if (banner.linkType === 'category') navigate('categories', { category: parseInt(banner.linkValue) })
  else if (banner.linkType === 'product') navigate('product', { productId: parseInt(banner.linkValue) })
}

function handleFav(product) {
  if (!isLoggedIn.value) { navigate('login'); return }
  toggleFavorite(product.id)
}

function getAccent(idx) { return categoryAccents[idx % categoryAccents.length] }

// ── Banner auto-slide ──
const bannerRef = ref(null)
const bannerIndex = ref(0)
let bannerTimer = null

function bannerScrollTo(idx) {
  bannerIndex.value = idx
  const el = bannerRef.value
  if (!el || !el.children[idx]) return
  el.scrollTo({ left: el.children[idx].offsetLeft - 16, behavior: 'smooth' })
}

function startBannerAuto() {
  if (bannerTimer) clearInterval(bannerTimer)
  if (banners.value.length <= 1) return
  bannerTimer = setInterval(() => {
    bannerScrollTo((bannerIndex.value + 1) % banners.value.length)
  }, 4000)
}

function onBannerScroll() {
  const el = bannerRef.value
  if (!el || !el.children[0]) return
  const w = el.children[0].offsetWidth || 1
  bannerIndex.value = Math.round(el.scrollLeft / (w + 12))
}

onUnmounted(() => { if (bannerTimer) clearInterval(bannerTimer) })
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <div class="px-4 mt-4">
        <div class="skeleton h-[160px] rounded-2xl mb-5"></div>
        <div class="flex gap-3 mb-5"><div v-for="i in 5" :key="i" class="skeleton w-[60px] h-[76px] rounded-2xl flex-shrink-0"></div></div>
        <div class="skeleton h-6 w-36 rounded-xl mb-3"></div>
        <div class="flex gap-3"><div v-for="i in 3" :key="i" class="skeleton w-[160px] h-[240px] rounded-[18px] flex-shrink-0"></div></div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Banners ═══ -->
      <div v-if="banners.length" class="mt-4 px-4">
        <div ref="bannerRef" class="flex gap-3 scroll-x snap-x snap-mandatory pb-1"
          @scroll="onBannerScroll"
          @touchstart="bannerTimer && clearInterval(bannerTimer)"
          @touchend="startBannerAuto()">
          <div v-for="banner in banners" :key="banner.id"
            @click="handleBannerClick(banner)"
            class="flex-shrink-0 snap-center overflow-hidden relative btn-press banner-card"
            :class="banner.linkType !== 'none' ? 'cursor-pointer' : ''"
            :style="{ width: banners.length > 1 ? 'calc(100% - 28px)' : '100%' }">
            <!-- Fallback gradient when no image -->
            <div v-if="!banner.image" class="absolute inset-0 banner-gradient">
              <div class="absolute top-0 right-0 w-36 h-36 rounded-full" style="background: rgba(255,255,255,0.06); filter: blur(30px); transform: translate(20%, -30%);"></div>
              <div class="absolute bottom-0 left-1/3 w-28 h-28 rounded-full" style="background: rgba(255,255,255,0.04); filter: blur(24px); transform: translateY(40%);"></div>
            </div>
            <img v-if="banner.image" :src="banner.image" class="absolute inset-0 w-full h-full object-cover" />
            <div class="absolute inset-0 banner-overlay"></div>
            <!-- Content -->
            <div class="relative z-10 p-5 flex flex-col justify-end h-full">
              <p v-if="banner.title" class="text-white text-[17px] font-bold leading-snug max-w-[220px]">{{ banner.title }}</p>
            </div>
          </div>
        </div>
        <!-- Dots -->
        <div v-if="banners.length > 1" class="flex items-center justify-center gap-1.5 mt-3">
          <button v-for="(_, i) in banners" :key="i" @click="bannerScrollTo(i); startBannerAuto()"
            class="banner-dot" :class="bannerIndex === i ? 'banner-dot-active' : 'banner-dot-idle'" />
        </div>
      </div>

      <!-- ═══ Quick Categories ═══ -->
      <div v-if="categories.length" class="mt-5">
        <div class="scroll-x flex gap-2.5 px-4 pb-2">
          <button v-for="(cat, i) in categories" :key="cat.id" @click="goToCategory(cat.id)"
            class="flex-shrink-0 btn-press cat-chip"
            :style="{ background: getAccent(i).bg }">
            <!-- Category image or icon -->
            <div class="cat-chip-icon" :style="{ background: getAccent(i).color + '14' }">
              <img v-if="cat.image" :src="cat.image" class="w-8 h-8 object-contain" />
              <svg v-else width="20" height="20" :style="{ color: getAccent(i).color }" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/>
                <rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>
              </svg>
            </div>
            <!-- Name -->
            <span class="text-[12px] font-semibold whitespace-nowrap pr-1" :style="{ color: getAccent(i).color }">
              {{ getLocalizedName(cat.name) }}
            </span>
          </button>
        </div>
      </div>

      <!-- ═══ Featured ═══ -->
      <div v-if="featuredProducts.length" class="mt-6">
        <div class="flex items-center justify-between px-4 mb-3">
          <h2 class="text-lg font-bold" style="color: var(--text-primary)">{{ t('home.featured') }}</h2>
          <button @click="navigate('categories')" class="text-xs font-semibold text-primary btn-press flex items-center gap-0.5">
            {{ t('home.see_all') }}
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="scroll-x flex gap-3 px-4 pb-2">
          <div v-for="product in featuredProducts" :key="product.id"
            @click="navigate('product', { productId: product.id })"
            class="flex-shrink-0 w-[160px] overflow-hidden btn-press featured-card">
            <!-- Image -->
            <div class="relative w-full flex items-center justify-center p-3" style="height: 130px; background: var(--img-bg);">
              <img v-if="product.image" :src="product.image" class="max-w-full max-h-full object-contain" style="mix-blend-mode: multiply;" />
              <span v-if="product.discountedPrice && product.discountedPrice < product.price"
                class="absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg"
                style="background: linear-gradient(135deg, #F97316, #EA580C)">
                -{{ Math.round((1 - product.discountedPrice / product.price) * 100) }}%
              </span>
            </div>
            <!-- Info -->
            <div class="p-3">
              <p class="text-[11px] font-medium leading-tight line-clamp-2 mb-1.5" style="color: var(--text-secondary)">{{ getLocalizedName(product.name) }}</p>
              <div class="flex items-center gap-1 mb-2.5">
                <p v-if="product.discountedPrice && product.discountedPrice < product.price" class="text-sm font-bold text-primary">{{ formatPrice(product.discountedPrice) }}</p>
                <p :class="['text-[10px]', (product.discountedPrice && product.discountedPrice < product.price) ? 'line-through' : 'font-bold text-sm']"
                  :style="{ color: (product.discountedPrice && product.discountedPrice < product.price) ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
                  {{ formatPrice(product.price) }}
                </p>
              </div>
              <button v-if="getQty(product.id) === 0" @click.stop="addToCart(product)"
                class="w-full py-2 rounded-xl bg-primary text-white text-[10px] font-semibold flex items-center justify-center gap-1 btn-press"
                style="box-shadow: 0 2px 8px var(--primary-glow)">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                {{ t('cart.add') }}
              </button>
              <div v-else class="flex items-center justify-between rounded-xl py-0.5 px-0.5" style="background: var(--primary-light)" @click.stop>
                <button @click="decrement(product.id)" class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center btn-press">
                  <svg width="11" height="11" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                </button>
                <span class="text-[11px] font-bold text-primary">{{ formatQty(getQty(product.id), product.unit) }}</span>
                <button @click="addToCart(product)" class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center btn-press">
                  <svg width="11" height="11" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Category Sections ═══ -->
      <div v-for="(cat, catIdx) in categories" :key="'section-' + cat.id" class="mt-7">
        <template v-if="categoryProducts[cat.id]?.length">
          <!-- Section header -->
          <div class="px-4 mb-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center"
                  :style="{ background: getAccent(catIdx).bg }">
                  <img v-if="cat.image" :src="cat.image" class="w-5 h-5 object-contain" />
                  <svg v-else width="16" height="16" :style="{ color: getAccent(catIdx).color }" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>
                  </svg>
                </div>
                <h2 class="text-base font-bold" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</h2>
              </div>
              <button @click="goToCategory(cat.id)" class="text-xs font-semibold text-primary btn-press flex items-center gap-0.5">
                {{ t('home.see_all') }}
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>

          <!-- Horizontal product scroll -->
          <div class="scroll-x flex gap-3 px-4 pb-2">
            <div v-for="product in categoryProducts[cat.id]" :key="product.id"
              @click="navigate('product', { productId: product.id })"
              class="flex-shrink-0 w-[160px] overflow-hidden btn-press featured-card">
              <!-- Image -->
              <div class="relative w-full flex items-center justify-center p-2.5" style="height: 120px; background: var(--img-bg);">
                <img v-if="product.image" :src="product.image" class="max-w-full max-h-full object-contain" style="mix-blend-mode: multiply;" />
                <svg v-else width="24" height="24" style="color: var(--text-tertiary); opacity: 0.3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>
                <!-- Discount -->
                <span v-if="product.discountedPrice && product.discountedPrice < product.price"
                  class="absolute top-2 left-2 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md" style="background: linear-gradient(135deg, #F97316, #EA580C)">
                  -{{ Math.round((1 - product.discountedPrice / product.price) * 100) }}%
                </span>
                <!-- Favorite -->
                <button @click.stop="handleFav(product)" class="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center btn-press"
                  :style="{ background: isFavorite(product.id) ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }">
                  <svg width="12" height="12" :class="isFavorite(product.id) ? 'text-red-500' : ''" :style="!isFavorite(product.id) ? 'color: var(--text-tertiary)' : ''"
                    :fill="isFavorite(product.id) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
                  </svg>
                </button>
              </div>
              <!-- Info -->
              <div class="p-2.5">
                <p class="text-[11px] font-medium leading-tight line-clamp-2 mb-1" style="color: var(--text-secondary)">{{ getLocalizedName(product.name) }}</p>
                <div class="flex items-center gap-1 mb-2">
                  <p v-if="product.discountedPrice && product.discountedPrice < product.price" class="text-xs font-bold text-primary">{{ formatPrice(product.discountedPrice) }}</p>
                  <p :class="['text-[10px]', (product.discountedPrice && product.discountedPrice < product.price) ? 'line-through' : 'font-bold']"
                    :style="{ color: (product.discountedPrice && product.discountedPrice < product.price) ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
                    {{ formatPrice(product.price) }}
                  </p>
                </div>
                <button v-if="getQty(product.id) === 0" @click.stop="addToCart(product)"
                  class="w-full py-1.5 rounded-lg bg-primary text-white text-[10px] font-semibold flex items-center justify-center gap-1 btn-press"
                  style="box-shadow: 0 2px 6px var(--primary-glow)">
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="3" stroke-linecap="round"/></svg>
                  {{ t('cart.add') }}
                </button>
                <div v-else class="flex items-center justify-between rounded-lg py-0.5 px-0.5" style="background: var(--primary-light)" @click.stop>
                  <button @click="decrement(product.id)" class="w-6 h-6 rounded-md bg-primary flex items-center justify-center btn-press">
                    <svg width="10" height="10" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="3" stroke-linecap="round"/></svg>
                  </button>
                  <span class="text-[10px] font-bold text-primary">{{ formatQty(getQty(product.id), product.unit) }}</span>
                  <button @click="addToCart(product)" class="w-6 h-6 rounded-md bg-primary flex items-center justify-center btn-press">
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

<style scoped>
.banner-card {
  border-radius: 20px;
  min-height: 156px;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.08);
}
.banner-gradient {
  background: linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%);
}
.banner-overlay {
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.15) 40%,
    rgba(0, 0, 0, 0.03) 65%,
    transparent 100%
  );
}
.banner-dot {
  border-radius: 50%;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.banner-dot-active {
  width: 20px;
  height: 6px;
  border-radius: 3px;
  background: var(--primary);
}
.banner-dot-idle {
  width: 6px;
  height: 6px;
  background: var(--surface-tertiary);
}

.cat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  border-radius: 16px;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04);
}
.cat-chip:active {
  transform: scale(0.94);
}
.cat-chip-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.featured-card {
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 4px 12px var(--shadow);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.featured-card:active {
  transform: scale(0.97);
}
</style>
