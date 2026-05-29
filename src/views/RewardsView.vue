<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'
import { getReferral, getReferralList, getRewards, applyReferral } from '../services/api.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { isLoggedIn } = useAuth()

const referralCode = ref('')
const referralLink = ref('')
const totalReferrals = ref(0)
const totalRewards = ref('')
const rewardInfo = ref(null)
const rewards = ref([])
const referrals = ref([])
const isLoading = ref(true)
const referralCopied = ref(false)
const applyCode = ref('')
const applyError = ref('')
const applySuccess = ref(false)

onMounted(async () => {
  if (!isLoggedIn.value) { isLoading.value = false; return }
  try {
    const [refData, rewardsData, refListData] = await Promise.allSettled([
      getReferral(),
      getRewards(),
      getReferralList(),
    ])
    if (refData.status === 'fulfilled') {
      referralCode.value = refData.value.referral_code || ''
      referralLink.value = refData.value.referral_link || ''
      totalReferrals.value = refData.value.total_referrals || 0
      totalRewards.value = refData.value.total_rewards || '0'
      rewardInfo.value = refData.value.reward_info || null
    }
    if (rewardsData.status === 'fulfilled') {
      rewards.value = rewardsData.value
    }
    if (refListData.status === 'fulfilled') {
      const list = refListData.value
      referrals.value = list.items || list || []
    }
  } catch {}
  isLoading.value = false
})

function copyCode() {
  navigator.clipboard?.writeText(referralCode.value)
  referralCopied.value = true
  setTimeout(() => { referralCopied.value = false }, 2000)
}

function shareLink() {
  if (navigator.share) {
    navigator.share({ text: referralLink.value })
  } else {
    navigator.clipboard?.writeText(referralLink.value)
    referralCopied.value = true
    setTimeout(() => { referralCopied.value = false }, 2000)
  }
}

