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
  { id: 'card', labelKey: 'payment.card_title', descKey: 'payment.card_desc' },
  { id: 'cash', labelKey: 'payment.cash_title', descKey: 'payment.cash_desc' },
]
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">
    <!-- Editorial header -->
    <div class="px-5 pt-5 pb-3">
      <button @click="navigate('profile')" class="flex items-center gap-2 btn-press mb-3">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="eyebrow-sm">{{ t('ed.profile_word') }}</span>
      </button>
      <div class="flex items-center gap-2 mb-2">
        <span class="num-label text-[11px] tabular">§</span>
        <p class="eyebrow-sm">{{ t('ed.payment_section') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.your_methods_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.methods_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div class="px-5 mt-5">
      <div class="flex flex-col">
        <button v-for="method in methods" :key="method.id" @click="selectMethod(method.id)"
          class="method-row btn-press">
          <div class="radio-outer" :class="{ active: selectedMethod === method.id }">
            <div v-if="selectedMethod === method.id" class="radio-inner"></div>
          </div>
          <div class="flex-1 text-left">
            <p class="serif text-[17px]" style="color: var(--text-primary); font-weight: 500">{{ t(method.labelKey) }}</p>
            <p class="text-[12px] mt-0.5" style="color: var(--text-tertiary)">{{ t(method.descKey) }}</p>
          </div>
        </button>
      </div>

      <div class="mt-10 rule-center">
        <span class="num-label text-[10px]">·  ·  ·</span>
      </div>
      <p class="mt-4 serif-italic text-[13px] text-center" style="color: var(--text-tertiary); line-height: 1.6">
        {{ t('payment.info') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.method-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.method-row:first-child {
  border-top: 1px solid var(--hairline);
}
</style>
