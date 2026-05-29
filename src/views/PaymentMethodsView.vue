<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'

const { navigate } = useRouter()
const { t } = useI18n()

const selectedMethod = ref(localStorage.getItem('bazar-payment') || 'card')

function selectMethod(id) {
  selectedMethod.value = id
  localStorage.setItem('bazar-payment', id)
}

const methods = [
  {
    id: 'card',
    emoji: '💳',
    labelKey: 'payment.card_title',
    descKey: 'payment.card_desc',
    color: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    id: 'cash',
    emoji: '💵',
    labelKey: 'payment.cash_title',
    descKey: 'payment.cash_desc',
    color: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
]
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('profile.payment_methods') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-4 flex flex-col gap-3">
      <div
        v-for="method in methods"
        :key="method.id"
        @click="selectMethod(method.id)"
        class="rounded-2xl p-4 btn-press transition-all"
        :style="{
          background: 'var(--surface)',
          boxShadow: selectedMethod === method.id ? '0 0 0 2px var(--primary), 0 2px 12px var(--shadow)' : '0 2px 12px var(--shadow)',
        }"
      >
        <div class="flex items-center gap-3">
          <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', method.color]">
            <span class="text-2xl">{{ method.emoji }}</span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ t(method.labelKey) }}</p>
            <p class="text-xs font-semibold mt-0.5" style="color: var(--text-tertiary)">{{ t(method.descKey) }}</p>
          </div>
          <div class="radio-outer" :class="{ active: selectedMethod === method.id }">
            <div v-if="selectedMethod === method.id" class="radio-inner"></div>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="rounded-2xl p-4 mt-2" style="background: var(--primary-light)">
        <div class="flex gap-3">
          <svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p class="text-xs font-semibold leading-relaxed" style="color: var(--text-primary)">{{ t('payment.info') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
