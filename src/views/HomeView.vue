<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useCartStore } from '../stores/cartStore.js'
import AppHeader from '../components/AppHeader.vue'
import ProductCard from '../components/ProductCard.vue'
import { products, featuredProducts, banners, categories, loadProducts, isLoading } from '../stores/productsStore.js'

const { navigate } = useRouter()
const { t, getLocalizedName } = useI18n()
const { formatPrice } = useFormat()
const { addToCart, getQty, decrement } = useCartStore()

const sectionStyles = [
  { bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🥤' },
  { bg: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🥛' },
  { bg: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🍞' },
  { bg: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🍖' },
  { bg: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🍬' },
  { bg: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🍎' },
  { bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🧴' },
  { bg: 'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)', cardBg: 'rgba(255,255,255,0.7)', emoji: '🧹' },
]

function getStyle(idx) { return sectionStyles[idx % sectionStyles.length] }

// Quick-access category icons for the horizontal row
const quickCategories = computed(() => {
  const emojis = ['🥤', '🥛', '🍞', '🍖', '🍬', '🍎', '🧴', '🥚', '🧀', '🍕']
  return categories.value.map((cat, i) => ({ ...cat, emoji: emojis[i % emojis.length] }))
})

onMounted(() => loadProducts())

function goToCategory(catId) { navigate('categories', { category: catId }) }

function goToSubcategory(parent, child) { navigate('categories', { category: parent.id, subcategory: child.id }) }

function handleBannerClick(banner) {
  if (banner.linkType === 'category') navigate('categories', { category: parseInt(banner.linkValue) })
  else if (banner.linkType === 'product') navigate('product', { productId: parseInt(banner.linkValue) })
}
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="px-4 mt-3">
        <div class="skeleton h-[150px] rounded-2xl mb-4"></div>
        <div class="flex gap-3 mb-4"><div v-for="i in 5" :key="i" class="skeleton w-16 h-20 rounded-2xl flex-shrink-0"></div></div>
        <div class="skeleton h-6 w-40 rounded-xl mb-3"></div>
        <div class="grid grid-cols-2 gap-3"><div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div></div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Banner ═══ -->
      <div v-if="banners.length" class="mt-3 px-4">
        <div v-if="banners.length === 1"
          @click="handleBannerClick(banners[0])"
          class="rounded-2xl overflow-hidden relative btn-press" :class="banners[0].linkType !== 'none' ? 'cursor-pointer' : ''" style="height: 150px;">
          <img v-if="banners[0].image" :src="banners[0].image" class="w-full h-full object-cover" />
          <div class="absolute inset-0" style="background: linear-gradient(transparent 40%, rgba(0,0,0,0.6))"></div>
          <p v-if="banners[0].title" class="absolute bottom-3 left-4 right-4 text-white text-sm font-black">{{ banners[0].title }}</p>
        </div>
        <div v-else class="flex gap-3 scroll-x snap-x snap-mandatory">
          <div v-for="banner in banners" :key="banner.id"
            @click="handleBannerClick(banner)"
            class="flex-shrink-0 snap-center rounded-2xl overflow-hidden relative btn-press"
            :class="banner.linkType !== 'none' ? 'cursor-pointer' : ''"
            :style="{ width: banners.length > 1 ? 'calc(100% - 20px)' : '100%', height: '150px' }">
            <img v-if="banner.image" :src="banner.image" class="w-full h-full object-cover" />
            <div class="absolute inset-0" style="background: linear-gradient(transparent 40%, rgba(0,0,0,0.6))"></div>
            <p v-if="banner.title" class="absolute bottom-3 left-4 right-4 text-white text-sm font-black">{{ banner.title }}</p>
          </div>
        </div>
      </div>

      <!-- ═══ Quick Category Row ═══ -->
      <div v-if="quickCategories.length" class="mt-4 px-4">
        <div class="scroll-x flex gap-3 pb-1">
          <button v-for="cat in quickCategories" :key="cat.id" @click="goToCategory(cat.id)"
            class="flex-shrink-0 flex flex-col items-center gap-1.5 btn-press">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform"
              style="background: var(--primary-light)">
              {{ cat.emoji }}
            </div>
            <span class="text-[10px] font-bold whitespace-nowrap max-w-[56px] truncate" style="color: var(--text-secondary)">
              {{ getLocalizedName(cat.name) }}
            </span>
          </button>
        </div>
      </div>

      <!-- ═══ Category Sections ═══ -->
      <div v-for="(cat, catIdx) in categories" :key="cat.id" class="mt-5 px-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-black" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</h2>
          <button @click="goToCategory(cat.id)" class="text-xs font-bold text-primary btn-press">{{ t('home.see_all') }} →</button>
        </div>

        <div v-if="cat.children && cat.children.length"
          class="rounded-2xl overflow-hidden p-2.5"
          :style="{ background: getStyle(catIdx).bg }">
          <div class="grid gap-2" :class="cat.children.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'">
            <button v-for="(sub, subIdx) in cat.children" :key="sub.id"
              @click="goToSubcategory(cat, sub)"
              class="rounded-xl p-3 flex flex-col text-left btn-press overflow-hidden relative"
              :style="{
                background: getStyle(catIdx).cardBg,
                backdropFilter: 'blur(10px)',
                minHeight: cat.children.length <= 2 ? '120px' : '100px',
              }">
              <p class="text-[11px] font-black leading-tight relative z-10" style="color: var(--text-primary)">
                {{ getLocalizedName(sub.name) }}
              </p>
              <div class="flex-1 flex items-end justify-end mt-1">
                <img v-if="sub.image" :src="sub.image" :alt="getLocalizedName(sub.name)"
                  class="max-w-[80%] max-h-[65px] object-contain" />
                <span v-else class="text-3xl opacity-30">{{ getStyle(catIdx).emoji }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- No subs -->
        <button v-else @click="goToCategory(cat.id)"
          class="w-full rounded-2xl p-5 flex items-center justify-between btn-press"
          :style="{ background: getStyle(catIdx).bg }">
          <div>
            <p class="text-base font-black" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</p>
            <p class="text-xs font-semibold mt-0.5" style="color: var(--text-secondary)">{{ t('home.see_all') }}</p>
          </div>
          <span class="text-4xl">{{ getStyle(catIdx).emoji }}</span>
        </button>
      </div>

      <!-- ═══ Featured / Hot Deals ═══ -->
      <div v-if="featuredProducts.length" class="mt-6 px-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-black" style="color: var(--text-primary)">{{ t('home.featured') }} 🔥</h2>
          <button @click="navigate('categories')" class="text-xs font-bold text-primary btn-press">{{ t('home.see_all') }} →</button>
        </div>
        <div class="scroll-x flex gap-3 pb-1">
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
              <!-- Add/qty -->
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
                <span class="text-xs font-black" style="color: var(--text-primary)">{{ getQty(product.id) }}</span>
                <button @click="addToCart(product)" class="w-7 h-7 rounded-full bg-primary flex items-center justify-center btn-press">
                  <svg width="12" height="12" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ All Products ═══ -->
      <div v-if="products.length" class="mt-6">
        <div class="flex items-center justify-between px-4 mb-3">
          <h2 class="text-lg font-black" style="color: var(--text-primary)">{{ t('home.for_you') }}</h2>
        </div>
        <div class="px-4 grid grid-cols-2 gap-3">
          <ProductCard v-for="p in products" :key="p.id" :product="p" />
        </div>
      </div>
    </template>
  </div>
</template>
