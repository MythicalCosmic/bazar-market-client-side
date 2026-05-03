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
  products.value.filter((p) => !cartItems.value.find((i) => i.id === p.id)).slice(0, 3)
)

function handleClearCart() {
  showClearConfirm.value = true
}

function confirmClear() {
  clearCart()
  showClearConfirm.value = false
}
</script>

<template>
  <div class="relative">
    <div class="pb-44">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20 cart-header">
        <button @click="navigate('home')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
          <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="text-center">
          <p class="text-base font-bold" style="color: var(--text-primary)">{{ t('cart.title') }}</p>
          <p class="text-[11px] font-medium" style="color: var(--text-tertiary)">{{ cartItems.length }} {{ t('cart.items_count') }}</p>
        </div>
        <button @click="handleClearCart" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: rgba(239,68,68,0.08)">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="cartItems.length === 0" class="flex flex-col items-center justify-center py-24 px-8">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-5" style="background: var(--surface-secondary)">
          <svg width="36" height="36" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="text-xl font-bold" style="color: var(--text-primary)">{{ t('cart.empty_title') }}</p>
        <p class="text-sm text-center mt-1.5 font-medium" style="color: var(--text-tertiary)">{{ t('cart.empty_subtitle') }}</p>
        <button
          @click="navigate('home')"
          class="mt-6 bg-primary text-white font-bold px-8 py-3.5 rounded-2xl btn-press"
          style="box-shadow: 0 4px 16px var(--primary-glow)"
        >{{ t('cart.go_catalog') }}</button>
      </div>

      <div v-else class="px-4 mt-3 flex flex-col gap-3">
        <!-- Cart items -->
        <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
          <CartItemRow v-for="item in cartItems" :key="item.id" :item="item" />
        </TransitionGroup>

        <!-- Upsell suggestions -->
        <div v-if="suggestions.length" class="mt-2">
          <p class="text-sm font-bold mb-2.5" style="color: var(--text-primary)">{{ t('cart.add_more') }}</p>
          <div class="flex gap-2.5 scroll-x pb-1">
            <div v-for="p in suggestions" :key="p.id" class="upsell-card">
              <img :src="p.image" :alt="getLocalizedName(p.name)" class="w-12 h-12 object-contain" style="mix-blend-mode: multiply;" />
              <p class="text-[10px] font-medium text-center line-clamp-2 leading-tight" style="color: var(--text-secondary)">
                {{ getLocalizedName(p.name) }}
              </p>
              <button @click="addToCart(p)"
                class="text-[10px] font-bold text-primary border border-primary rounded-lg px-2 py-0.5 btn-press">
                {{ t('cart.add') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Promo code -->
        <div class="promo-section mt-2" :class="{ 'promo-valid': promoStatus === 'valid' }">
          <p class="text-xs font-bold mb-2.5" style="color: var(--text-primary)">{{ t('cart.promo_code') }}</p>

          <!-- Applied state -->
          <div v-if="promoStatus === 'valid' && promoData" class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-primary">{{ appliedCode }}</p>
                <p class="text-[10px] font-medium" style="color: var(--text-secondary)">
                  {{ promoData.type === 'percent' ? promoData.value + '% ' + t('cart.discount').toLowerCase() : '' }}
                  · -{{ formatNum(promoData.discount_amount) }} {{ t('currency') }}
                </p>
              </div>
            </div>
            <button @click="removePromo" class="w-8 h-8 rounded-xl flex items-center justify-center btn-press" style="background: rgba(239,68,68,0.08)">
              <svg width="14" height="14" class="text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Input state -->
          <div v-else>
            <div class="flex gap-2">
              <input v-model="promoCode" :placeholder="t('coupons.enter_code')"
                :disabled="promoStatus === 'loading'"
                class="promo-input"
                :class="{ 'promo-input-error': promoStatus === 'invalid' }"
                @keyup.enter="applyPromo" />
              <button @click="applyPromo" :disabled="promoStatus === 'loading' || !promoCode.trim()"
                class="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold btn-press transition-opacity"
                :class="{ 'opacity-50': promoStatus === 'loading' || !promoCode.trim() }">
                {{ promoStatus === 'loading' ? '...' : t('coupons.apply') }}
              </button>
            </div>
            <p v-if="promoStatus === 'invalid' && promoError" class="text-[10px] font-semibold text-red-500 mt-2">
              {{ promoError }}
            </p>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="summary-card mt-2">
          <p class="text-sm font-bold mb-3" style="color: var(--text-primary)">{{ t('cart.your_order') }}</p>
          <div class="flex flex-col gap-2.5">
            <div class="flex justify-between">
              <span class="text-xs font-medium" style="color: var(--text-secondary)">{{ t('cart.products') }}({{ cartItems.length }})</span>
              <span class="text-xs font-semibold" style="color: var(--text-primary)">{{ formatNum(subtotal) }} {{ t('currency') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs font-medium" style="color: var(--text-secondary)">{{ t('cart.discount') }}</span>
              <span class="text-xs font-semibold text-red-500">-{{ formatNum(discount) }} {{ t('currency') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs font-medium" style="color: var(--text-secondary)">{{ t('cart.delivery') }}</span>
              <span class="text-xs font-semibold" style="color: var(--text-primary)">{{ formatNum(deliveryCost) }} {{ t('currency') }}</span>
            </div>
            <div class="h-px" style="background: var(--border)"></div>
            <div class="flex justify-between">
              <span class="text-[15px] font-bold" style="color: var(--text-primary)">{{ t('cart.total') }}</span>
              <span class="text-[15px] font-bold" style="color: var(--text-primary)">{{ formatNum(total) }} {{ t('currency') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Checkout button -->
    <div v-if="cartItems.length > 0"
      class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-4 pt-3 z-30"
      style="background: linear-gradient(to top, var(--bg-app) 70%, transparent)">
      <button
        @click="navigate('checkout', { couponCode: appliedCode })"
        class="checkout-btn btn-press">
        <span class="checkout-count">{{ cartItems.length }}</span>
        <span class="text-[15px] font-bold">{{ t('cart.checkout') }}</span>
        <span class="text-sm font-semibold opacity-90">{{ formatNum(total) }} {{ t('currency') }}</span>
      </button>
    </div>

    <!-- Clear cart confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showClearConfirm" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(0,0,0,0.4)" @click.self="showClearConfirm = false">
          <div class="w-full max-w-[480px] rounded-t-[28px] p-6 safe-bottom" style="background: var(--surface);">
            <div class="flex flex-col items-center mb-6">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" style="background: rgba(239,68,68,0.08)">
                <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold" style="color: var(--text-primary)">{{ t('cart.clear_confirm') }}</h3>
              <p class="text-sm font-medium mt-1" style="color: var(--text-tertiary)">{{ t('cart.clear_subtitle') }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="confirmClear" class="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl btn-press">
                {{ t('cart.clear_yes') }}
              </button>
              <button @click="showClearConfirm = false" class="w-full font-bold py-3.5 rounded-2xl btn-press"
                style="background: var(--surface-secondary); color: var(--text-primary)">
                {{ t('profile.cancel') }}
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
  background: rgba(250, 249, 246, 0.88);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border);
}
:root.dark .cart-header, .dark .cart-header {
  background: rgba(12, 10, 9, 0.88);
}

.upsell-card {
  flex-shrink: 0;
  width: 88px;
  border-radius: 16px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 12px var(--shadow);
}

.promo-section {
  border-radius: 18px;
  padding: 16px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 12px var(--shadow);
  transition: all 0.3s ease;
}
.promo-valid {
  background: var(--primary-light);
  box-shadow: 0 0 0 2px var(--primary), 0 4px 12px var(--shadow);
}

.promo-input {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 12px;
  outline: none;
  background: var(--surface-secondary);
  color: var(--text-primary);
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}
.promo-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.08);
}
.promo-input-error {
  background: rgba(239, 68, 68, 0.04);
  border-color: rgba(239, 68, 68, 0.3);
}

.summary-card {
  border-radius: 18px;
  padding: 16px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 12px var(--shadow);
}

.checkout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%);
  color: white;
  box-shadow: 0 4px 16px var(--primary-glow), 0 2px 4px rgba(0, 0, 0, 0.1);
}
.checkout-count {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 700;
}
</style>
