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
const referralLink = ref('')
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
      referralLink.value = referralData.value.referral_link || ''
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
    items: [
      { labelKey: 'profile.my_orders', icon: 'orders', route: 'orders', iconColor: '#059669', iconBg: 'rgba(5,150,105,0.08)' },
      { labelKey: 'favorites.title', icon: 'heart', route: 'favorites', iconColor: '#EF4444', iconBg: 'rgba(239,68,68,0.08)' },
      { labelKey: 'addresses.title', icon: 'location', route: 'addresses', iconColor: '#F97316', iconBg: 'rgba(249,115,22,0.08)' },
      { labelKey: 'coupons.title', icon: 'coupon', route: 'coupons', iconColor: '#D97706', iconBg: 'rgba(217,119,6,0.08)' },
      { labelKey: 'profile.payment_methods', icon: 'card', route: 'payment-methods', iconColor: '#2563EB', iconBg: 'rgba(37,99,235,0.08)' },
    ],
  },
  {
    items: [
      { labelKey: 'profile.settings', icon: 'settings', route: 'settings', iconColor: '#78716C', iconBg: 'rgba(120,113,108,0.08)' },
      { labelKey: 'support.title', icon: 'help', route: 'support', iconColor: '#7C3AED', iconBg: 'rgba(124,58,237,0.08)' },
    ],
  },
]
</script>

