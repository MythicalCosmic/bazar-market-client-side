<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useCartStore } from '../stores/cartStore.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import { getProduct, submitReview } from '../services/api.js'

const { navigate, routeParams } = useRouter()
const { t, getLocalizedName } = useI18n()
const { formatPrice, formatQty } = useFormat()
const { addToCart, decrement, getQty } = useCartStore()
const { isFavorite, toggleFavorite } = useFavorites()
const { isLoggedIn } = useAuth()

const product = ref(null)
const isLoading = ref(true)
const activeImage = ref(0)
const showReviewForm = ref(false)
const reviewRating = ref(5)
const reviewComment = ref('')
const reviewSubmitting = ref(false)
const reviewSuccess = ref(false)
const reviewError = ref('')

onMounted(async () => {
  const id = routeParams.value?.productId
  if (!id) { navigate('home'); return }
  try {
    product.value = await getProduct(id)
  } catch { navigate('home') }
  isLoading.value = false
})

const qty = computed(() => product.value ? getQty(product.value.id) : 0)
const fav = computed(() => product.value ? isFavorite(product.value.id) : false)
const desc = computed(() => product.value ? getLocalizedName(product.value.description) : '')
const hasDiscount = computed(() => product.value?.discountedPrice && product.value.discountedPrice < product.value.price)
const allImages = computed(() => {
  if (!product.value) return []
  if (product.value.images?.length) return product.value.images.map(img => img.image || img)
  if (product.value.image) return [product.value.image]
  return []
})
const stockPercent = computed(() => {
  if (!product.value?.stockQty) return 100
  return Math.min(100, Math.max(0, (product.value.stockQty / 100) * 100))
})

async function handleFavorite() {
  if (!isLoggedIn.value) { navigate('login'); return }
  await toggleFavorite(product.value.id)
}

async function handleSubmitReview() {
  if (!isLoggedIn.value) { navigate('login'); return }
  reviewError.value = ''
  reviewSubmitting.value = true
  try {
    await submitReview({ rating: reviewRating.value, comment: reviewComment.value })
    reviewSuccess.value = true
    showReviewForm.value = false
  } catch (e) {
    reviewError.value = e.message || 'Error'
  }
  reviewSubmitting.value = false
}
</script>