async function handleApply() {
  if (!applyCode.value.trim()) return
  applyError.value = ''
  try {
    await applyReferral(applyCode.value.trim())
    applySuccess.value = true
  } catch (e) {
    applyError.value = e.message || t('referral.apply_error')
  }
}
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg width="20" height="20" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('referral.page_title') }}</p>
      <div class="w-9"></div>
    </div>

    <div v-if="isLoading" class="px-4 mt-4 flex flex-col gap-3">
      <div class="skeleton h-[160px] rounded-2xl"></div>
      <div class="skeleton h-[100px] rounded-2xl"></div>
    </div>

    <div v-else class="px-4 mt-4 flex flex-col gap-3">
      <!-- My referral code -->
      <div v-if="referralCode" class="rounded-2xl p-5" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); box-shadow: 0 4px 20px var(--primary-glow)">
        <p class="text-white/80 text-xs font-semibold mb-1">{{ t('referral.your_code') }}</p>
        <div class="flex items-center gap-3 mb-3">
          <p class="text-white text-2xl font-black tracking-wider flex-1">{{ referralCode }}</p>
          <button @click="copyCode" class="px-3 py-1.5 rounded-xl btn-press text-xs font-black transition-all"
            :style="{ background: referralCopied ? 'white' : 'rgba(255,255,255,0.2)', color: referralCopied ? 'var(--primary)' : 'white' }">
            {{ referralCopied ? t('referral.copied') : t('referral.copy') }}
          </button>
        </div>

        <!-- What friends get -->
        <div v-if="rewardInfo" class="bg-white/10 rounded-xl p-3 mb-3">
          <p class="text-white/80 text-[10px] font-semibold mb-1">{{ t('referral.friend_gets') }}</p>
          <p class="text-white text-sm font-black">{{ rewardInfo.name }}</p>
        </div>

        <!-- Stats -->
        <div class="flex gap-4">
          <div>
            <p class="text-white text-xl font-black">{{ totalReferrals }}</p>
            <p class="text-white/60 text-[10px] font-semibold">{{ t('referral.invited') }}</p>
          </div>
          <div>
            <p class="text-white text-xl font-black">{{ totalRewards }}</p>
            <p class="text-white/60 text-[10px] font-semibold">{{ t('referral.earned') }}</p>
          </div>
        </div>

        <button @click="shareLink" class="w-full mt-3 py-2.5 rounded-xl bg-white/20 text-white text-xs font-black btn-press flex items-center justify-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ t('referral.share') }}
        </button>
      </div>

      <!-- My rewards -->
      <div v-if="rewards.length" class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-sm font-black mb-3" style="color: var(--text-primary)">{{ t('referral.my_rewards') }}</p>
        <div class="flex flex-col gap-2">
          <div v-for="reward in rewards" :key="reward.id" class="flex items-center gap-3 p-3 rounded-xl" style="background: var(--surface-secondary)">
            <!-- Coupon -->
            <template v-if="reward.type === 'coupon'">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
                <svg width="20" height="20" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6M22 6H2v6h20V6z" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-black" style="color: var(--text-primary)">{{ t('referral.reward_coupon') }}</p>
                <p class="text-[10px] font-bold font-mono" style="color: var(--text-secondary)">{{ reward.coupon_code }}</p>
              </div>
            </template>

            <!-- Free delivery -->
            <template v-else-if="reward.type === 'free_delivery'">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10">
                <svg width="20" height="20" class="text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2" stroke-width="2"/><path d="M16 8h4l3 5v5h-7V8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke-width="2"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-black" style="color: var(--text-primary)">{{ t('referral.reward_free_delivery') }}</p>
                <p class="text-[10px] font-semibold" style="color: var(--text-secondary)">{{ t('referral.deliveries_remaining', { count: reward.free_deliveries_remaining }) }}</p>
              </div>
            </template>

            <!-- Bonus product -->
            <template v-else-if="reward.type === 'bonus_product'">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-500/10">
                <svg width="20" height="20" class="text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-black" style="color: var(--text-primary)">{{ t('referral.reward_bonus') }}</p>
                <p class="text-[10px] font-semibold" style="color: var(--text-secondary)">{{ reward.product_name }} × {{ reward.bonus_quantity }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Referral list -->
      <div v-if="referrals.length" class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-sm font-black mb-3" style="color: var(--text-primary)">{{ t('referral.invited_friends') }}</p>
        <div class="flex flex-col gap-2">
          <div v-for="ref in referrals" :key="ref.id" class="flex items-center justify-between py-2 border-b" style="border-color: var(--border)">
            <div>
              <p class="text-xs font-bold" style="color: var(--text-primary)">{{ ref.referred_name }}</p>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ ref.created_at?.split('T')[0] }}</p>
            </div>
            <span :class="['text-[10px] font-black px-2 py-0.5 rounded-lg', ref.is_rewarded ? 'text-primary' : 'text-orange-500']"
              :style="{ background: ref.is_rewarded ? 'var(--primary-light)' : 'rgba(249,115,22,0.1)' }">
              {{ ref.is_rewarded ? t('referral.rewarded') : t('referral.pending') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Apply someone's code -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-sm font-black mb-2" style="color: var(--text-primary)">{{ t('referral.apply_title') }}</p>
        <div v-if="!applySuccess" class="flex gap-2">
          <input v-model="applyCode" :placeholder="t('referral.apply_placeholder')"
            class="flex-1 text-sm font-bold px-3 py-2.5 rounded-xl outline-none"
            style="background: var(--surface-secondary); color: var(--text-primary)" />
          <button @click="handleApply" class="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black btn-press">
            {{ t('coupons.apply') }}
          </button>
        </div>
        <p v-if="applySuccess" class="text-xs font-bold text-primary">✅ {{ t('referral.apply_success') }}</p>
        <p v-if="applyError" class="text-xs font-bold text-red-500 mt-1">{{ applyError }}</p>
      </div>
    </div>
  </div>
</template>