<template>
  <div class="pb-28 px-4 pt-5">

    <!-- Not logged in warning -->
    <div v-if="!isLoggedIn" class="auth-warning mb-4">
      <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: rgba(249,115,22,0.08)">
        <svg class="w-5 h-5" style="color: #F97316" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm font-bold" style="color: #EA580C">{{ t('profile.not_verified') }}</p>
        <p class="text-[10px] font-medium" style="color: var(--text-tertiary)">{{ t('profile.verify_to_order') }}</p>
      </div>
      <button @click="navigate('login')" class="text-white text-xs font-bold px-3.5 py-2 rounded-xl btn-press flex-shrink-0" style="background: #F97316">
        {{ t('login.button') }}
      </button>
    </div>

    <!-- Profile card -->
    <div class="profile-card mb-4">
      <div class="flex items-center gap-4">
        <!-- Avatar -->
        <div class="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style="background: var(--primary-light)">
          <span v-if="!tgUser.photo_url" class="text-2xl font-bold text-primary">{{ displayName?.charAt(0)?.toUpperCase() || '?' }}</span>
          <img v-else :src="tgUser.photo_url" class="w-full h-full object-cover" />
        </div>

        <!-- Info / Edit -->
        <div v-if="!isEditing" class="flex-1 min-w-0">
          <p class="text-base font-bold truncate" style="color: var(--text-primary)">{{ displayName }}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <p class="text-xs font-medium" style="color: var(--text-tertiary)">{{ maskedPhone }}</p>
            <button v-if="isAuthenticated" @click="showPhone = !showPhone" class="btn-press p-0.5">
              <svg v-if="!showPhone" class="w-3.5 h-3.5" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke-width="2"/>
              </svg>
              <svg v-else class="w-3.5 h-3.5" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-width="2" stroke-linecap="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col gap-2">
          <input v-model="editFirstName" :placeholder="t('register.first_name')" class="edit-input" />
          <input v-model="editLastName" :placeholder="t('register.last_name')" class="edit-input" />
          <div class="edit-input opacity-50">{{ user?.phone || '' }}</div>
        </div>

        <!-- Edit / Save buttons -->
        <div v-if="!isEditing" class="flex-shrink-0">
          <button v-if="isAuthenticated" @click="startEdit" class="text-primary text-xs font-bold px-3 py-1.5 rounded-xl btn-press" style="background: var(--primary-light)">{{ t('profile.edit') }}</button>
        </div>
        <div v-else class="flex flex-col gap-1.5 flex-shrink-0">
          <button @click="saveEdit" class="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl btn-press">{{ t('profile.save') }}</button>
          <button @click="isEditing = false" class="text-xs font-medium px-3 py-1 rounded-xl btn-press" style="color: var(--text-tertiary)">{{ t('profile.cancel') }}</button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="profile-card mb-4">
      <div class="flex items-center">
        <div class="flex-1 flex flex-col items-center py-1 cursor-pointer btn-press" @click="navigate('orders')">
          <p class="text-xl font-bold text-primary">{{ ordersCount }}</p>
          <p class="text-[10px] font-medium mt-0.5" style="color: var(--text-tertiary)">{{ t('profile.orders_count') }}</p>
        </div>
        <div class="w-px h-8" style="background: var(--border)"></div>
        <div class="flex-1 flex flex-col items-center py-1 cursor-pointer btn-press" @click="navigate('favorites')">
          <p class="text-xl font-bold text-primary">{{ favoritesCount }}</p>
          <p class="text-[10px] font-medium mt-0.5" style="color: var(--text-tertiary)">{{ t('profile.favorites_count') }}</p>
        </div>
        <div class="w-px h-8" style="background: var(--border)"></div>
        <div class="flex-1 flex flex-col items-center py-1 cursor-pointer btn-press" @click="navigate('coupons')">
          <p class="text-xl font-bold text-primary">0</p>
          <p class="text-[10px] font-medium mt-0.5" style="color: var(--text-tertiary)">{{ t('profile.coupons_count') }}</p>
        </div>
      </div>
    </div>

    <!-- Referral -->
    <div v-if="isLoggedIn && referralCode" class="profile-card mb-4 btn-press" @click="navigate('rewards')">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(124,58,237,0.08)">
          <svg width="18" height="18" style="color: #7C3AED" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/>
            <circle cx="9" cy="7" r="4" stroke-width="2"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold" style="color: var(--text-primary)">{{ t('referral.title') }}</p>
          <p v-if="rewardInfo" class="text-[10px] font-medium" style="color: var(--text-tertiary)">{{ rewardInfo.name }}</p>
          <p v-else class="text-[10px] font-medium" style="color: var(--text-tertiary)">{{ t('referral.subtitle') }}</p>
        </div>
        <svg width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/></svg>
      </div>
      <div class="flex items-center gap-2" @click.stop>
        <div class="flex-1 flex items-center px-3 py-2.5 rounded-xl" style="background: var(--surface-secondary)">
          <span class="text-sm font-bold tracking-wider" style="color: var(--text-primary)">{{ referralCode }}</span>
        </div>
        <button @click.stop="copyReferral" class="px-4 py-2.5 rounded-xl text-xs font-bold btn-press transition-all"
          :style="{ background: referralCopied ? 'var(--primary)' : 'var(--primary-light)', color: referralCopied ? 'white' : 'var(--primary)' }">
          {{ referralCopied ? t('referral.copied') : t('referral.copy') }}
        </button>
      </div>
    </div>

    <!-- Menu groups -->
    <div v-for="(group, gi) in menuGroups" :key="gi" class="profile-card overflow-hidden mb-3">
      <div v-for="(item, ii) in group.items" :key="item.labelKey"
        @click="navigate(item.route)"
        class="flex items-center justify-between px-4 py-3.5 btn-press cursor-pointer menu-item"
        :class="{ 'menu-item-border': ii < group.items.length - 1 }">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" :style="{ background: item.iconBg }">
            <svg v-if="item.icon === 'orders'" width="18" height="18" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke-width="2" stroke-linecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke-width="2"/><path d="M9 12h6M9 16h4" stroke-width="2" stroke-linecap="round"/></svg>
            <svg v-else-if="item.icon === 'heart'" width="18" height="18" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/></svg>
            <svg v-else-if="item.icon === 'location'" width="18" height="18" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/></svg>
            <svg v-else-if="item.icon === 'coupon'" width="18" height="18" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" stroke-width="2" stroke-linecap="round"/><path d="M22 6H2v6h20V6z" stroke-width="2" stroke-linecap="round"/><path d="M12 6v12" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2"/></svg>
            <svg v-else-if="item.icon === 'card'" width="18" height="18" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" stroke-width="2"/><path d="M1 10h22" stroke-width="2"/></svg>
            <svg v-else-if="item.icon === 'settings'" width="18" height="18" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke-width="2"/></svg>
            <svg v-else-if="item.icon === 'help'" width="18" height="18" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span class="text-sm font-semibold" style="color: var(--text-primary)">{{ t(item.labelKey) }}</span>
        </div>
        <svg class="w-4 h-4" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <!-- Logout -->
    <button v-if="isAuthenticated" @click="handleLogout" class="logout-btn btn-press">
      <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-width="2" stroke-linecap="round"/>
        <polyline points="16 17 21 12 16 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="21" y1="12" x2="9" y2="12" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span class="text-sm font-bold text-red-500">{{ t('profile.logout') }}</span>
    </button>

    <p class="text-center text-[10px] font-medium mt-4 pb-2" style="color: var(--text-tertiary)">Bazar Market v1.0.0</p>

    <!-- Logout modal -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showLogoutConfirm" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(0,0,0,0.4)" @click.self="showLogoutConfirm = false">
          <div class="w-full max-w-[480px] rounded-t-[28px] p-6 safe-bottom" style="background: var(--surface);">
            <div class="flex flex-col items-center mb-6">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" style="background: rgba(239,68,68,0.08)">
                <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-width="2" stroke-linecap="round"/>
                  <polyline points="16 17 21 12 16 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="21" y1="12" x2="9" y2="12" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold" style="color: var(--text-primary)">{{ t('logout.title') }}</h3>
              <p class="text-sm font-medium mt-1" style="color: var(--text-tertiary)">{{ t('logout.subtitle') }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="confirmLogout" class="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl btn-press">{{ t('logout.confirm') }}</button>
              <button @click="showLogoutConfirm = false" class="w-full font-bold py-3.5 rounded-2xl btn-press" style="background: var(--surface-secondary); color: var(--text-primary)">{{ t('profile.cancel') }}</button>
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
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(249, 115, 22, 0.04);
  border: 1.5px solid rgba(249, 115, 22, 0.15);
}

.profile-card {
  border-radius: 18px;
  padding: 16px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 16px var(--shadow);
}

.profile-card.overflow-hidden {
  padding: 0;
}

.edit-input {
  font-size: 14px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 12px;
  outline: none;
  background: var(--surface-secondary);
  color: var(--text-primary);
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}
.edit-input:focus {
  border-color: var(--primary);
}

.menu-item {
  transition: background 0.15s ease;
}
.menu-item-border {
  border-bottom: 1px solid var(--border);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  margin-top: 4px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 16px var(--shadow);
}
</style>
