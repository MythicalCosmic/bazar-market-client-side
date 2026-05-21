<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useCartStore } from '../stores/cartStore.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import { getProduct } from '../services/api.js'

const { navigate, routeParams } = useRouter()
const { t, getLocalizedName } = useI18n()
const { formatPrice, formatQty } = useFormat()
const { addToCart, decrement, getQty, setQty } = useCartStore()
const { isFavorite, toggleFavorite } = useFavorites()
const { isLoggedIn } = useAuth()

const product = ref(null)
const isLoading = ref(true)
const activeImage = ref(0)

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
const discountPercent = computed(() => hasDiscount.value ? Math.round((1 - product.value.discountedPrice / product.value.price) * 100) : 0)
const allImages = computed(() => {
  if (!product.value) return []
  if (product.value.images?.length) return product.value.images.map(img => img.image || img)
  if (product.value.image) return [product.value.image]
  return []
})

async function handleFavorite() {
  if (!isLoggedIn.value) { navigate('login'); return }
  await toggleFavorite(product.value.id)
}

const stepInfo = computed(() => {
  const p = product.value
  if (!p) return { step: 1, isFractional: false }
  const step = p.step || (['kg', 'liter'].includes(p.unit) ? 0.1 : 1)
  return { step, isFractional: step < 1 }
})

const qtyModalOpen = ref(false)
const qtyModalDraft = ref('')
const qtyInputRef = ref(null)

function trimNum(n) {
  if (!Number.isFinite(n)) return ''
  return String(Number(n.toFixed(3)))
}

function openQtyModal() {
  qtyModalDraft.value = String(qty.value || '')
  qtyModalOpen.value = true
  nextTick(() => {
    const el = qtyInputRef.value
    if (!el) return
    el.focus()
    el.select?.()
  })
}

function closeQtyModal() { qtyModalOpen.value = false }

function confirmQtyModal() {
  if (!product.value) { qtyModalOpen.value = false; return }
  const parsed = parseFloat(String(qtyModalDraft.value).replace(',', '.'))
  if (Number.isFinite(parsed) && parsed > 0) {
    setQty(product.value.id, parsed)
  }
  qtyModalOpen.value = false
}

function adjustQtyModal(direction) {
  const cur = parseFloat(String(qtyModalDraft.value).replace(',', '.')) || 0
  const step = stepInfo.value.step
  const next = Math.max(step, cur + direction * step)
  qtyModalDraft.value = trimNum(next)
}
</script>

