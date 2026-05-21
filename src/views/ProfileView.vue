<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'
import { useTelegram } from '../composables/useTelegram.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { getReferral, getOrders, getFavorites } from '../services/api.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { user, isLoggedIn, isVerified, isAuthenticated, updateProfile, logout } = useAuth()
const { user: tgUser, isAvailable: isTg, close: closeTg } = useTelegram()
const { count: favCount } = useFavorites()

const referralCode = ref('')
const totalReferrals = ref(0)
const referralCopied = ref(false)
const rewardInfo = ref(null)
const ordersCount = ref(0)
const favoritesCount = ref(0)

onMounted(async () => {
  if (!isLoggedIn.value) return
  try {
    const [referralData, ordersData, favData] = await Promise.allSettled([
      getReferral(),
      getOrders({ per_page: 1 }),
      getFavorites({ per_page: 1 }),
    ])
    if (referralData.status === 'fulfilled') {
      referralCode.value = referralData.value.referral_code || ''
      totalReferrals.value = referralData.value.total_referrals || 0
      rewardInfo.value = referralData.value.reward_info || null
    }
    if (ordersData.status === 'fulfilled') {
      const orders = ordersData.value
      ordersCount.value = Array.isArray(orders) ? orders.length : 0
    }
    if (favData.status === 'fulfilled') {
      favoritesCount.value = Array.isArray(favData.value) ? favData.value.length : 0
    }
  } catch {}
})

function copyReferral() {
  navigator.clipboard?.writeText(referralCode.value)
  referralCopied.value = true
  setTimeout(() => { referralCopied.value = false }, 2000)
}

const isEditing = ref(false)
const editFirstName = ref('')
const editLastName = ref('')
const showLogoutConfirm = ref(false)
const showPhone = ref(false)

