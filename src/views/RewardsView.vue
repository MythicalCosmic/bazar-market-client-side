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
    if (rewardsData.status === 'fulfilled') rewards.value = rewardsData.value
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
        <p class="eyebrow-sm">{{ t('ed.invite_earn') }}</p>
      </div>
      <h1 class="display text-[32px]" style="color: var(--text-primary)">
        {{ t('ed.refer_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.refer_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div v-if="isLoading" class="px-5 mt-5">
      <div class="skeleton h-[220px] mb-4"></div>
      <div class="skeleton h-[100px]"></div>
    </div>

    <div v-else class="px-5 mt-5 flex flex-col gap-7">
      <!-- Referral code -->
      <section v-if="referralCode" class="referral-feature">
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular" style="color: var(--saffron)">01</span>
          <p class="eyebrow-sm" style="color: var(--cream); opacity: 0.7">{{ t('referral.your_code') }}</p>
        </div>

        <p class="serif text-[42px] tabular leading-none" style="color: var(--cream); font-weight: 500; letter-spacing: 0.05em">{{ referralCode }}</p>

        <p v-if="rewardInfo" class="serif-italic text-[14px] mt-3" style="color: var(--cream); opacity: 0.8">
          {{ rewardInfo.name }}
        </p>

        <div class="referral-divider"></div>

        <!-- Stats -->
        <div class="flex gap-8 mb-4">
          <div>
            <p class="serif text-[28px] tabular leading-none" style="color: var(--cream); font-weight: 500">{{ totalReferrals }}</p>
            <p class="eyebrow-sm mt-1" style="color: var(--cream); opacity: 0.6">{{ t('referral.invited') }}</p>
          </div>
          <div>
            <p class="serif text-[28px] tabular leading-none" style="color: var(--cream); font-weight: 500">{{ totalRewards }}</p>
            <p class="eyebrow-sm mt-1" style="color: var(--cream); opacity: 0.6">{{ t('referral.earned') }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="copyCode" class="referral-action btn-press">
            <span class="eyebrow-sm">{{ referralCopied ? t('referral.copied') : t('referral.copy') }}</span>
          </button>
          <button @click="shareLink" class="referral-action referral-action-light btn-press">
            <span class="eyebrow-sm" style="color: var(--cream)">{{ t('referral.share') }}</span>
          </button>
        </div>
      </section>

      <!-- My rewards -->
      <section v-if="rewards.length">
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">02</span>
          <p class="eyebrow-sm">{{ t('referral.my_rewards') }}</p>
        </div>
        <div class="hairline mb-1"></div>
        <div class="flex flex-col">
          <div v-for="reward in rewards" :key="reward.id" class="reward-row">
            <span class="num-label text-[12px] flex-shrink-0">→</span>
            <div class="flex-1 min-w-0">
              <p class="serif text-[15px]" style="color: var(--text-primary); font-weight: 500">
                <template v-if="reward.type === 'coupon'">{{ t('referral.reward_coupon') }}</template>
                <template v-else-if="reward.type === 'free_delivery'">{{ t('referral.reward_free_delivery') }}</template>
                <template v-else-if="reward.type === 'bonus_product'">{{ t('referral.reward_bonus') }}</template>
              </p>
              <p class="text-[11.5px] mt-0.5 tabular" style="color: var(--text-tertiary)">
                <template v-if="reward.type === 'coupon'">{{ reward.coupon_code }}</template>
                <template v-else-if="reward.type === 'free_delivery'">{{ t('referral.deliveries_remaining', { count: reward.free_deliveries_remaining }) }}</template>
                <template v-else-if="reward.type === 'bonus_product'">{{ reward.product_name }} × {{ reward.bonus_quantity }}</template>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Friends -->
      <section v-if="referrals.length">
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">03</span>
          <p class="eyebrow-sm">{{ t('referral.invited_friends') }}</p>
        </div>
        <div class="hairline mb-1"></div>
        <div v-for="ref in referrals" :key="ref.id" class="friend-row">
          <div>
            <p class="serif text-[14.5px]" style="color: var(--text-primary); font-weight: 500">{{ ref.referred_name }}</p>
            <p class="text-[10.5px] tabular" style="color: var(--text-tertiary)">{{ ref.created_at?.split('T')[0] }}</p>
          </div>
          <span class="eyebrow-sm" :style="{ color: ref.is_rewarded ? 'var(--primary)' : 'var(--saffron)' }">
            {{ ref.is_rewarded ? t('referral.rewarded') : t('referral.pending') }}
          </span>
        </div>
      </section>

      <!-- Apply someone's code -->
      <section>
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">{{ referrals.length ? '04' : (rewards.length ? '03' : '02') }}</span>
          <p class="eyebrow-sm">{{ t('referral.apply_title') }}</p>
        </div>
        <div class="hairline mb-3"></div>
        <div v-if="!applySuccess" class="flex border" :style="{ borderColor: 'var(--hairline)' }">
          <input v-model="applyCode" :placeholder="t('referral.apply_placeholder')" class="apply-input" />
          <button @click="handleApply" class="apply-btn btn-press">
            <span class="eyebrow-sm" style="color: var(--cream)">{{ t('coupons.apply') }}</span>
          </button>
        </div>
        <p v-if="applySuccess" class="serif text-[14px]" style="color: var(--primary); font-weight: 500">✓ {{ t('referral.apply_success') }}</p>
        <p v-if="applyError" class="serif-italic text-[13px] mt-2" style="color: var(--bordeaux)">{{ applyError }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.referral-feature {
  background: #1A2620;
  padding: 28px 24px;
  position: relative;
}
.dark .referral-feature {
  background: #232B26;
  border: 1px solid rgba(245, 239, 227, 0.08);
}

.referral-divider {
  height: 1px;
  background: rgba(245, 239, 227, 0.18);
  margin: 22px 0 18px;
}

.referral-action {
  flex: 1;
  padding: 12px 0;
  background: #F5EFE3;
  border: none;
  cursor: pointer;
  text-align: center;
}
.referral-action span {
  color: #1A2620 !important;
}
.referral-action-light {
  background: transparent;
  border: 1px solid rgba(245, 239, 227, 0.4);
}
.referral-action-light span {
  color: #F5EFE3 !important;
}

.reward-row,
.friend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--hairline);
}
.friend-row {
  justify-content: space-between;
}

.apply-input {
  flex: 1;
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
.apply-btn {
  padding: 0 18px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}
</style>
