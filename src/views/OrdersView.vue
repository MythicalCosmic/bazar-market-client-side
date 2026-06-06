<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useI18n } from '../i18n/index.js'
import { getOrders, cancelOrder, reorderOrder } from '../services/api.js'
import { SUPPORT_PHONE, SUPPORT_PHONE_HREF } from '../config.js'

const { navigate } = useRouter()
const { formatPrice } = useFormat()
const { t, getLocalizedName } = useI18n()

const supportPhone = SUPPORT_PHONE
const supportPhoneHref = SUPPORT_PHONE_HREF

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
  delivering: { color: '#059669', icon: '🛵' },
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

// i18n t() returns the key itself when a translation is missing, so a plain
// `t(key) || status` fallback never fires. Detect the miss explicitly and fall
// back to the raw status string for any value the backend adds later.
function statusLabel(status) {
  const key = 'orders.status_label.' + status
  const label = t(key)
  return label === key ? status : label
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
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-black" style="color: var(--text-primary)">{{ t('orders.title') }}</h1>
      <button @click="navigate('support')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-press"
        style="background: var(--primary-light)">
        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-xs font-black text-primary">{{ t('orders.help_center') }}</span>
      </button>
    </div>

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
              {{ statusLabel(order.status) }}
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

    <!-- Customer support -->
    <div v-if="!isLoading" class="mt-6 rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 14px var(--shadow)">
      <p class="px-4 pt-4 pb-1 text-sm font-black" style="color: var(--text-primary)">{{ t('orders.support_title') }}</p>
      <p class="px-4 pb-2 text-xs font-semibold" style="color: var(--text-tertiary)">{{ t('orders.support_subtitle') }}</p>

      <!-- Help center (FAQ / questions) -->
      <button @click="navigate('support')" class="w-full flex items-center gap-3 px-4 py-3.5 btn-press text-left border-t" :style="{ borderColor: 'var(--border)' }">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="17" x2="12" y2="17" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-xs font-bold" style="color: var(--text-primary)">{{ t('orders.help_center') }}</p>
          <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('orders.help_center_sub') }}</p>
        </div>
        <svg class="w-4 h-4" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/></svg>
      </button>

      <!-- Delivery phone -->
      <a :href="supportPhoneHref" class="w-full flex items-center gap-3 px-4 py-3.5 btn-press text-left border-t" :style="{ borderColor: 'var(--border)' }">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-xs font-bold" style="color: var(--text-primary)">{{ t('orders.delivery_phone') }}</p>
          <p class="text-[10px] font-bold" style="color: var(--text-tertiary)">{{ supportPhone }}</p>
        </div>
        <svg class="w-4 h-4" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/></svg>
      </a>
    </div>
  </div>
</template>