<template>
  <div class="min-h-screen pb-28" style="background: var(--bg-app)">
    <!-- Loading -->
    <div v-if="isLoading" class="pt-4 px-5">
      <div class="skeleton h-3 w-24 mb-2"></div>
      <div class="skeleton h-[340px] mb-6"></div>
      <div class="skeleton h-8 w-3/4 mb-3"></div>
      <div class="skeleton h-4 w-32 mb-6"></div>
      <div class="skeleton h-12 w-full"></div>
    </div>

    <template v-else-if="product">
      <!-- Top bar with editorial breadcrumb -->
      <div class="px-5 pt-3 pb-3 flex items-center justify-between sticky top-0 z-20 detail-header">
        <button @click="navigate('home')" class="flex items-center gap-2 btn-press">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="eyebrow-sm">{{ t('ed.back_market') }}</span>
        </button>
        <button @click="handleFavorite" class="fav-circle btn-press" :class="{ 'fav-active': fav }">
          <svg width="15" height="15"
            :style="{ color: fav ? 'var(--terracotta)' : 'var(--text-primary)' }"
            :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <!-- Editorial category eyebrow -->
      <div class="px-5 mt-2 mb-1">
        <div class="flex items-center gap-2">
          <span class="num-label text-[11px] tabular">№ {{ String(product.id).slice(-3).padStart(3, '0') }}</span>
          <span class="block w-4 h-px" style="background: var(--hairline)"></span>
          <p class="eyebrow-sm">{{ product.categoryName || t('ed.from_market') }}</p>
        </div>
      </div>

      <!-- Product name (display serif) -->
      <div class="px-5 mt-2 mb-5">
        <h1 class="display text-[36px] leading-[0.98]" style="color: var(--text-primary);">
          {{ getLocalizedName(product.name) }}
        </h1>
      </div>

      <!-- ── Image gallery (large, magazine-style) ── -->
      <div class="relative mx-5 img-frame">
        <div class="img-stage">
          <img v-if="allImages.length" :src="allImages[activeImage]" :alt="getLocalizedName(product.name)" class="max-w-full max-h-full object-contain transition-all duration-500" style="mix-blend-mode: multiply;" />
          <svg v-else width="64" height="64" style="color: var(--text-tertiary); opacity: 0.3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>

          <!-- Discount tag (corner) -->
          <div v-if="hasDiscount" class="discount-corner-detail">
            <span class="num-label text-[14px] leading-none" style="color: var(--cream)">−{{ discountPercent }}<span class="text-[10px] align-top">%</span></span>
          </div>

          <!-- Frame inset border -->
          <div class="img-frame-border"></div>
        </div>

        <!-- Image dots -->
        <div v-if="allImages.length > 1" class="flex items-center justify-center gap-1.5 mt-4">
          <button v-for="(_, i) in allImages" :key="i" @click="activeImage = i"
            class="img-dash"
            :class="activeImage === i ? 'img-dash-active' : ''" />
        </div>
      </div>

      <!-- Price block -->
      <div class="px-5 mt-7">
        <div class="hairline mb-4"></div>
        <div class="flex items-end justify-between">
          <div>
            <p class="eyebrow mb-1.5">{{ t('ed.price_label') }}</p>
            <div class="flex items-baseline gap-2.5">
              <p v-if="hasDiscount" class="serif text-[34px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.025em;">{{ formatPrice(product.discountedPrice) }}</p>
              <p :class="['tabular', hasDiscount ? 'text-[14px] line-through' : 'serif text-[34px]']"
                :style="{ color: hasDiscount ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: '500', letterSpacing: '-0.025em' }">
                {{ formatPrice(product.price) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="eyebrow mb-1.5">{{ t('ed.per_label') }}</p>
            <p class="serif-italic text-[18px]" style="color: var(--text-primary)">
              {{ product.unit === 'kg' ? t('ed.kg_word') : product.unit === 'liter' ? t('ed.liter_word') : t('ed.piece_word') }}
            </p>
          </div>
        </div>
        <div class="hairline mt-4"></div>
      </div>

      <!-- Stock indicator -->
      <div v-if="product.stockQty !== null" class="px-5 mt-5">
        <div class="flex items-center justify-between mb-2">
          <p class="eyebrow-sm" :style="{ color: product.stockQty <= 10 ? 'var(--bordeaux)' : 'var(--primary)' }">
            {{ product.stockQty <= 10 ? t('product.left_in_stock', { count: Math.round(product.stockQty) }) : t('product.in_stock') }}
          </p>
          <p class="text-[11px] tabular" style="color: var(--text-tertiary)">{{ Math.round(product.stockQty) }} {{ t('ed.available') }}</p>
        </div>
        <div class="stock-bar">
          <div class="stock-fill" :style="{
            width: Math.min(100, (product.stockQty / 100) * 100) + '%',
            background: product.stockQty <= 10 ? 'var(--bordeaux)' : 'var(--primary)',
          }"></div>
        </div>
      </div>

      <!-- Description with drop cap -->
      <div v-if="desc" class="px-5 mt-8">
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">§</span>
          <p class="eyebrow-sm">{{ t('ed.about_product') }}</p>
        </div>
        <p class="text-[14px] leading-relaxed drop-cap" style="color: var(--text-primary); letter-spacing: 0.005em; line-height: 1.7;">
          {{ desc }}
        </p>
      </div>

      <!-- Info chips (editorial) -->
      <div v-if="(product.step && product.step !== 1) || (product.minQty && product.minQty !== 1)" class="px-5 mt-6">
        <div class="hairline mb-4"></div>
        <div class="grid grid-cols-2 gap-4">
          <div v-if="product.step && product.step !== 1">
            <p class="eyebrow mb-1">{{ t('ed.increment') }}</p>
            <p class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500;">{{ formatQty(product.step, product.unit) }}</p>
          </div>
          <div v-if="product.minQty && product.minQty !== 1">
            <p class="eyebrow mb-1">{{ t('ed.minimum') }}</p>
            <p class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500;">{{ formatQty(product.minQty, product.unit) }}</p>
          </div>
        </div>
        <div class="hairline mt-4"></div>
      </div>

      <!-- Editorial signoff -->
      <div class="px-5 mt-10">
        <div class="rule-center">
          <span class="num-label text-[10px]" style="color: var(--text-tertiary)">·  ·  ·</span>
        </div>
      </div>
    </template>

    <!-- ── Custom quantity modal ── -->
    <Teleport to="#app">
      <Transition name="fade">
        <div
          v-if="qtyModalOpen && product"
          class="fixed inset-0 z-[120] flex items-center justify-center p-5"
          style="background: rgba(26, 38, 32, 0.55); backdrop-filter: blur(8px)"
          @click.self="closeQtyModal"
          @keydown.esc="closeQtyModal">
          <div class="qty-sheet" @click.stop>
            <div class="qty-sheet-header">
              <div>
                <p class="eyebrow-sm mb-1">{{ t('ed.quantity_word') }}</p>
                <p class="serif text-[18px] leading-tight" style="color: var(--text-primary); font-weight: 500;">{{ getLocalizedName(product.name) }}</p>
              </div>
              <button @click="closeQtyModal" class="qty-sheet-close btn-press" :aria-label="t('profile.cancel')">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
                  <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <div class="hairline my-4"></div>

            <div class="qty-sheet-row">
              <button type="button" @click="adjustQtyModal(-1)" class="qty-sheet-step btn-press" aria-label="Decrease">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6" style="color: var(--text-primary)">
                  <path d="M5 12h14" stroke-linecap="round"/>
                </svg>
              </button>
              <input
                ref="qtyInputRef"
                v-model="qtyModalDraft"
                @keyup.enter="confirmQtyModal"
                type="text"
                :inputmode="stepInfo.isFractional ? 'decimal' : 'numeric'"
                class="qty-sheet-input serif tabular"
                aria-label="Quantity" />
              <button type="button" @click="adjustQtyModal(1)" class="qty-sheet-step btn-press" aria-label="Increase">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6" style="color: var(--text-primary)">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <p class="qty-sheet-unit">
              {{ product.unit === 'kg' ? t('ed.kg_word') : product.unit === 'liter' ? t('ed.liter_word') : t('ed.piece_word') }}
            </p>

            <div class="qty-sheet-actions">
              <button @click="closeQtyModal" class="qty-sheet-cancel btn-press">{{ t('profile.cancel') }}</button>
              <button @click="confirmQtyModal" class="qty-sheet-confirm btn-press">{{ t('common.done') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Bottom action bar (editorial) ── -->
    <div v-if="product" class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 safe-bottom bottom-bar">
      <div class="px-5 py-4">
        <div v-if="qty === 0" class="flex items-center gap-4">
          <div class="flex-1">
            <p class="eyebrow-sm">{{ t('ed.total_short') }}</p>
            <p class="serif text-[22px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.02em;">{{ formatPrice(hasDiscount ? product.discountedPrice : product.price) }}</p>
          </div>
          <button @click.stop="addToCart(product)" class="add-btn btn-press">
            <span class="eyebrow-sm" style="color: var(--cream)">{{ t('ed.add_to_basket') }}</span>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div v-else class="flex items-center gap-3">
          <div class="flex-1">
            <p class="eyebrow-sm">{{ t('ed.in_basket') }} · {{ formatQty(qty, product.unit) }}</p>
            <p class="serif text-[22px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.02em;">{{ formatPrice((hasDiscount ? product.discountedPrice : product.price) * qty) }}</p>
          </div>
          <div class="qty-row">
            <button @click.stop="decrement(product.id)" class="qty-btn-detail btn-press">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="color: var(--text-primary)">
                <path d="M5 12h14" stroke-linecap="round"/>
              </svg>
            </button>
            <button
              type="button"
              @click.stop="openQtyModal"
              class="qty-display btn-press"
              :aria-label="t('product.enter_quantity')">
              <span class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500;">{{ formatQty(qty, product.unit) }}</span>
            </button>
            <button @click.stop="addToCart(product)" class="qty-btn-detail btn-press">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="color: var(--text-primary)">
                <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-header {
  background: var(--bg-app);
  border-bottom: 1px solid var(--hairline);
}

.fav-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.fav-active {
  border-color: var(--terracotta);
}

.img-frame {
  background: var(--img-bg);
  border: 1px solid var(--hairline);
  position: relative;
}
.img-stage {
  position: relative;
  height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 36px;
  overflow: hidden;
}
.img-frame-border {
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(26, 38, 32, 0.06);
  pointer-events: none;
}

.discount-corner-detail {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--bordeaux);
  padding: 8px 14px 10px;
  z-index: 10;
}

.img-dash {
  width: 24px;
  height: 1.5px;
  background: var(--hairline);
  transition: background 0.3s ease, height 0.3s ease;
}
.img-dash-active {
  background: var(--text-primary);
  height: 2px;
}

.stock-bar {
  width: 100%;
  height: 2px;
  background: var(--hairline);
  overflow: hidden;
}
.stock-fill {
  height: 100%;
  transition: width 0.6s ease;
}

.bottom-bar {
  background: var(--bg-app);
  border-top: 1px solid var(--hairline);
}

.add-btn {
  padding: 14px 22px;
  background: var(--surface-ink);
  color: var(--cream);
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;
}
.add-btn:active {
  transform: scale(0.96);
  background: var(--primary-dark);
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--hairline);
}

.qty-btn-detail {
  width: 38px;
  height: 38px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border: none;
  transition: background 0.2s ease;
}
.qty-btn-detail:active {
  background: var(--surface-secondary);
}

.qty-display {
  min-width: 56px;
  height: 38px;
  padding: 0 12px;
  background: var(--surface);
  border: none;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* ── Quantity modal ── */
.qty-sheet {
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 4px;
  padding: 22px 22px 20px;
  box-shadow: var(--shadow-deep);
}

.qty-sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.qty-sheet-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-secondary);
  color: var(--text-primary);
  border: 1px solid var(--hairline);
  flex-shrink: 0;
}

.qty-sheet-row {
  display: flex;
  align-items: center;
  padding: 4px;
  border: 1px solid var(--hairline);
}
.qty-sheet-step {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}
.qty-sheet-step:active {
  background: var(--surface-secondary);
}
.qty-sheet-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 50px;
  text-align: center;
  font-size: 28px;
  font-weight: 500;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: 0 8px;
  letter-spacing: -0.02em;
}

.qty-sheet-unit {
  text-align: center;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 10px;
  margin-bottom: 18px;
}

.qty-sheet-actions {
  display: flex;
  gap: 8px;
}
.qty-sheet-cancel,
.qty-sheet-confirm {
  flex: 1;
  height: 46px;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  border: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  background: var(--surface);
  color: var(--text-primary);
}
.qty-sheet-confirm {
  background: var(--surface-ink);
  color: var(--cream);
  border-color: var(--surface-ink);
}
</style>
