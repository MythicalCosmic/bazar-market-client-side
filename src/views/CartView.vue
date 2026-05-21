<script setup>
import { ref, computed } from 'vue'
import CartItemRow from '../components/CartItemRow.vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { products } from '../stores/productsStore.js'
import { validateCoupon } from '../services/api.js'

const { cartItems, subtotal, total, deliveryCost, discount, addToCart, clearCart, setDiscount } = useCartStore()
const { formatPrice, formatNum } = useFormat()
const { navigate } = useRouter()
const { t, getLocalizedName } = useI18n()

const showClearConfirm = ref(false)
const promoCode = ref('')
const promoStatus = ref('idle')
const promoError = ref('')
const promoData = ref(null)
const appliedCode = ref('')

async function applyPromo() {
  const code = promoCode.value.trim()
  if (!code) return

  promoStatus.value = 'loading'
  promoError.value = ''
  promoData.value = null

  try {
    const data = await validateCoupon(code, subtotal.value)
    if (data.valid) {
      promoStatus.value = 'valid'
      promoData.value = data
      appliedCode.value = code
      setDiscount(parseFloat(data.discount_amount) || 0)
    } else {
      promoStatus.value = 'invalid'
      promoError.value = t('coupons.invalid')
    }
  } catch (e) {
    promoStatus.value = 'invalid'
    promoError.value = e.message || t('coupons.invalid')
    setDiscount(0)
  }
}

function removePromo() {
  promoCode.value = ''
  promoStatus.value = 'idle'
  promoData.value = null
  promoError.value = ''
  appliedCode.value = ''
  setDiscount(0)
}

const suggestions = computed(() =>
  products.value.filter((p) => !cartItems.value.find((i) => i.id === p.id)).slice(0, 4)
)

function handleClearCart() { showClearConfirm.value = true }
function confirmClear() {
  clearCart()
  showClearConfirm.value = false
}
</script>

