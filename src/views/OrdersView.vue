<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'
import { getOrders, cancelOrder, reorderOrder } from '../services/api.js'

const { navigate } = useRouter()
const { formatPrice } = useFormat()
const { t, getLocalizedName } = useI18n()

const orders = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    orders.value = await getOrders()
  } catch {}
  isLoading.value = false
})

const statusConfig = {
  pending:    { color: '#f59e0b', icon: '⏳' },
  confirmed:  { color: '#3b82f6', icon: '✅' },
  preparing:  { color: '#f59e0b', icon: '👨‍🍳' },
  delivering: { color: '#2DB84B', icon: '🛵' },
  delivered:  { color: '#6b7280', icon: '📦' },
  completed:  { color: '#6b7280', icon: '✅' },
  cancelled:  { color: '#ef4444', icon: '❌' },
}

const activeStep = {
  pending: 0, confirmed: 1, preparing: 1, delivering: 2, delivered: 3, completed: 3, cancelled: -1,
}

const steps = ['orders.status.accepted', 'orders.status.preparing', 'orders.status.on_way', 'orders.status.delivered']

function getConfig(status) {
  return statusConfig[status] || statusConfig.pending
}

async function handleCancel(order) {
  try {
    await cancelOrder(order.orderId)
    order.status = 'cancelled'
  } catch {}
}

async function handleReorder(order) {
  try {
    await reorderOrder(order.orderId)
    navigate('cart')
  } catch {}
}
</script>

<template>
  <div class="pb-28 pt-4 px-4">
    <h1 class="text-xl font-black mb-4" style="color: var(--text-primary)">{{ t('orders.title') }}</h1>

    <div v-if="isLoading" class="flex flex-col gap-4">
      <div v-for="i in 2" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-for="order in orders" :key="order.id" class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 14px var(--shadow)">
        <div class="px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ order.id }}</p>
            <p class="text-xs font-semibold mt-0.5" style="color: var(--text-tertiary)">{{ order.date }} · {{ order.time }}</p>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style="background: var(--primary-light)">
            <span class="text-sm">{{ getConfig(order.status).icon }}</span>
            <span class="text-xs font-black" :style="{ color: getConfig(order.status).color }">
              {{ t('orders.status_label.' + order.status) || order.status }}
            </span>
          </div>
        </div>

        <!-- Progress (only for non-cancelled) -->
        <div v-if="order.status !== 'cancelled'" class="px-4 pb-3">
          <div class="flex items-center justify-between relative">
            <div class="absolute top-3 left-3 right-3 h-0.5 z-0" style="background: var(--surface-tertiary)"></div>
            <div class="absolute top-3 left-3 h-0.5 z-0 transition-all duration-500"
              :style="{ width: `calc(${(activeStep[order.status] / 3) * 100}% - 6px)`, background: getConfig(order.status).color }"></div>
            <div v-for="(stepKey, i) in steps" :key="i" class="flex flex-col items-center z-10 gap-1">
              <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                :style="{ background: i <= activeStep[order.status] ? getConfig(order.status).color : 'var(--surface-tertiary)' }">
                <svg v-if="i <= activeStep[order.status]" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="text-[9px] font-bold text-center whitespace-nowrap"
                :style="{ color: i <= activeStep[order.status] ? getConfig(order.status).color : 'var(--text-tertiary)' }">{{ t(stepKey) }}</span>
            </div>
          </div>
        </div>

        <div class="h-px mx-4" style="background: var(--border)"></div>

        <div class="px-4 py-3 flex flex-col gap-1.5">
          <div v-for="(item, idx) in order.items" :key="idx" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center" style="background: var(--surface-secondary); color: var(--text-secondary)">{{ item.qty }}</span>
              <span class="text-xs font-semibold" style="color: var(--text-primary)">{{ getLocalizedName(item.name) }}</span>
            </div>
            <span class="text-xs font-bold" style="color: var(--text-primary)">{{ formatPrice(item.price * item.qty) }}</span>
          </div>
        </div>

        <div class="h-px mx-4" style="background: var(--border)"></div>

        <div class="px-4 py-3 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('orders.total') }}</p>
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ formatPrice(order.total) }}</p>
          </div>
          <div class="flex gap-2">
            <button v-if="order.status === 'pending'" @click="handleCancel(order)"
              class="text-xs font-black text-red-500 border border-red-500 px-3 py-2 rounded-xl btn-press">
              {{ t('orders.cancel') }}
            </button>
            <button v-if="['delivered', 'completed'].includes(order.status)" @click="handleReorder(order)"
              class="text-xs font-black text-primary border border-primary px-4 py-2 rounded-xl btn-press">
              🔄 {{ t('orders.repeat') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isLoading && orders.length === 0" class="flex flex-col items-center justify-center py-24">
      <div class="text-7xl mb-5">📦</div>
      <p class="text-xl font-black" style="color: var(--text-primary)">{{ t('orders.empty_title') }}</p>
      <p class="text-sm font-semibold mt-2 text-center" style="color: var(--text-tertiary)">{{ t('orders.empty_subtitle') }}</p>
      <button @click="navigate('home')" class="mt-6 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press" style="box-shadow: 0 4px 16px var(--primary-glow)">{{ t('common.go_catalog') }}</button>
    </div>
  </div>
</template>
