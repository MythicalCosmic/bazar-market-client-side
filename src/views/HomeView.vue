<script setup>
import { onMounted } from 'vue'
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
const { addToCart, getQty } = useCartStore()

// Pastel colors for category sections
const sectionColors = [
  '#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#F3E5F5',
  '#E0F7FA', '#FFF8E1', '#F1F8E9', '#EDE7F6', '#E8EAF6',
]

function getColor(idx) {
  return sectionColors[idx % sectionColors.length]
}

onMounted(() => loadProducts())

function goToCategory(catId) {
  navigate('categories', { category: catId })
}

function goToSubcategory(parent, child) {
  navigate('categories', { category: parent.id, subcategory: child.id })
}

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
        <div class="skeleton h-[160px] rounded-2xl mb-4"></div>
        <div class="skeleton h-6 w-40 rounded-xl mb-3"></div>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="i in 6" :key="i" class="skeleton h-[100px] rounded-xl"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Banners ═══ -->
      <div v-if="banners.length" class="mt-3 px-4">
        <div class="flex gap-3 scroll-x snap-x snap-mandatory pb-1">
          <div v-for="banner in banners" :key="banner.id"
            @click="handleBannerClick(banner)"
            class="flex-shrink-0 w-full snap-center rounded-2xl overflow-hidden relative btn-press"
            :class="banner.linkType !== 'none' ? 'cursor-pointer' : ''"
            style="height: 160px;">
            <img v-if="banner.image" :src="banner.image" class="w-full h-full object-cover" />
            <div v-if="banner.title" class="absolute bottom-0 left-0 right-0 p-4" style="background: linear-gradient(transparent, rgba(0,0,0,0.6))">
              <p class="text-white text-sm font-black">{{ banner.title }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Category Sections (like Uzum Market) ═══ -->
      <div v-for="(cat, catIdx) in categories" :key="cat.id" class="mt-5 px-4">
        <!-- Section title -->
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-black" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</h2>
          <button @click="goToCategory(cat.id)" class="text-xs font-bold text-primary btn-press">{{ t('home.see_all') }}</button>
        </div>

        <!-- Subcategory cards -->
        <div v-if="cat.children && cat.children.length" class="rounded-2xl overflow-hidden p-2" :style="{ background: getColor(catIdx) }">
          <div class="grid gap-2" :class="cat.children.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'">
            <button v-for="sub in cat.children" :key="sub.id"
              @click="goToSubcategory(cat, sub)"
              class="rounded-xl p-2.5 flex flex-col text-left btn-press overflow-hidden bg-white/60"
              :style="{ minHeight: cat.children.length <= 2 ? '130px' : '110px' }">
              <p class="text-[11px] font-black leading-tight mb-1" style="color: var(--text-primary)">
                {{ getLocalizedName(sub.name) }}
              </p>
              <div class="flex-1 flex items-end justify-center">
                <img v-if="sub.image" :src="sub.image" :alt="getLocalizedName(sub.name)"
                  class="max-w-full max-h-[70px] object-contain" />
                <div v-else class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--surface-secondary)">
                  <svg width="20" height="20" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- No subcategories — single card -->
        <button v-else @click="goToCategory(cat.id)"
          class="w-full rounded-2xl p-4 flex items-center justify-between btn-press overflow-hidden"
          :style="{ background: getColor(catIdx) }">
          <div>
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</p>
            <p class="text-[10px] font-semibold mt-0.5" style="color: var(--text-secondary)">{{ t('home.see_all') }}</p>
          </div>
          <img v-if="cat.image" :src="cat.image" class="w-16 h-16 object-contain" />
          <svg v-else width="20" height="20" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- ═══ Hot Deals / Featured Products ═══ -->
      <div v-if="featuredProducts.length" class="mt-6 px-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-black" style="color: var(--text-primary)">{{ t('home.featured') }} 🔥</h2>
          <button @click="navigate('categories')" class="text-xs font-bold text-primary btn-press">{{ t('home.see_all') }}</button>
        </div>
        <div class="scroll-x flex gap-3 pb-1">
          <div v-for="product in featuredProducts" :key="product.id"
            @click="navigate('product', { productId: product.id })"
            class="flex-shrink-0 w-[150px] rounded-2xl overflow-hidden btn-press"
            style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
            <div class="w-full flex items-center justify-center p-3" style="height: 120px; background: var(--img-bg);">
              <img v-if="product.image" :src="product.image" class="max-w-full max-h-full object-contain" style="mix-blend-mode: multiply;" />
            </div>
            <div class="p-2.5">
              <p class="text-[11px] font-bold leading-tight line-clamp-2 mb-1" style="color: var(--text-primary)">{{ getLocalizedName(product.name) }}</p>
              <div class="flex items-center gap-1">
                <p v-if="product.discountedPrice" class="text-xs font-black text-primary">{{ formatPrice(product.discountedPrice) }}</p>
                <p :class="['text-[10px]', product.discountedPrice ? 'line-through' : 'font-bold']"
                  :style="{ color: product.discountedPrice ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
                  {{ formatPrice(product.price) }}
                </p>
              </div>
              <button @click.stop="addToCart(product)"
                class="w-full mt-2 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black flex items-center justify-center gap-1 btn-press">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
                {{ t('cart.add') }}
              </button>
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
