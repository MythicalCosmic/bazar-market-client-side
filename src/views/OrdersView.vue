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

const statusColors = {
  pending: 'var(--saffron)',
  confirmed: 'var(--primary)',
  preparing: 'var(--saffron)',
  delivering: 'var(--primary-mid)',
  delivered: 'var(--text-tertiary)',
  completed: 'var(--text-tertiary)',
  cancelled: 'var(--bordeaux)',
}

const activeStep = {
  pending: 0, confirmed: 1, preparing: 1, delivering: 2, delivered: 3, completed: 3, cancelled: -1,
}

const steps = ['orders.status.accepted', 'orders.status.preparing', 'orders.status.on_way', 'orders.status.delivered']

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
  <div class="pb-28" style="background: var(--bg-app); min-height: 100vh">
    <!-- Editorial header -->
    <div class="px-5 pt-5 pb-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="num-label text-[11px] tabular">№ {{ String(orders.length || 0).padStart(2, '0') }}</span>
        <span class="block w-4 h-px" style="background: var(--hairline)"></span>
        <p class="eyebrow-sm">{{ t('ed.archive') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.your_orders_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.orders_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div v-if="isLoading" class="px-5 mt-5 flex flex-col gap-4">
      <div v-for="i in 2" :key="i" class="skeleton h-[200px]"></div>
    </div>

    <div v-else-if="orders.length" class="mt-5 flex flex-col gap-4 px-5">
      <article v-for="order in orders" :key="order.id" class="order-card">
        <!-- Order header -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="eyebrow-sm mb-1">{{ order.date }} · {{ order.time }}</p>
            <p class="serif text-[18px] tabular" style="color: var(--text-primary); font-weight: 500">№ {{ order.id }}</p>
          </div>
          <div class="status-badge" :style="{ color: statusColors[order.status] || 'var(--text-tertiary)', borderColor: statusColors[order.status] || 'var(--hairline)' }">
            <span class="eyebrow-sm">{{ t('orders.status_label.' + order.status) || order.status }}</span>
          </div>
        </div>

        <!-- Progress -->
        <div v-if="order.status !== 'cancelled'" class="mb-4">
          <div class="progress-row">
            <div class="progress-line" :style="{ width: `${(activeStep[order.status] / 3) * 100}%`, background: statusColors[order.status] || 'var(--text-primary)' }"></div>
            <div v-for="(stepKey, i) in steps" :key="i" class="step">
              <div class="step-dot" :style="{ background: i <= activeStep[order.status] ? (statusColors[order.status] || 'var(--text-primary)') : 'var(--surface-tertiary)' }"></div>
              <span class="step-label" :style="{ color: i <= activeStep[order.status] ? (statusColors[order.status] || 'var(--text-primary)') : 'var(--text-tertiary)' }">{{ t(stepKey) }}</span>
            </div>
          </div>
        </div>

        <div class="hairline mb-3"></div>

        <!-- Items -->
        <div class="flex flex-col gap-2 mb-3">
          <div v-for="(item, idx) in order.items" :key="idx" class="flex items-baseline justify-between">
            <div class="flex items-baseline gap-2 min-w-0">
              <span class="num-label text-[10px] flex-shrink-0">× {{ item.qty }}</span>
              <span class="serif text-[13.5px] truncate" style="color: var(--text-primary); font-weight: 500">{{ getLocalizedName(item.name) }}</span>
            </div>
            <span class="serif text-[13.5px] tabular flex-shrink-0 ml-3" style="color: var(--text-primary); font-weight: 500">{{ formatPrice(item.price * item.qty) }}</span>
          </div>
        </div>

        <div class="hairline mb-3"></div>

        <!-- Footer -->
        <div class="flex items-center justify-between">
          <div>
            <p class="eyebrow-sm mb-0.5">{{ t('orders.total') }}</p>
            <p class="serif text-[20px] tabular" style="color: var(--text-primary); font-weight: 500; letter-spacing: -0.02em">{{ formatPrice(order.total) }}</p>
          </div>
          <div class="flex gap-2">
            <button v-if="order.status === 'pending'" @click="handleCancel(order)" class="action-btn action-btn-danger btn-press">
              <span class="eyebrow-sm" style="color: var(--bordeaux)">{{ t('orders.cancel') }}</span>
            </button>
            <button v-if="['delivered', 'completed'].includes(order.status)" @click="handleReorder(order)" class="action-btn btn-press">
              <span class="eyebrow-sm">{{ t('orders.repeat') }}</span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <div v-else class="px-8 pt-12 text-center">
      <p class="num-label text-[14px] mb-3">— № 00 —</p>
      <h2 class="display text-[24px] mb-2" style="color: var(--text-primary)">{{ t('orders.empty_title') }}</h2>
      <p class="serif-italic text-[14px] leading-relaxed mb-6" style="color: var(--text-secondary)">{{ t('orders.empty_subtitle') }}</p>
      <button @click="navigate('home')" class="empty-cta btn-press">
        <span class="eyebrow-sm" style="color: var(--cream)">{{ t('common.go_catalog') }}</span>
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--cream)">
          <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.order-card {
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--hairline);
}

.status-badge {
  padding: 5px 10px;
  border: 1px solid currentColor;
  border-radius: 2px;
  white-space: nowrap;
  flex-shrink: 0;
}
.status-badge .eyebrow-sm {
  letter-spacing: 0.16em;
  font-size: 8.5px;
}

/* Progress */
.progress-row {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
}
.progress-row::before {
  content: '';
  position: absolute;
  top: 13px;
  left: 6px;
  right: 6px;
  height: 1px;
  background: var(--hairline);
  z-index: 0;
}
.progress-line {
  position: absolute;
  top: 13px;
  left: 6px;
  height: 1px;
  transition: width 0.5s ease;
  z-index: 1;
}
.step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 2;
}
.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-app);
  transition: background 0.3s ease;
}
.step-label {
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.action-btn {
  padding: 8px 14px;
  background: transparent;
  border: 1px solid var(--hairline);
  cursor: pointer;
}
.action-btn-danger {
  border-color: var(--bordeaux);
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}
</style>
