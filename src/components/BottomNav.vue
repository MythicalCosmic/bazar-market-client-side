<script setup>
// src/components/BottomNav.vue
import { useCartStore } from '../stores/cartStore.js'
import { currentRoute, useRouter } from '../router/index.js'

const { totalCount } = useCartStore()
const { navigate } = useRouter()

const navItems = [
  { id: 'home',       label: 'Главная',   icon: 'home'  },
  { id: 'categories', label: 'Категории', icon: 'heart' },
  { id: 'orders',     label: 'Заказы',    icon: 'clock' },
  { id: 'profile',    label: 'Профиль',   icon: 'user'  },
]
</script>

<template>
  <nav
    class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white z-40 flex items-center"
    style="box-shadow: 0 -4px 24px rgba(0,0,0,0.08); border-top: 1px solid #f0f0f0"
  >
    <button
      v-for="item in navItems"
      :key="item.id"
      @click="navigate(item.id)"
      class="flex-1 py-2.5 flex flex-col items-center gap-0.5 relative"
    >
      <span
        v-if="currentRoute === item.id"
        class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
      />

      <template v-if="item.icon === 'home'">
        <svg :class="['w-6 h-6', currentRoute === item.id ? 'text-primary' : 'text-gray-400']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </template>

      <template v-else-if="item.icon === 'heart'">
        <svg :class="['w-6 h-6', currentRoute === item.id ? 'text-primary' : 'text-gray-400']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </template>

      <template v-else-if="item.icon === 'clock'">
        <svg :class="['w-6 h-6', currentRoute === item.id ? 'text-primary' : 'text-gray-400']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-width="2"/>
          <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </template>

      <template v-else-if="item.icon === 'user'">
        <svg :class="['w-6 h-6', currentRoute === item.id ? 'text-primary' : 'text-gray-400']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="7" r="4" stroke-width="2"/>
        </svg>
      </template>

      <span :class="['text-[10px] font-bold', currentRoute === item.id ? 'text-primary' : 'text-gray-400']">
        {{ item.label }}
      </span>
    </button>
  </nav>

  <Teleport to="#app">
    <button
      v-if="totalCount > 0 && currentRoute !== 'cart' && currentRoute !== 'checkout'"
      @click="navigate('cart')"
      class="btn-press"
      style="
        position: fixed;
        bottom: 80px;
        right: calc(50% - 390px/2 + 16px);
        width: 56px;
        height: 56px;
        background: #2DB84B;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        box-shadow: 0 6px 20px rgba(45,184,75,0.5);
        border: none;
        cursor: pointer;
      "
    >
      <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="3" y1="6" x2="21" y2="6" stroke-linecap="round"/>
        <path d="M16 10a4 4 0 0 1-8 0" stroke-linecap="round"/>
      </svg>
      <span style="
        position: absolute;
        top: -4px;
        right: -4px;
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 900;
        border-radius: 9999px;
        min-width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      ">{{ totalCount }}</span>
    </button>
  </Teleport>
</template>