<template>
  <div class="min-h-screen pb-32" style="background: var(--bg-app)">
    <!-- Loading -->
    <div v-if="isLoading" class="pt-4 px-4">
      <div class="skeleton h-[300px] rounded-2xl mb-4"></div>
      <div class="skeleton h-6 w-48 rounded-xl mb-2"></div>
      <div class="skeleton h-4 w-32 rounded-xl"></div>
    </div>

    <template v-else-if="product">
      <!-- Image gallery -->
      <div class="relative" style="background: var(--surface)">
        <!-- Back button -->
        <button @click="navigate('home')" class="absolute top-3 left-3 z-20 w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface); box-shadow: 0 2px 8px var(--shadow)">
          <svg width="20" height="20" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>

        <!-- Favorite -->
        <button @click="handleFavorite" class="absolute top-3 right-3 z-20 w-9 h-9 rounded-xl flex items-center justify-center btn-press"
          :style="{ background: fav ? 'rgba(239,68,68,0.15)' : 'var(--surface)', boxShadow: '0 2px 8px var(--shadow)' }">
          <svg width="20" height="20" :class="fav ? 'text-red-500' : ''" :style="!fav ? 'color: var(--text-tertiary)' : ''"
            :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
          </svg>
        </button>

        <!-- Main image -->
        <div class="w-full flex items-center justify-center p-8" style="height: 300px;">
          <img v-if="allImages.length" :src="allImages[activeImage]" :alt="getLocalizedName(product.name)" class="max-w-full max-h-full object-contain" />
          <div v-else class="w-32 h-32 rounded-2xl flex items-center justify-center" style="background: var(--surface-secondary)">
            <svg width="48" height="48" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/><path d="M21 15l-5-5L5 21" stroke-width="2"/></svg>
          </div>
        </div>

        <!-- Image dots -->
        <div v-if="allImages.length > 1" class="flex items-center justify-center gap-1.5 pb-3">
          <button v-for="(_, i) in allImages" :key="i" @click="activeImage = i"
            :class="['rounded-full transition-all duration-300', activeImage === i ? 'w-6 h-2 bg-primary' : 'w-2 h-2']"
            :style="activeImage !== i ? 'background: var(--text-tertiary)' : ''" />
        </div>

        <!-- Discount badge -->
        <span v-if="hasDiscount" class="absolute top-3 left-14 z-10 text-white text-xs font-black px-2 py-1 rounded-xl" style="background: linear-gradient(135deg, #ff6b35, #e84545)">
          -{{ Math.round((1 - product.discountedPrice / product.price) * 100) }}%
        </span>
      </div>

      <!-- Product info -->
      <div class="px-4 -mt-3 relative z-10">
        <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 16px var(--shadow)">
          <!-- Category -->
          <p class="text-[10px] font-bold text-primary mb-1">{{ product.categoryName }}</p>

          <!-- Name -->
          <h1 class="text-lg font-black mb-2" style="color: var(--text-primary)">{{ getLocalizedName(product.name) }}</h1>

          <!-- Price -->
          <div class="flex items-center gap-2 mb-3">
            <p v-if="hasDiscount" class="text-xl font-black text-primary">{{ formatPrice(product.discountedPrice) }}</p>
            <p :class="['font-bold', hasDiscount ? 'text-sm line-through' : 'text-xl']"
              :style="{ color: hasDiscount ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
              {{ formatPrice(product.price) }}
            </p>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-lg" style="background: var(--surface-secondary); color: var(--text-secondary)">
              / {{ product.unit === 'kg' ? 'kg' : product.unit === 'liter' ? 'l' : t('product.piece') }}
            </span>
          </div>

          <!-- Stock bar -->
          <div v-if="product.stockQty !== null" class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-bold" :style="{ color: product.stockQty <= 10 ? '#ef4444' : 'var(--text-tertiary)' }">
                {{ product.stockQty <= 10 ? t('product.left_in_stock', { count: Math.round(product.stockQty) }) : t('product.in_stock') }}
              </span>
            </div>
            <div class="w-full h-1.5 rounded-full" style="background: var(--surface-secondary)">
              <div class="h-full rounded-full transition-all" :style="{
                width: Math.min(100, (product.stockQty / 100) * 100) + '%',
                background: product.stockQty <= 10 ? '#ef4444' : '#2DB84B',
              }"></div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="desc" class="mb-3 pt-3 border-t" style="border-color: var(--border)">
            <p class="text-xs font-bold mb-1" style="color: var(--text-secondary)">{{ t('product.description') }}</p>
            <p class="text-sm font-semibold leading-relaxed" style="color: var(--text-primary)">{{ desc }}</p>
          </div>

          <!-- Info chips -->
          <div class="flex flex-wrap gap-2 mt-2">
            <span v-if="product.unit" class="text-[10px] font-bold px-2 py-1 rounded-lg" style="background: var(--surface-secondary); color: var(--text-secondary)">
              📦 {{ product.unit }}
            </span>
            <span v-if="product.step && product.step !== 1" class="text-[10px] font-bold px-2 py-1 rounded-lg" style="background: var(--surface-secondary); color: var(--text-secondary)">
              ⚖️ {{ t('product.step') }}: {{ formatQty(product.step, product.unit) }}
            </span>
            <span v-if="product.minQty" class="text-[10px] font-bold px-2 py-1 rounded-lg" style="background: var(--surface-secondary); color: var(--text-secondary)">
              📏 {{ t('product.min') }}: {{ formatQty(product.minQty, product.unit) }}
            </span>
          </div>
        </div>

        <!-- Reviews section -->
        <div class="rounded-2xl p-4 mt-3" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ t('product.reviews') }}</p>
            <button v-if="isLoggedIn && !showReviewForm && !reviewSuccess" @click="showReviewForm = true"
              class="text-xs font-bold text-primary btn-press">{{ t('product.write_review') }}</button>
          </div>

          <!-- Review form -->
          <div v-if="showReviewForm" class="mb-4">
            <div class="flex items-center gap-1 mb-3">
              <button v-for="star in 5" :key="star" @click="reviewRating = star" class="btn-press">
                <svg width="24" height="24" :style="{ color: star <= reviewRating ? '#f59e0b' : 'var(--surface-tertiary)' }"
                  :fill="star <= reviewRating ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <textarea v-model="reviewComment" :placeholder="t('product.review_placeholder')" rows="3"
              class="w-full text-sm font-semibold px-3 py-2.5 rounded-xl outline-none resize-none mb-2"
              style="background: var(--surface-secondary); color: var(--text-primary)"></textarea>
            <p v-if="reviewError" class="text-xs font-bold text-red-500 mb-2">{{ reviewError }}</p>
            <div class="flex gap-2">
              <button @click="showReviewForm = false" class="flex-1 py-2.5 rounded-xl font-bold text-xs btn-press"
                style="background: var(--surface-secondary); color: var(--text-primary)">{{ t('profile.cancel') }}</button>
              <button @click="handleSubmitReview" :disabled="reviewSubmitting"
                class="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs btn-press"
                :class="{ 'opacity-50': reviewSubmitting }">
                {{ reviewSubmitting ? '...' : t('product.submit_review') }}
              </button>
            </div>
          </div>

          <p v-if="reviewSuccess" class="text-xs font-bold text-primary mb-2">✅ {{ t('product.review_submitted') }}</p>

          <!-- No reviews yet -->
          <div v-if="!showReviewForm && !reviewSuccess" class="text-center py-4">
            <p class="text-xs font-semibold" style="color: var(--text-tertiary)">{{ t('product.no_reviews') }}</p>
            <button v-if="!isLoggedIn" @click="navigate('login')" class="text-xs font-bold text-primary mt-1 btn-press">
              {{ t('product.login_to_review') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Bottom bar: Add to cart -->
    <div v-if="product" class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-4 pt-3 z-30 safe-bottom"
      style="background: var(--surface); box-shadow: 0 -4px 20px var(--shadow)">
      <div v-if="qty === 0" class="flex items-center gap-3">
        <div class="flex-1">
          <p class="text-lg font-black" style="color: var(--text-primary)">{{ formatPrice(hasDiscount ? product.discountedPrice : product.price) }}</p>
        </div>
        <button @click="addToCart(product)" class="flex-1 py-3.5 rounded-2xl bg-primary text-white font-black text-sm flex items-center justify-center gap-2 btn-press"
          style="box-shadow: 0 6px 24px var(--primary-glow)">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
          {{ t('cart.add') }}
        </button>
      </div>
      <div v-else class="flex items-center gap-3">
        <div class="flex-1">
          <p class="text-lg font-black" style="color: var(--text-primary)">{{ formatPrice((hasDiscount ? product.discountedPrice : product.price) * qty) }}</p>
          <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ formatQty(qty, product.unit) }} {{ t('cart.in_cart') }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="decrement(product.id)" class="w-10 h-10 rounded-full bg-primary flex items-center justify-center btn-press">
            <svg width="18" height="18" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
          <span class="text-lg font-black min-w-[40px] text-center" style="color: var(--text-primary)">{{ formatQty(qty, product.unit) }}</span>
          <button @click="addToCart(product)" class="w-10 h-10 rounded-full bg-primary flex items-center justify-center btn-press">
            <svg width="18" height="18" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
