<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { validateCoupon } from '../services/api.js'

const { navigate } = useRouter()
const { t } = useI18n()

const promoCode = ref('')
const validationResult = ref(null)
const validationError = ref('')
const isValidating = ref(false)

async function handleValidate() {
  if (!promoCode.value.trim()) return
  validationError.value = ''
  validationResult.value = null
  isValidating.value = true
  try {
    const data = await validateCoupon(promoCode.value.trim(), 100000)
    validationResult.value = data
  } catch (e) {
    validationError.value = e.message || t('coupons.invalid')
  } finally {
    isValidating.value = false
  }
}
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
        <p class="eyebrow-sm">{{ t('ed.discounts_label') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.your_coupons_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.coupons_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div class="px-5 mt-5">
      <!-- Enter promo code -->
      <div class="flex items-center gap-2 mb-3">
        <span class="num-label text-[11px] tabular">01</span>
        <p class="eyebrow-sm">{{ t('coupons.have_code') }}</p>
      </div>
      <div class="hairline mb-3"></div>

      <div class="flex border" :style="{ borderColor: 'var(--hairline)' }">
        <input v-model="promoCode" :placeholder="t('coupons.enter_code')"
          class="flex-1 promo-input"
          @keyup.enter="handleValidate" />
        <button @click="handleValidate" :disabled="isValidating"
          class="promo-apply btn-press"
          :class="{ 'opacity-50': isValidating }">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ isValidating ? '...' : t('coupons.apply') }}</span>
        </button>
      </div>

      <!-- Result -->
      <div v-if="validationResult" class="mt-4 result-card">
        <div class="flex items-center gap-3">
          <span class="num-label text-[18px]">✓</span>
          <div>
            <p class="serif text-[18px]" style="color: var(--text-primary); font-weight: 500">
              {{ validationResult.type === 'percent' ? validationResult.value + '%' : validationResult.value }} {{ t('cart.discount') }}
            </p>
            <p class="serif-italic text-[12.5px] mt-0.5" style="color: var(--text-secondary)">
              {{ t('coupons.saves') }} {{ validationResult.discount_amount }} {{ t('currency') }}
            </p>
          </div>
        </div>
      </div>

      <p v-if="validationError" class="serif-italic text-[13px] mt-3" style="color: var(--bordeaux)">{{ validationError }}</p>

      <!-- Editorial note -->
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
.promo-input {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 13px 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--surface);
  color: var(--text-primary);
  border: none;
  outline: none;
}

.promo-apply {
  padding: 0 18px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}

.result-card {
  padding: 18px 20px;
  background: var(--primary-tint);
  border: 1px solid var(--primary);
}
</style>
