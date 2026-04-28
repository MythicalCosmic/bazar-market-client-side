<script setup>
// src/views/ProfileView.vue
import { useRouter } from '../router/index.js'

const { navigate } = useRouter()

const menuGroups = [
  {
    items: [
      { label: 'Мои заказы',    icon: 'orders',  route: 'orders'    },
      { label: 'Категории',     icon: 'heart',   route: 'categories' },
      { label: 'Мои купоны',    icon: 'coupon',  route: null        },
      { label: 'Методы оплаты', icon: 'card',    route: null        },
    ],
  },
  {
    items: [
      { label: 'Помощь и поддержка', icon: 'help', route: null },
    ],
  },
]

function handleClick(route) {
  if (route) navigate(route)
}
</script>

<template>
  <div class="pb-28 px-4 pt-5">

    <!-- Profile card -->
    <div class="bg-white rounded-2xl p-4 flex items-center gap-4 mb-4"
      style="box-shadow: 0 2px 12px rgba(0,0,0,0.07)">
      <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="7" r="4" stroke-width="2"/>
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-base font-black text-gray-900">Имя пользователя</p>
        <p class="text-xs text-gray-400 font-semibold mt-0.5">+998 90 123 45 67</p>
      </div>
      <button class="bg-primary-light text-primary text-xs font-black px-3 py-1.5 rounded-xl btn-press">
        Изменить
      </button>
    </div>

    <!-- Stats -->
    <div class="bg-white rounded-2xl p-4 mb-4"
      style="box-shadow: 0 2px 12px rgba(0,0,0,0.07)">
      <div class="flex items-center divide-x divide-gray-100">
        <div
          v-for="(stat, i) in [['45','Заказов'],['12','Избранных'],['2','Купонов']]"
          :key="i"
          class="flex-1 flex flex-col items-center py-1 cursor-pointer btn-press"
          @click="i === 0 ? navigate('orders') : null"
        >
          <p class="text-xl font-black text-primary">{{ stat[0] }}</p>
          <p class="text-[10px] text-gray-400 font-semibold mt-0.5">{{ stat[1] }}</p>
        </div>
      </div>
    </div>

    <!-- Menu groups -->
    <div
      v-for="(group, gi) in menuGroups"
      :key="gi"
      class="bg-white rounded-2xl overflow-hidden mb-3"
      style="box-shadow: 0 2px 12px rgba(0,0,0,0.07)"
    >
      <div
        v-for="(item, ii) in group.items"
        :key="item.label"
        @click="handleClick(item.route)"
        :class="[
          'flex items-center justify-between px-4 py-3.5 btn-press',
          ii < group.items.length - 1 ? 'border-b border-gray-50' : '',
          item.route ? 'cursor-pointer' : 'cursor-default'
        ]"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">

            <!-- orders -->
            <svg v-if="item.icon === 'orders'" class="w-4 h-4 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                stroke-width="2" stroke-linecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke-width="2"/>
              <path d="M9 12h6M9 16h4" stroke-width="2" stroke-linecap="round"/>
            </svg>

            <!-- heart -->
            <svg v-else-if="item.icon === 'heart'" class="w-4 h-4 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke-width="2"/>
            </svg>

            <!-- coupon -->
            <svg v-else-if="item.icon === 'coupon'" class="w-4 h-4 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" stroke-width="2" stroke-linecap="round"/>
              <path d="M22 6H2v6h20V6z" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 6v12" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2"/>
            </svg>

            <!-- card -->
            <svg v-else-if="item.icon === 'card'" class="w-4 h-4 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="1" y="4" width="22" height="16" rx="2" stroke-width="2"/>
              <path d="M1 10h22" stroke-width="2"/>
            </svg>

            <!-- help -->
            <svg v-else-if="item.icon === 'help'" class="w-4 h-4 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke-width="2" stroke-linecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2" stroke-linecap="round"/>
            </svg>

          </div>
          <span class="text-sm font-bold text-gray-800">{{ item.label }}</span>
        </div>

        <svg class="w-4 h-4" :class="item.route ? 'text-gray-400' : 'text-gray-200'"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <!-- Logout -->
    <button class="w-full bg-red-50 text-red-500 font-black py-3.5 rounded-2xl mt-1 btn-press">
      Выйти из аккаунта
    </button>

  </div>
</template>