<script setup>
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'

const { navigate } = useRouter()
const { t } = useI18n()

const coupons = [
  { id: 1, code: 'WELCOME20', discount: '20%', descKey: 'coupons.desc_first_order', expires: '2026-05-15', active: true },
  { id: 2, code: 'DAIRY10', discount: '10%', descKey: 'coupons.desc_dairy', expires: '2026-05-01', active: true },
  { id: 3, code: 'FREE_DELIVERY', discount: '100%', descKey: 'coupons.desc_free_delivery', expires: '2026-04-20', active: false },
]
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('coupons.title') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-4 flex flex-col gap-3">
      <div v-for="coupon in coupons" :key="coupon.id" class="rounded-2xl overflow-hidden"
        :style="{ background: 'var(--surface)', boxShadow: '0 2px 12px var(--shadow)', opacity: coupon.active ? 1 : 0.5 }">
        <div class="flex">
          <div class="w-2 flex-shrink-0" :style="{ background: coupon.active ? 'var(--primary)' : 'var(--surface-tertiary)' }"></div>
          <div class="flex-1 p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-lg font-black text-primary">{{ coupon.discount }}</span>
              <span v-if="!coupon.active" class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500">{{ t('coupons.expired') }}</span>
            </div>
            <p class="text-sm font-bold" style="color: var(--text-primary)">{{ t(coupon.descKey) }}</p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-[10px] font-black px-2 py-1 rounded-lg" style="background: var(--surface-secondary); color: var(--text-secondary)">{{ coupon.code }}</span>
              <span class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('coupons.valid_until') }} {{ coupon.expires }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Enter promo code -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-sm font-black mb-2" style="color: var(--text-primary)">{{ t('coupons.have_code') }}</p>
        <div class="flex gap-2">
          <input :placeholder="t('coupons.enter_code')" class="flex-1 text-sm font-bold px-4 py-2.5 rounded-xl outline-none" style="background: var(--surface-secondary); color: var(--text-primary)" />
          <button class="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-black btn-press">{{ t('coupons.apply') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
