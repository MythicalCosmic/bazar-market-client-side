<script setup>
import { ref, computed } from 'vue'
import CartItemRow from '../components/CartItemRow.vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { products } from '../stores/productsStore.js'

const { cartItems, subtotal, total, deliveryCost, discount, addToCart, clearCart } = useCartStore()
const { formatPrice, formatNum } = useFormat()
const { navigate } = useRouter()
const { t, getLocalizedName } = useI18n()

const showClearConfirm = ref(false)
const promoCode = ref('')
const promoApplied = ref(false)

function applyPromo() {
  if (promoCode.value.trim()) {
    promoApplied.value = true
  }
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
      <div
        class="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
        style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)"
      >
        <button @click="navigate('home')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
          <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="text-center">
          <p class="text-base font-black" style="color: var(--text-primary)">{{ t('cart.title') }}</p>
          <p class="text-xs font-semibold" style="color: var(--text-tertiary)">{{ cartItems.length }} {{ t('cart.items_count') }}</p>
        </div>
        <button @click="handleClearCart" class="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center btn-press">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Empty -->
      <div v-if="cartItems.length === 0" class="flex flex-col items-center justify-center py-24 px-8">
        <div class="text-7xl mb-5">🛒</div>
        <p class="text-xl font-black" style="color: var(--text-primary)">{{ t('cart.empty_title') }}</p>
        <p class="text-sm text-center mt-1.5" style="color: var(--text-tertiary)">{{ t('cart.empty_subtitle') }}</p>
        <button
          @click="navigate('home')"
          class="mt-6 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press"
          style="box-shadow: 0 4px 16px var(--primary-glow)"
        >{{ t('cart.go_catalog') }}</button>
      </div>

      <div v-else class="px-4 mt-3 flex flex-col gap-3">
        <!-- Items -->
        <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
          <CartItemRow v-for="item in cartItems" :key="item.id" :item="item" />
        </TransitionGroup>

        <!-- Upsell -->
        <div v-if="suggestions.length" class="mt-1">
          <p class="text-sm font-black mb-2.5" style="color: var(--text-primary)">{{ t('cart.add_more') }}</p>
          <div class="flex gap-2.5 scroll-x pb-1">
            <div
              v-for="p in suggestions" :key="p.id"
              class="flex-shrink-0 w-[88px] rounded-2xl p-2.5 flex flex-col items-center gap-1"
              style="background: var(--surface); box-shadow: 0 2px 10px var(--shadow)"
            >
              <img :src="p.image" :alt="getLocalizedName(p.name)" class="w-14 h-14 object-contain" />
              <p class="text-[10px] font-bold text-center line-clamp-2 leading-tight" style="color: var(--text-primary)">
                {{ getLocalizedName(p.name) }}
              </p>
              <button
                @click="addToCart(p)"
                class="text-[10px] font-black text-primary border border-primary rounded-lg px-2 py-0.5 btn-press"
              >{{ t('cart.add') }}</button>
            </div>
          </div>
        </div>

        <!-- Promo code -->
        <div class="rounded-2xl p-4 mt-1" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
          <p class="text-xs font-black mb-2" style="color: var(--text-primary)">{{ t('cart.promo_code') }}</p>
          <div class="flex gap-2">
            <input v-model="promoCode" :placeholder="t('coupons.enter_code')"
              class="flex-1 text-sm font-bold px-3 py-2.5 rounded-xl outline-none"
              style="background: var(--surface-secondary); color: var(--text-primary)" />
            <button @click="applyPromo" class="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black btn-press">
              {{ t('coupons.apply') }}
            </button>
          </div>
          <p v-if="promoApplied" class="text-[10px] font-bold text-primary mt-1.5">✅ {{ t('cart.promo_applied') }}</p>
        </div>

        <!-- Summary -->
        <div class="rounded-2xl p-4 mt-1" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
          <p class="text-sm font-black mb-3" style="color: var(--text-primary)">{{ t('cart.your_order') }}</p>
          <div class="flex flex-col gap-2.5">
            <div class="flex justify-between">
              <span class="text-xs font-semibold" style="color: var(--text-secondary)">{{ t('cart.products') }}({{ cartItems.length }})</span>
              <span class="text-xs font-bold" style="color: var(--text-primary)">{{ formatNum(subtotal) }} {{ t('currency') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs font-semibold" style="color: var(--text-secondary)">{{ t('cart.discount') }}</span>
              <span class="text-xs font-bold text-red-500">-{{ formatNum(discount) }} {{ t('currency') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs font-semibold" style="color: var(--text-secondary)">{{ t('cart.delivery') }}</span>
              <span class="text-xs font-bold" style="color: var(--text-primary)">{{ formatNum(deliveryCost) }} {{ t('currency') }}</span>
            </div>
            <div class="h-px" style="background: var(--border)"></div>
            <div class="flex justify-between">
              <span class="text-sm font-black" style="color: var(--text-primary)">{{ t('cart.total') }}</span>
              <span class="text-sm font-black" style="color: var(--text-primary)">{{ formatNum(total) }} {{ t('currency') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Checkout button -->
    <div
      v-if="cartItems.length > 0"
      class="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-3 z-30"
      style="background: linear-gradient(to top, var(--bg-app) 65%, transparent)"
    >
      <button
        @click="navigate('checkout')"
        class="w-full banner-bg text-white font-black py-4 rounded-2xl flex items-center justify-between px-5 btn-press"
        style="box-shadow: 0 6px 24px var(--primary-glow)"
      >
        <span class="bg-white bg-opacity-20 rounded-xl px-2.5 py-1 text-sm font-black">{{ cartItems.length }}</span>
        <span class="text-base">{{ t('cart.checkout') }}</span>
        <span class="text-sm font-bold opacity-90">{{ formatNum(total) }} {{ t('currency') }}</span>
      </button>
    </div>
    <!-- Clear cart confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showClearConfirm" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(0,0,0,0.5)" @click.self="showClearConfirm = false">
          <div class="w-full max-w-[480px] rounded-t-3xl p-6 safe-bottom" style="background: var(--surface);">
            <div class="flex flex-col items-center mb-6">
              <div class="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="text-lg font-black" style="color: var(--text-primary)">{{ t('cart.clear_confirm') }}</h3>
              <p class="text-sm font-semibold mt-1" style="color: var(--text-tertiary)">{{ t('cart.clear_subtitle') }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="confirmClear" class="w-full bg-red-500 text-white font-black py-3.5 rounded-2xl btn-press">
                {{ t('cart.clear_yes') }}
              </button>
              <button @click="showClearConfirm = false" class="w-full font-black py-3.5 rounded-2xl btn-press"
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
