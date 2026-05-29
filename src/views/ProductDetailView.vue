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

function closeQtyModal() {
  qtyModalOpen.value = false
}

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
    <div v-if="isLoading" class="pt-4 px-4">
      <div class="skeleton h-[300px] rounded-3xl mb-4"></div>
      <div class="skeleton h-6 w-48 rounded-xl mb-2"></div>
      <div class="skeleton h-4 w-32 rounded-xl mb-4"></div>
      <div class="skeleton h-12 w-full rounded-2xl"></div>
    </div>

    <template v-else-if="product">
      <!-- ── Image gallery ── -->
      <div class="relative img-area">
        <!-- Nav buttons -->
        <button @click="navigate('home')" class="absolute top-3 left-3 z-20 nav-btn btn-press">
          <svg width="20" height="20" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>

        <button @click="handleFavorite" class="absolute top-3 right-3 z-20 nav-btn btn-press"
          :class="{ 'fav-active': fav }">
          <svg width="20" height="20" :class="fav ? 'text-red-500' : ''" :style="!fav ? 'color: var(--text-tertiary)' : ''"
            :fill="fav ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
          </svg>
        </button>

        <!-- Discount badge -->
        <span v-if="hasDiscount" class="absolute top-3 left-14 z-10 discount-tag">
          -{{ discountPercent }}%
        </span>

        <!-- Main image -->
        <div class="w-full flex items-center justify-center p-8 img-stage">
          <img v-if="allImages.length" :src="allImages[activeImage]" :alt="getLocalizedName(product.name)" class="max-w-full max-h-full object-contain" style="mix-blend-mode: multiply;" />
          <div v-else class="w-28 h-28 rounded-2xl flex items-center justify-center" style="background: var(--surface-secondary)">
            <svg width="48" height="48" style="color: var(--text-tertiary); opacity: 0.3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/><path d="M21 15l-5-5L5 21" stroke-width="2"/></svg>
          </div>
        </div>

        <!-- Image dots -->
        <div v-if="allImages.length > 1" class="flex items-center justify-center gap-1.5 pb-4">
          <button v-for="(_, i) in allImages" :key="i" @click="activeImage = i"
            class="img-dot" :class="activeImage === i ? 'img-dot-active' : 'img-dot-idle'" />
        </div>
      </div>

      <!-- ── Product info card ── -->
      <div class="px-4 -mt-4 relative z-10">
        <div class="info-card">
          <!-- Category tag -->
          <div v-if="product.categoryName" class="cat-tag">
            <span class="text-primary">{{ product.categoryName }}</span>
          </div>

          <!-- Name -->
          <h1 class="text-[18px] font-bold leading-snug mb-3" style="color: var(--text-primary)">{{ getLocalizedName(product.name) }}</h1>

          <!-- Price row -->
          <div class="flex items-center gap-2.5 mb-4">
            <p v-if="hasDiscount" class="text-[22px] font-bold text-primary">{{ formatPrice(product.discountedPrice) }}</p>
            <p :class="['font-bold', hasDiscount ? 'text-sm line-through' : 'text-[22px]']"
              :style="{ color: hasDiscount ? 'var(--text-tertiary)' : 'var(--text-primary)' }">
              {{ formatPrice(product.price) }}
            </p>
            <span class="unit-tag">
              / {{ product.unit === 'kg' ? 'kg' : product.unit === 'liter' ? 'l' : t('product.piece') }}
            </span>
          </div>

          <!-- Stock indicator -->
          <div v-if="product.stockQty !== null" class="mb-4">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="w-2 h-2 rounded-full" :style="{ background: product.stockQty <= 10 ? '#ef4444' : '#059669' }"></div>
              <p class="text-[11px] font-semibold" :style="{ color: product.stockQty <= 10 ? '#ef4444' : 'var(--text-secondary)' }">
                {{ product.stockQty <= 10 ? t('product.left_in_stock', { count: Math.round(product.stockQty) }) : t('product.in_stock') }}
              </p>
            </div>
            <div class="stock-bar">
              <div class="stock-fill" :style="{
                width: Math.min(100, (product.stockQty / 100) * 100) + '%',
                background: product.stockQty <= 10 ? '#ef4444' : '#059669',
              }"></div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="desc" class="desc-section">
            <p class="text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style="color: var(--text-tertiary)">{{ t('product.description') }}</p>
            <p class="text-[13px] font-medium leading-relaxed" style="color: var(--text-primary)">{{ desc }}</p>
          </div>

          <!-- Info chips -->
          <div v-if="(product.step && product.step !== 1) || (product.minQty && product.minQty !== 1)" class="flex flex-wrap gap-2 mt-4">
            <span v-if="product.step && product.step !== 1" class="info-chip">
              {{ t('product.step') }}: {{ formatQty(product.step, product.unit) }}
            </span>
            <span v-if="product.minQty && product.minQty !== 1" class="info-chip">
              {{ t('product.min') }}: {{ formatQty(product.minQty, product.unit) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Custom quantity modal ── -->
    <Teleport to="#app">
      <Transition name="fade">
        <div
          v-if="qtyModalOpen && product"
          class="fixed inset-0 z-[120] flex items-center justify-center p-5"
          style="background: rgba(0,0,0,0.5)"
          @click.self="closeQtyModal"
          @keydown.esc="closeQtyModal">
          <div class="qty-sheet" @click.stop>
            <div class="qty-sheet-header">
              <p class="qty-sheet-title">{{ t('product.enter_quantity') }}</p>
              <button @click="closeQtyModal" class="qty-sheet-close btn-press" :aria-label="t('profile.cancel')">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6L6 18" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <div class="qty-sheet-row">
              <button type="button" @click="adjustQtyModal(-1)" class="qty-sheet-step btn-press" aria-label="Decrease">
                <svg width="22" height="22" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </button>
              <input
                ref="qtyInputRef"
                v-model="qtyModalDraft"
                @keyup.enter="confirmQtyModal"
                type="text"
                :inputmode="stepInfo.isFractional ? 'decimal' : 'numeric'"
                class="qty-sheet-input"
                aria-label="Quantity" />
              <button type="button" @click="adjustQtyModal(1)" class="qty-sheet-step btn-press" aria-label="Increase">
                <svg width="22" height="22" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <p class="qty-sheet-unit">
              {{ product.unit === 'kg' ? 'kg' : product.unit === 'liter' ? 'l' : t('product.piece') }}
            </p>

            <div class="qty-sheet-actions">
              <button @click="closeQtyModal" class="qty-sheet-cancel btn-press">{{ t('profile.cancel') }}</button>
              <button @click="confirmQtyModal" class="qty-sheet-confirm btn-press">{{ t('common.done') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Bottom action bar ── -->
    <div v-if="product" class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 safe-bottom bottom-bar">
      <div class="px-4 py-3">
        <div v-if="qty === 0" class="flex items-center gap-3">
          <div class="flex-1">
            <p class="text-[18px] font-bold" style="color: var(--text-primary)">{{ formatPrice(hasDiscount ? product.discountedPrice : product.price) }}</p>
          </div>
          <button @click.stop="addToCart(product)" class="flex-1 add-btn btn-press">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
            {{ t('cart.add') }}
          </button>
        </div>
        <div v-else class="flex items-center gap-3">
          <div class="flex-1">
            <p class="text-[18px] font-bold" style="color: var(--text-primary)">{{ formatPrice((hasDiscount ? product.discountedPrice : product.price) * qty) }}</p>
            <p class="text-[10px] font-medium" style="color: var(--text-tertiary)">{{ formatQty(qty, product.unit) }} {{ t('cart.in_cart') }}</p>
          </div>
          <div class="qty-row">
            <button @click.stop="decrement(product.id)" class="qty-btn btn-press">
              <svg width="18" height="18" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
            </button>
            <button
              type="button"
              @click.stop="openQtyModal"
              class="qty-display text-[15px] font-bold text-center text-primary btn-press"
              :aria-label="t('product.enter_quantity')">
              {{ formatQty(qty, product.unit) }}
            </button>
            <button @click.stop="addToCart(product)" class="qty-btn btn-press">
              <svg width="18" height="18" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.img-area {
  background: var(--surface);
  border-radius: 0 0 28px 28px;
  box-shadow: 0 4px 20px var(--shadow);
}

.img-stage {
  height: 300px;
  background: var(--img-bg);
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border);
}
.fav-active {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.15);
}

.discount-tag {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  padding: 4px 10px;
  border-radius: 10px;
  background: linear-gradient(135deg, #F97316, #EA580C);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.img-dot {
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.img-dot-active {
  width: 20px;
  height: 6px;
  border-radius: 3px;
  background: var(--primary);
}
.img-dot-idle {
  width: 6px;
  height: 6px;
  background: var(--text-tertiary);
  opacity: 0.4;
}

.info-card {
  border-radius: 22px;
  padding: 20px;
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px var(--shadow);
  border: 1px solid var(--border);
}

.cat-tag {
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 8px;
  background: var(--primary-light);
  margin-bottom: 8px;
}

.unit-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 8px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
}

.stock-bar {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-secondary);
  overflow: hidden;
}
.stock-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.desc-section {
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.info-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
}

.bottom-bar {
  background: var(--surface);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 20px var(--shadow);
}

.add-btn {
  padding: 14px 0;
  border-radius: 16px;
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px var(--primary-glow), 0 2px 4px rgba(0, 0, 0, 0.08);
}
.add-btn:active {
  transform: scale(0.97);
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 14px;
  background: var(--primary-light);
}

.qty-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.qty-btn:active {
  transform: scale(0.9);
}

.qty-display {
  min-width: 56px;
  height: 36px;
  padding: 0 10px;
  background: var(--surface);
  border: none;
  border-radius: 10px;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* ── Custom quantity modal ── */
.qty-sheet {
  width: 100%;
  max-width: 340px;
  background: var(--surface);
  border-radius: 24px;
  padding: 18px 18px 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.qty-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.qty-sheet-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.qty-sheet-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-secondary);
  color: var(--text-secondary);
  border: none;
}

.qty-sheet-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 18px;
  background: var(--primary-light);
}
.qty-sheet-step {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.qty-sheet-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 52px;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  background: var(--surface);
  border: none;
  border-radius: 14px;
  outline: none;
  padding: 0 8px;
  -moz-appearance: textfield;
}
.qty-sheet-input::-webkit-outer-spin-button,
.qty-sheet-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-sheet-unit {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-top: 8px;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.qty-sheet-actions {
  display: flex;
  gap: 10px;
}
.qty-sheet-cancel,
.qty-sheet-confirm {
  flex: 1;
  height: 50px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.qty-sheet-cancel {
  background: var(--surface-secondary);
  color: var(--text-primary);
}
.qty-sheet-confirm {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  box-shadow: 0 4px 16px var(--primary-glow);
}
</style>
