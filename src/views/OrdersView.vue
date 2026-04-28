<script setup>
// src/views/OrdersView.vue
import { ref } from 'vue'
import { useRouter } from '../router/index.js'

const { navigate } = useRouter()

const orders = ref([
  {
    id: '#ORD-1042',
    status: 'delivering',
    statusLabel: 'В пути',
    date: '25 апр, 2026',
    time: '14:32',
    arrivalMin: 12,
    address: 'Мустакиллик кчаси 52 уй',
    items: [
      { name: 'Яйца 10 штук', qty: 1, price: 20000 },
      { name: 'Кола зеро 0,5', qty: 2, price: 7000 },
      { name: 'Хлеб', qty: 1, price: 3000 },
    ],
    total: 37000,
    progress: 65,
  },
  {
    id: '#ORD-1041',
    status: 'preparing',
    statusLabel: 'Готовится',
    date: '25 апр, 2026',
    time: '14:10',
    arrivalMin: 25,
    address: 'Мустакиллик кчаси 52 уй',
    items: [
      { name: 'Орбит фреш', qty: 3, price: 5000 },
      { name: 'Сыр 200г', qty: 1, price: 25000 },
    ],
    total: 40000,
    progress: 30,
  },
  {
    id: '#ORD-1038',
    status: 'delivered',
    statusLabel: 'Доставлен',
    date: '24 апр, 2026',
    time: '11:15',
    arrivalMin: 0,
    address: 'Мустакиллик кчаси 52 уй',
    items: [
      { name: 'Молоко 1л', qty: 2, price: 12000 },
    ],
    total: 24000,
    progress: 100,
  },
])

function formatPrice(v) {
  return new Intl.NumberFormat('ru-RU').format(v) + ' сум'
}

const statusConfig = {
  preparing:  { color: '#f59e0b', bg: '#fef3c7', icon: '👨‍🍳', steps: ['Принят', 'Готовится', 'В пути', 'Доставлен'] },
  delivering: { color: '#2DB84B', bg: '#eaf8ee', icon: '🛵', steps: ['Принят', 'Готовится', 'В пути', 'Доставлен'] },
  delivered:  { color: '#6b7280', bg: '#f3f4f6', icon: '✅', steps: ['Принят', 'Готовится', 'В пути', 'Доставлен'] },
}

const activeStep = {
  preparing:  1,
  delivering: 2,
  delivered:  3,
}
</script>

<template>
  <div class="pb-28 pt-4 px-4">

    <!-- Title -->
    <h1 class="text-xl font-black text-gray-900 mb-4">Мои заказы</h1>

    <!-- Order cards -->
    <div class="flex flex-col gap-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-2xl overflow-hidden"
        style="box-shadow: 0 2px 14px rgba(0,0,0,0.07)"
      >
        <!-- Card header -->
        <div class="px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p class="text-sm font-black text-gray-900">{{ order.id }}</p>
            <p class="text-xs text-gray-400 font-semibold mt-0.5">{{ order.date }} · {{ order.time }}</p>
          </div>
          <!-- Status badge -->
          <div
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            :style="{ background: statusConfig[order.status].bg }"
          >
            <span class="text-sm">{{ statusConfig[order.status].icon }}</span>
            <span class="text-xs font-black" :style="{ color: statusConfig[order.status].color }">
              {{ order.statusLabel }}
            </span>
          </div>
        </div>

        <!-- Progress steps -->
        <div class="px-4 pb-3">
          <div class="flex items-center justify-between relative">
            <!-- Progress line background -->
            <div class="absolute top-3 left-3 right-3 h-0.5 bg-gray-100 z-0"></div>
            <!-- Progress line fill -->
            <div
              class="absolute top-3 left-3 h-0.5 z-0 transition-all duration-500"
              :style="{
                width: `calc(${(activeStep[order.status] / 3) * 100}% - 6px)`,
                background: statusConfig[order.status].color
              }"
            ></div>

            <!-- Step dots -->
            <div
              v-for="(step, i) in statusConfig[order.status].steps"
              :key="i"
              class="flex flex-col items-center z-10 gap-1"
            >
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                :style="{
                  background: i <= activeStep[order.status]
                    ? statusConfig[order.status].color
                    : '#f0f0f0',
                }"
              >
                <svg v-if="i <= activeStep[order.status]"
                  class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="text-[9px] font-bold text-center whitespace-nowrap"
                :style="{ color: i <= activeStep[order.status] ? statusConfig[order.status].color : '#9ca3af' }">
                {{ step }}
              </span>
            </div>
          </div>
        </div>

        <!-- Arrival time — только для активных заказов -->
        <div
          v-if="order.status !== 'delivered'"
          class="mx-4 mb-3 rounded-xl px-3 py-2.5 flex items-center gap-2"
          :style="{ background: statusConfig[order.status].bg }"
        >
          <span class="text-lg">⏱️</span>
          <div>
            <p class="text-[10px] text-gray-500 font-semibold">Ожидаемое прибытие</p>
            <p class="text-sm font-black" :style="{ color: statusConfig[order.status].color }">
              Примерно через {{ order.arrivalMin }} мин
            </p>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px bg-gray-50 mx-4"></div>

        <!-- Items -->
        <div class="px-4 py-3 flex flex-col gap-1.5">
          <div
            v-for="item in order.items"
            :key="item.name"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 flex items-center justify-center">
                {{ item.qty }}
              </span>
              <span class="text-xs font-semibold text-gray-700">{{ item.name }}</span>
            </div>
            <span class="text-xs font-bold text-gray-800">{{ formatPrice(item.price * item.qty) }}</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px bg-gray-50 mx-4"></div>

        <!-- Total + repeat button -->
        <div class="px-4 py-3 flex items-center justify-between">
          <div>
            <p class="text-[10px] text-gray-400 font-semibold">Итого</p>
            <p class="text-sm font-black text-gray-900">{{ formatPrice(order.total) }}</p>
          </div>
          <button
            v-if="order.status === 'delivered'"
            @click="navigate('home')"
            class="text-xs font-black text-primary border border-primary px-4 py-2 rounded-xl btn-press"
          >
            🔄 Повторить
          </button>
          <button
            v-else
            @click="navigate('checkout')"
            class="text-xs font-black text-white px-4 py-2 rounded-xl btn-press"
            style="background: #2DB84B; box-shadow: 0 3px 10px rgba(45,184,75,0.35)"
          >
            📍 Отследить
          </button>
        </div>

      </div>
    </div>

    <!-- Empty state если нет заказов -->
    <div v-if="orders.length === 0" class="flex flex-col items-center justify-center py-24">
      <div class="text-7xl mb-5">📦</div>
      <p class="text-xl font-black text-gray-700">Нет заказов</p>
      <p class="text-sm text-gray-400 text-center mt-2">Ваши заказы появятся здесь</p>
      <button
        @click="navigate('home')"
        class="mt-6 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press"
        style="box-shadow: 0 4px 16px rgba(45,184,75,0.35)"
      >В каталог</button>
    </div>

  </div>
</template>