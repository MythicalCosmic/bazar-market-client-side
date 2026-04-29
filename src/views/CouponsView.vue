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
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('coupons.title') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-4 flex flex-col gap-3">
      <!-- Enter promo code -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-sm font-black mb-2" style="color: var(--text-primary)">{{ t('coupons.have_code') }}</p>
        <div class="flex gap-2">
          <input v-model="promoCode" :placeholder="t('coupons.enter_code')"
            class="flex-1 text-sm font-bold px-4 py-2.5 rounded-xl outline-none"
            style="background: var(--surface-secondary); color: var(--text-primary)"
            @keyup.enter="handleValidate" />
          <button @click="handleValidate" :disabled="isValidating"
            class="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-black btn-press transition-opacity"
            :class="{ 'opacity-60': isValidating }">
            {{ isValidating ? '...' : t('coupons.apply') }}
          </button>
        </div>

        <!-- Validation result -->
        <div v-if="validationResult" class="mt-3 p-3 rounded-xl" style="background: var(--primary-light)">
          <div class="flex items-center gap-2">
            <span class="text-lg">✅</span>
            <div>
              <p class="text-sm font-black text-primary">
                {{ validationResult.type === 'percent' ? validationResult.value + '%' : validationResult.value }} {{ t('cart.discount') }}
              </p>
              <p class="text-[10px] font-semibold" style="color: var(--text-secondary)">
                {{ t('coupons.saves') }} {{ validationResult.discount_amount }} {{ t('currency') }}
              </p>
            </div>
          </div>
        </div>

        <p v-if="validationError" class="text-xs font-bold text-red-500 mt-2">{{ validationError }}</p>
      </div>

      <!-- Info -->
      <div class="rounded-2xl p-4" style="background: var(--primary-light)">
        <div class="flex gap-3">
          <svg width="20" height="20" class="text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p class="text-xs font-semibold leading-relaxed" style="color: var(--text-primary)">{{ t('payment.info') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
