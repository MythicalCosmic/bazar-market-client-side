<script setup>
// src/views/CartView.vue
import { computed } from 'vue'
import CartItemRow from '../components/CartItemRow.vue'
import { useCartStore } from '../stores/cartStore.js'
import { useFormat } from '../composables/useFormat.js'
import { useRouter } from '../router/index.js'
import { PRODUCTS } from '../stores/productsStore.js'

const { cartItems, subtotal, total, deliveryCost, discount, addToCart } = useCartStore()
const { formatPrice, formatNum } = useFormat()
const { navigate } = useRouter()

const suggestions = computed(() =>
  PRODUCTS.filter((p) => !cartItems.value.find((i) => i.id === p.id)).slice(0, 3)
)
</script>
<template>
  <div class="relative">
    <div class="pb-44">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-20"
        style="box-shadow: 0 2px 12px rgba(0,0,0,0.07)"
      >
        <button @click="navigate('home')" class="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center btn-press">
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="text-center">
          <p class="text-base font-black text-gray-900">Корзина</p>
          <p class="text-xs text-gray-400 font-semibold">{{ cartItems.length }} Товаров</p>
        </div>
        <button class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center btn-press">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Empty -->
      <div v-if="cartItems.length === 0" class="flex flex-col items-center justify-center py-24 px-8">
        <div class="text-7xl mb-5">🛒</div>
        <p class="text-xl font-black text-gray-700">Корзина пуста</p>
        <p class="text-sm text-gray-400 text-center mt-1.5">Добавьте товары из каталога</p>
        <button
          @click="navigate('home')"
          class="mt-6 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press"
          style="box-shadow: 0 4px 16px rgba(45,184,75,0.35)"
        >В каталог</button>
      </div>

      <div v-else class="px-4 mt-3 flex flex-col gap-3">
        <!-- Items -->
        <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
          <CartItemRow v-for="item in cartItems" :key="item.id" :item="item" />
        </TransitionGroup>

        <!-- Upsell -->
        <div v-if="suggestions.length" class="mt-1">
          <p class="text-sm font-black text-gray-700 mb-2.5">Добавить к заказу?</p>
          <div class="flex gap-2.5 scroll-x pb-1">
            <div
              v-for="p in suggestions" :key="p.id"
              class="flex-shrink-0 w-[88px] bg-white rounded-2xl p-2.5 flex flex-col items-center gap-1"
              style="box-shadow: 0 2px 10px rgba(0,0,0,0.07)"
            >
              <img :src="p.image" :alt="p.name" class="w-14 h-14 object-contain" />
              <p class="text-[10px] font-bold text-gray-700 text-center line-clamp-2 leading-tight">{{ p.name }}</p>
              <button
                @click="addToCart(p)"
                class="text-[10px] font-black text-primary border border-primary rounded-lg px-2 py-0.5 btn-press"
              >+ Добавить</button>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="bg-white rounded-2xl p-4 mt-1" style="box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <p class="text-sm font-black text-gray-800 mb-3">Ваш заказ</p>
          <div class="flex flex-col gap-2.5">
            <div class="flex justify-between">
              <span class="text-xs text-gray-500 font-semibold">Товары({{ cartItems.length }})</span>
              <span class="text-xs font-bold text-gray-800">{{ formatNum(subtotal) }} сум</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs text-gray-500 font-semibold">Скидка</span>
              <span class="text-xs font-bold text-red-500">-{{ formatNum(discount) }} сум</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs text-gray-500 font-semibold">Доставка</span>
              <span class="text-xs font-bold text-gray-800">{{ formatNum(deliveryCost) }} сум</span>
            </div>
            <div class="h-px bg-gray-100"></div>
            <div class="flex justify-between">
              <span class="text-sm font-black text-gray-900">Итого</span>
              <span class="text-sm font-black text-gray-900">{{ formatNum(total) }} сум</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Checkout button -->
    <div
      v-if="cartItems.length > 0"
      class="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4 pb-3 z-30"
      style="background: linear-gradient(to top, #f5f7f5 65%, transparent)"
    >
      <button
        @click="navigate('checkout')"
        class="w-full banner-bg text-white font-black py-4 rounded-2xl flex items-center justify-between px-5 btn-press"
        style="box-shadow: 0 6px 24px rgba(45,184,75,0.4)"
      >
        <span class="bg-white bg-opacity-20 rounded-xl px-2.5 py-1 text-sm font-black">{{ cartItems.length }}</span>
        <span class="text-base">Оформить заказ</span>
        <span class="text-sm font-bold opacity-90">{{ formatNum(total) }} сум</span>
      </button>
    </div>

  </div>
</template>