<template>
  <div class="relative min-h-screen" style="background: var(--bg-app)">
    <div class="pb-44">
      <!-- Editorial header -->
      <div class="px-5 py-4 sticky top-0 z-20 cart-header">
        <div class="flex items-center justify-between">
          <button @click="navigate('home')" class="flex items-center gap-2 btn-press">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="eyebrow-sm">{{ t('ed.continue_shopping') }}</span>
          </button>
          <button v-if="cartItems.length" @click="handleClearCart" class="btn-press">
            <span class="eyebrow-sm" style="color: var(--bordeaux)">{{ t('ed.clear_all') }}</span>
          </button>
        </div>
      </div>

      <!-- Editorial title -->
      <div class="px-5 mt-4 mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="num-label text-[11px] tabular">№ {{ String(cartItems.length).padStart(2, '0') }}</span>
          <span class="block w-4 h-px" style="background: var(--hairline)"></span>
          <p class="eyebrow-sm">{{ cartItems.length }} {{ t('cart.items_count') }}</p>
        </div>
        <h1 class="display text-[34px]" style="color: var(--text-primary)">
          {{ t('ed.your_basket_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.basket_italic') }}</span>
        </h1>
        <div class="hairline mt-4"></div>
      </div>

      <!-- Empty state -->
      <div v-if="cartItems.length === 0" class="px-8 pt-10 pb-10 text-center">
        <p class="num-label text-[14px] mb-3">— № 00 —</p>
        <h2 class="display text-[24px] mb-2" style="color: var(--text-primary)">
          {{ t('ed.basket_awaits') }}
        </h2>
        <p class="serif-italic text-[15px] leading-relaxed" style="color: var(--text-secondary)">
          {{ t('ed.start_selection') }}
        </p>
        <button @click="navigate('home')" class="empty-cta btn-press mt-7">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ t('ed.browse_market') }}</span>
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--cream)">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div v-else>
        <!-- Cart items list -->
        <div class="items-list">
          <TransitionGroup name="list">
            <CartItemRow v-for="item in cartItems" :key="item.id" :item="item" />
          </TransitionGroup>
        </div>

        <!-- Upsell suggestions -->
        <div v-if="suggestions.length" class="mt-8 px-5">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="eyebrow-sm">{{ t('ed.worth_adding') }}</p>
              <h3 class="display text-[20px] mt-1" style="color: var(--text-primary)">{{ t('ed.little_extra') }}</h3>
            </div>
          </div>
          <div class="hairline mb-3"></div>
          <div class="flex gap-3 scroll-x pb-1">
            <div v-for="p in suggestions" :key="p.id" class="upsell-card">
              <div class="upsell-img">
                <img v-if="p.image" :src="p.image" :alt="getLocalizedName(p.name)" class="w-full h-full object-contain p-2" style="mix-blend-mode: multiply;" />
              </div>
              <p class="upsell-name line-clamp-2">{{ getLocalizedName(p.name) }}</p>
              <p class="serif text-[13px] tabular" style="color: var(--text-primary); font-weight: 500">{{ formatPrice(p.discountedPrice || p.price) }}</p>
              <button @click="addToCart(p)" class="upsell-add btn-press">
                <span class="eyebrow-sm">{{ t('cart.add') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Promo code -->
        <div class="mt-8 px-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="num-label text-[11px] tabular">§</span>
            <p class="eyebrow-sm">{{ t('cart.promo_code') }}</p>
          </div>
          <div class="hairline mb-3"></div>

          <!-- Applied -->
          <div v-if="promoStatus === 'valid' && promoData" class="promo-applied">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="num-label text-[14px]">✓</span>
              <div class="min-w-0">
                <p class="serif text-[15px]" style="color: var(--text-primary); font-weight: 500">{{ appliedCode }}</p>
                <p class="text-[11px] tabular" style="color: var(--text-secondary)">
                  −{{ formatNum(promoData.discount_amount) }} {{ t('currency') }}
                </p>
              </div>
            </div>
            <button @click="removePromo" class="btn-press">
              <span class="eyebrow-sm" style="color: var(--bordeaux)">{{ t('ed.remove') }}</span>
            </button>
          </div>

          <!-- Input -->
          <div v-else>
            <div class="flex items-center gap-0 promo-row" :class="{ 'promo-row-error': promoStatus === 'invalid' }">
              <input v-model="promoCode" :placeholder="t('coupons.enter_code')"
                :disabled="promoStatus === 'loading'"
                class="promo-input"
                @keyup.enter="applyPromo" />
              <button @click="applyPromo" :disabled="promoStatus === 'loading' || !promoCode.trim()"
                class="promo-apply btn-press"
                :class="{ 'promo-apply-disabled': promoStatus === 'loading' || !promoCode.trim() }">
                <span class="eyebrow-sm" style="color: var(--cream)">{{ promoStatus === 'loading' ? '...' : t('coupons.apply') }}</span>
              </button>
            </div>
            <p v-if="promoStatus === 'invalid' && promoError" class="text-[11px] mt-2 serif-italic" style="color: var(--bordeaux)">
              {{ promoError }}
            </p>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="mt-8 px-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="num-label text-[11px] tabular">∑</span>
            <p class="eyebrow-sm">{{ t('cart.your_order') }}</p>
          </div>
          <div class="hairline mb-4"></div>
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-baseline">
              <span class="serif-italic text-[14px]" style="color: var(--text-secondary)">{{ t('cart.products') }} ({{ cartItems.length }})</span>
              <span class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500">{{ formatNum(subtotal) }} <span class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('currency') }}</span></span>
            </div>
            <div v-if="discount > 0" class="flex justify-between items-baseline">
              <span class="serif-italic text-[14px]" style="color: var(--text-secondary)">{{ t('cart.discount') }}</span>
              <span class="serif text-[15px] tabular" style="color: var(--bordeaux); font-weight: 500">−{{ formatNum(discount) }} <span class="eyebrow-sm" style="color: var(--bordeaux); opacity: 0.7">{{ t('currency') }}</span></span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="serif-italic text-[14px]" style="color: var(--text-secondary)">{{ t('cart.delivery') }}</span>
              <span class="serif text-[15px] tabular" style="color: var(--text-primary); font-weight: 500">{{ formatNum(deliveryCost) }} <span class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('currency') }}</span></span>
            </div>
            <div class="hairline-strong my-1"></div>
            <div class="flex justify-between items-baseline">
              <span class="eyebrow">{{ t('cart.total') }}</span>
              <span class="serif text-[26px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.02em">{{ formatNum(total) }} <span class="eyebrow" style="color: var(--text-tertiary)">{{ t('currency') }}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Checkout button -->
    <div v-if="cartItems.length > 0"
      class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-4 pt-3 z-30 checkout-fab-wrap">
      <button
        @click="navigate('checkout', { couponCode: appliedCode })"
        class="checkout-btn btn-press">
        <div class="flex items-center gap-3">
          <span class="checkout-count tabular">{{ cartItems.length }}</span>
          <div class="text-left">
            <p class="eyebrow-sm" style="color: var(--cream); opacity: 0.6">{{ t('ed.proceed') }}</p>
            <span class="serif text-[15px]" style="color: var(--cream); font-weight: 500">{{ t('cart.checkout') }}</span>
          </div>
        </div>
        <div class="text-right">
          <p class="eyebrow-sm" style="color: var(--cream); opacity: 0.6">{{ t('ed.total_short') }}</p>
          <span class="serif text-[15px] tabular" style="color: var(--cream); font-weight: 500">{{ formatNum(total) }} {{ t('currency') }}</span>
        </div>
      </button>
    </div>

    <!-- Clear cart confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showClearConfirm" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(26, 38, 32, 0.55); backdrop-filter: blur(8px)" @click.self="showClearConfirm = false">
          <div class="w-full max-w-[480px] confirm-sheet safe-bottom">
            <div class="text-center mb-5">
              <p class="num-label text-[12px] mb-2">— {{ t('ed.notice') }} —</p>
              <h3 class="display text-[22px]" style="color: var(--text-primary)">{{ t('cart.clear_confirm') }}</h3>
              <p class="serif-italic text-[13px] mt-2" style="color: var(--text-secondary)">{{ t('cart.clear_subtitle') }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="showClearConfirm = false" class="confirm-cancel btn-press">
                <span class="eyebrow-sm">{{ t('profile.cancel') }}</span>
              </button>
              <button @click="confirmClear" class="confirm-action btn-press">
                <span class="eyebrow-sm" style="color: var(--cream)">{{ t('cart.clear_yes') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.cart-header {
  background: rgba(250, 247, 241, 0.86);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-bottom: 1px solid var(--hairline);
}
:root.dark .cart-header, .dark .cart-header {
  background: rgba(14, 20, 17, 0.86);
}

.items-list {
  background: var(--surface);
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
  border-radius: 2px;
}

.upsell-card {
  flex-shrink: 0;
  width: 130px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  padding: 10px;
  border-radius: 2px;
}
.upsell-img {
  width: 100%;
  height: 90px;
  background: var(--img-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.upsell-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.2;
  min-height: 30px;
}
.upsell-add {
  margin-top: auto;
  padding: 7px 0;
  text-align: center;
  border: 1px solid var(--border-strong);
  background: transparent;
  cursor: pointer;
}

/* Promo */
.promo-applied {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--primary);
  background: var(--primary-tint);
}

.promo-row {
  display: flex;
  border: 1px solid var(--hairline);
  background: var(--surface);
  transition: border-color 0.2s ease;
}
.promo-row:focus-within {
  border-color: var(--text-primary);
}
.promo-row-error {
  border-color: var(--bordeaux);
}
.promo-input {
  flex: 1;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 13px 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: transparent;
  color: var(--text-primary);
  border: none;
  outline: none;
}
.promo-apply {
  padding: 0 18px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.promo-apply-disabled {
  opacity: 0.5;
}

.checkout-fab-wrap {
  background: linear-gradient(to top, var(--bg-app) 60%, transparent);
}

.checkout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--surface-ink);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: var(--shadow-lg);
}

.checkout-count {
  background: var(--terracotta);
  color: var(--cream);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 2px;
  min-width: 36px;
  text-align: center;
}

/* Confirm sheet */
.confirm-sheet {
  background: var(--surface);
  padding: 28px 22px 24px;
  border-top: 1px solid var(--hairline);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.confirm-cancel,
.confirm-action {
  flex: 1;
  padding: 14px 0;
  background: var(--surface);
  border: 1px solid var(--hairline);
  cursor: pointer;
  text-align: center;
}
.confirm-action {
  background: var(--bordeaux);
  border-color: var(--bordeaux);
}
</style>