const displayName = computed(() => {
  if (user.value) return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
  if (isTg && tgUser.first_name) return `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
  return t('profile.username')
})

const initials = computed(() => {
  const name = displayName.value || ''
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s.charAt(0).toUpperCase()).join('') || '·'
})

const maskedPhone = computed(() => {
  const phone = user.value?.phone || '+998 ** *** ** **'
  if (showPhone.value) return phone
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return phone
  return phone.slice(0, 6) + ' *** ** ' + phone.slice(-2)
})

function startEdit() {
  editFirstName.value = user.value?.firstName || ''
  editLastName.value = user.value?.lastName || ''
  isEditing.value = true
}

async function saveEdit() {
  await updateProfile({ firstName: editFirstName.value.trim(), lastName: editLastName.value.trim() })
  isEditing.value = false
}

function handleLogout() { showLogoutConfirm.value = true }

function confirmLogout() {
  logout()
  showLogoutConfirm.value = false
  if (isTg) closeTg()
  else navigate('home')
}

const menuGroups = [
  {
    titleKey: 'ed.account_section',
    items: [
      { labelKey: 'profile.my_orders', icon: 'orders', route: 'orders' },
      { labelKey: 'favorites.title', icon: 'heart', route: 'favorites' },
      { labelKey: 'addresses.title', icon: 'location', route: 'addresses' },
      { labelKey: 'coupons.title', icon: 'coupon', route: 'coupons' },
      { labelKey: 'profile.payment_methods', icon: 'card', route: 'payment-methods' },
    ],
  },
  {
    titleKey: 'ed.general_section',
    items: [
      { labelKey: 'profile.settings', icon: 'settings', route: 'settings' },
      { labelKey: 'support.title', icon: 'help', route: 'support' },
    ],
  },
]
</script>

<template>
  <div class="pb-32" style="background: var(--bg-app)">
    <!-- Editorial header -->
    <div class="px-5 pt-5 pb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="num-label text-[11px] tabular">{{ initials }}</span>
        <p class="eyebrow-sm">{{ t('ed.member') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.your_profile_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.profile_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <!-- Not logged in -->
    <div v-if="!isLoggedIn" class="px-5 mt-4">
      <div class="auth-warning">
        <div class="flex-1">
          <p class="eyebrow-sm mb-1" style="color: var(--terracotta)">— {{ t('ed.notice') }} —</p>
          <p class="serif text-[17px]" style="color: var(--text-primary); font-weight: 500;">{{ t('profile.not_verified') }}</p>
          <p class="serif-italic text-[12.5px] mt-1" style="color: var(--text-secondary)">{{ t('profile.verify_to_order') }}</p>
        </div>
        <button @click="navigate('login')" class="auth-cta btn-press">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ t('login.button') }}</span>
        </button>
      </div>
    </div>

    <!-- Profile head -->
    <div class="px-5 mt-5">
      <div class="profile-head">
        <!-- Avatar -->
        <div class="avatar">
          <img v-if="tgUser.photo_url" :src="tgUser.photo_url" class="w-full h-full object-cover" />
          <span v-else class="serif text-[28px]" style="color: var(--cream); font-weight: 500">{{ initials }}</span>
        </div>

        <!-- Info / Edit -->
        <div v-if="!isEditing" class="flex-1 min-w-0">
          <p class="eyebrow-sm mb-1">{{ user?.phone ? t('ed.member') : t('ed.guest') }}</p>
          <p class="serif text-[22px] truncate leading-tight" style="color: var(--text-primary); font-weight: 500">{{ displayName }}</p>
          <div class="flex items-center gap-1.5 mt-1">
            <p class="text-[12px] tabular" style="color: var(--text-tertiary)">{{ maskedPhone }}</p>
            <button v-if="isAuthenticated" @click="showPhone = !showPhone" class="btn-press">
              <svg v-if="!showPhone" width="11" height="11" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="11" height="11" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col gap-2">
          <input v-model="editFirstName" :placeholder="t('register.first_name')" class="edit-input" />
          <input v-model="editLastName" :placeholder="t('register.last_name')" class="edit-input" />
        </div>

        <!-- Edit / Save buttons -->
        <div v-if="!isEditing && isAuthenticated" class="flex-shrink-0">
          <button @click="startEdit" class="btn-press">
            <span class="eyebrow-sm">{{ t('profile.edit') }}</span>
          </button>
        </div>
        <div v-else-if="isEditing" class="flex flex-col gap-1.5 flex-shrink-0">
          <button @click="saveEdit" class="edit-save btn-press">
            <span class="eyebrow-sm" style="color: var(--cream)">{{ t('profile.save') }}</span>
          </button>
          <button @click="isEditing = false" class="btn-press">
            <span class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('profile.cancel') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="px-5 mt-5">
      <div class="stats-row">
        <button class="stat-cell btn-press" @click="navigate('orders')">
          <p class="serif text-[28px] tabular leading-none" style="color: var(--text-primary); font-weight: 500">{{ ordersCount }}</p>
          <p class="eyebrow-sm mt-1.5">{{ t('profile.orders_count') }}</p>
        </button>
        <button class="stat-cell btn-press" @click="navigate('favorites')">
          <p class="serif text-[28px] tabular leading-none" style="color: var(--text-primary); font-weight: 500">{{ favoritesCount }}</p>
          <p class="eyebrow-sm mt-1.5">{{ t('profile.favorites_count') }}</p>
        </button>
        <button class="stat-cell btn-press" @click="navigate('coupons')">
          <p class="serif text-[28px] tabular leading-none" style="color: var(--text-primary); font-weight: 500">0</p>
          <p class="eyebrow-sm mt-1.5">{{ t('profile.coupons_count') }}</p>
        </button>
      </div>
    </div>

    <!-- Referral -->
    <div v-if="isLoggedIn && referralCode" class="px-5 mt-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="num-label text-[11px] tabular">§</span>
        <p class="eyebrow-sm">{{ t('referral.title') }}</p>
      </div>
      <div class="hairline mb-3"></div>
      <div class="referral-card" @click="navigate('rewards')">
        <div class="flex items-start justify-between gap-3">
          <p class="serif-italic text-[14px] flex-1" style="color: var(--text-secondary); line-height: 1.4">{{ rewardInfo?.name || t('referral.subtitle') }}</p>
          <svg width="13" height="13" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex items-center gap-2 mt-3" @click.stop>
          <div class="referral-code flex-1">
            <span class="num-label text-[16px] tabular">{{ referralCode }}</span>
          </div>
          <button @click.stop="copyReferral" class="referral-copy btn-press"
            :class="{ 'referral-copy-success': referralCopied }">
            <span class="eyebrow-sm">
              {{ referralCopied ? t('referral.copied') : t('referral.copy') }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Menu groups -->
    <div v-for="(group, gi) in menuGroups" :key="gi" class="px-5 mt-7">
      <div class="flex items-center gap-2 mb-3">
        <span class="num-label text-[11px] tabular">§</span>
        <p class="eyebrow-sm">{{ t(group.titleKey) }}</p>
      </div>
      <div class="hairline mb-1"></div>
      <div class="flex flex-col">
        <button v-for="item in group.items" :key="item.labelKey" @click="navigate(item.route)" class="menu-row btn-press">
          <div class="menu-icon">
            <svg v-if="item.icon === 'orders'" width="16" height="16" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke-linecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4" stroke-linecap="round"/>
            </svg>
            <svg v-else-if="item.icon === 'heart'" width="16" height="16" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <svg v-else-if="item.icon === 'location'" width="16" height="16" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <svg v-else-if="item.icon === 'coupon'" width="16" height="16" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" stroke-linecap="round"/>
              <path d="M22 6H2v6h20V6z" stroke-linecap="round"/>
              <path d="M12 6v12" stroke-linecap="round" stroke-dasharray="2 2"/>
            </svg>
            <svg v-else-if="item.icon === 'card'" width="16" height="16" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <path d="M1 10h22"/>
            </svg>
            <svg v-else-if="item.icon === 'settings'" width="16" height="16" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <svg v-else-if="item.icon === 'help'" width="16" height="16" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="serif text-[15px] flex-1 text-left" style="color: var(--text-primary); font-weight: 500">{{ t(item.labelKey) }}</span>
          <svg width="11" height="11" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div v-if="isAuthenticated" class="px-5 mt-7">
      <button @click="handleLogout" class="logout-btn btn-press">
        <span class="eyebrow-sm" style="color: var(--bordeaux)">— {{ t('profile.logout') }} —</span>
      </button>
    </div>

    <div class="text-center mt-8">
      <span class="num-label text-[10px] tabular">Bazar Market · v1.0.0</span>
    </div>

    <!-- Logout modal -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showLogoutConfirm" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(26, 38, 32, 0.55); backdrop-filter: blur(8px)" @click.self="showLogoutConfirm = false">
          <div class="w-full max-w-[480px] confirm-sheet safe-bottom">
            <div class="text-center mb-5">
              <p class="num-label text-[12px] mb-2">— {{ t('ed.confirm_word') }} —</p>
              <h3 class="display text-[22px]" style="color: var(--text-primary)">{{ t('logout.title') }}</h3>
              <p class="serif-italic text-[13px] mt-2" style="color: var(--text-secondary)">{{ t('logout.subtitle') }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="showLogoutConfirm = false" class="confirm-cancel btn-press">
                <span class="eyebrow-sm">{{ t('profile.cancel') }}</span>
              </button>
              <button @click="confirmLogout" class="confirm-action btn-press">
                <span class="eyebrow-sm" style="color: var(--cream)">{{ t('logout.confirm') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.auth-warning {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--terracotta-light);
  border: 1px solid rgba(184, 92, 58, 0.18);
}
.dark .auth-warning {
  background: var(--surface-secondary);
}
.auth-cta {
  padding: 12px 18px;
  background: var(--terracotta);
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
  border-top: 1px solid var(--hairline);
}
.avatar {
  width: 64px;
  height: 64px;
  background: var(--surface-ink);
  border: 1px solid var(--hairline);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.edit-input {
  font-size: 13px;
  padding: 9px 12px;
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--hairline);
  outline: none;
  transition: border-color 0.2s ease;
}
.edit-input:focus {
  border-color: var(--text-primary);
}
.edit-save {
  padding: 8px 12px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}

.stats-row {
  display: flex;
  border: 1px solid var(--hairline);
  background: var(--surface);
}
.stat-cell {
  flex: 1;
  padding: 18px 12px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: center;
}
.stat-cell:last-child {
  border-right: none;
}

.referral-card {
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.2s ease;
}
.referral-card:active {
  border-color: var(--terracotta);
}

.referral-code {
  padding: 12px 14px;
  background: var(--bg-app);
  border: 1px dashed var(--border-strong);
  letter-spacing: 0.15em;
}
.referral-code .num-label {
  color: var(--text-primary);
}

.referral-copy {
  padding: 12px 18px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}
.referral-copy span {
  color: var(--cream) !important;
}
.referral-copy-success {
  background: var(--terracotta);
}
.referral-copy-success span {
  color: var(--cream) !important;
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.menu-icon {
  width: 32px;
  height: 32px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  padding: 16px 0;
  background: transparent;
  border: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;
}
.logout-btn:active {
  background: var(--bordeaux-light);
  border-color: var(--bordeaux);
}

/* Confirm sheet */
.confirm-sheet {
  background: var(--surface);
  padding: 28px 22px 24px;
  border-top: 1px solid var(--hairline);
}
.confirm-cancel,
.confirm-action {
  flex: 1;
  padding: 14px 0;
  background: var(--surface);
  border: 1px solid var(--hairline);
  cursor: pointer;
  text-align: center;
}
.confirm-action {
  background: var(--bordeaux);
  border-color: var(--bordeaux);
}
</style>
