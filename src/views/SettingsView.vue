<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n, LOCALES } from '../i18n/index.js'
import { useTheme } from '../composables/useTheme.js'
import { useAuth } from '../stores/authStore.js'
import { useToast } from '../composables/useToast.js'
import SegmentedControl from '../components/SegmentedControl.vue'

const { navigate } = useRouter()
const { t, locale, setLocale } = useI18n()
const { mode, setTheme } = useTheme()
const { isLoggedIn, logoutAll, deleteAccount } = useAuth()
const { error: toastError, success: toastSuccess } = useToast()

const showLogoutAll = ref(false)
const showDelete = ref(false)
const isWorking = ref(false)

async function confirmLogoutAll() {
  if (isWorking.value) return
  isWorking.value = true
  await logoutAll()
  isWorking.value = false
  showLogoutAll.value = false
  toastSuccess(t('settings.logout_all_done'))
  navigate('login')
}

async function confirmDelete() {
  if (isWorking.value) return
  isWorking.value = true
  const result = await deleteAccount()
  isWorking.value = false
  showDelete.value = false
  if (result.success) {
    toastSuccess(t('settings.account_deleted'))
    navigate('home')
  } else {
    toastError(result.message || t('common.error_generic'))
  }
}
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" :aria-label="t('common.back')" style="background: var(--surface-secondary)">
        <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('profile.settings') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-4 flex flex-col gap-4">

      <!-- Language -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke-width="2"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ t('profile.language') }}</p>
            <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('settings.language_desc') }}</p>
          </div>
        </div>
        <SegmentedControl
          :options="LOCALES.map(l => ({ value: l.code, label: l.label }))"
          :modelValue="locale"
          @update:modelValue="setLocale"
        />
      </div>

      <!-- Theme -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-black" style="color: var(--text-primary)">{{ t('profile.theme') }}</p>
            <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('settings.theme_desc') }}</p>
          </div>
        </div>
        <SegmentedControl
          :options="[
            { value: 'light', label: t('profile.theme_light') },
            { value: 'dark', label: t('profile.theme_dark') },
            { value: 'auto', label: t('profile.theme_auto') },
          ]"
          :modelValue="mode"
          @update:modelValue="setTheme"
        />
      </div>

      <!-- Account actions -->
      <div v-if="isLoggedIn" class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <button @click="showLogoutAll = true" class="w-full flex items-center justify-between px-4 py-3.5 btn-press border-b" style="border-color: var(--border)">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: rgba(239,68,68,0.08)">
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-width="2" stroke-linecap="round"/>
                <polyline points="16 17 21 12 16 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="text-left">
              <p class="text-sm font-bold" style="color: var(--text-primary)">{{ t('settings.logout_all') }}</p>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('settings.logout_all_desc') }}</p>
            </div>
          </div>
          <svg class="w-4 h-4" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button @click="showDelete = true" class="w-full flex items-center justify-between px-4 py-3.5 btn-press">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: rgba(239,68,68,0.08)">
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="text-left">
              <p class="text-sm font-bold text-red-500">{{ t('settings.delete_account') }}</p>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('settings.delete_account_desc') }}</p>
            </div>
          </div>
          <svg class="w-4 h-4" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

    </div>

    <!-- Logout-all confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showLogoutAll" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(0,0,0,0.4)" @click.self="showLogoutAll = false">
          <div class="w-full max-w-[480px] rounded-t-[28px] p-6 safe-bottom" style="background: var(--surface)">
            <div class="flex flex-col items-center mb-5">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" style="background: rgba(239,68,68,0.08)">
                <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-width="2" stroke-linecap="round"/>
                  <polyline points="16 17 21 12 16 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="21" y1="12" x2="9" y2="12" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold" style="color: var(--text-primary)">{{ t('settings.logout_all_confirm_title') }}</h3>
              <p class="text-sm font-medium mt-1 text-center" style="color: var(--text-tertiary)">{{ t('settings.logout_all_confirm_subtitle') }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="confirmLogoutAll" :disabled="isWorking" class="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl btn-press transition-opacity" :class="{ 'opacity-60': isWorking }">{{ isWorking ? t('common.loading') : t('settings.logout_all_yes') }}</button>
              <button @click="showLogoutAll = false" :disabled="isWorking" class="w-full font-bold py-3.5 rounded-2xl btn-press" style="background: var(--surface-secondary); color: var(--text-primary)">{{ t('profile.cancel') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete account confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showDelete" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(0,0,0,0.4)" @click.self="showDelete = false">
          <div class="w-full max-w-[480px] rounded-t-[28px] p-6 safe-bottom" style="background: var(--surface)">
            <div class="flex flex-col items-center mb-5">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" style="background: rgba(239,68,68,0.08)">
                <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold" style="color: var(--text-primary)">{{ t('settings.delete_confirm_title') }}</h3>
              <p class="text-sm font-medium mt-1 text-center" style="color: var(--text-tertiary)">{{ t('settings.delete_confirm_subtitle') }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="confirmDelete" :disabled="isWorking" class="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl btn-press transition-opacity" :class="{ 'opacity-60': isWorking }">{{ isWorking ? t('common.loading') : t('settings.delete_yes') }}</button>
              <button @click="showDelete = false" :disabled="isWorking" class="w-full font-bold py-3.5 rounded-2xl btn-press" style="background: var(--surface-secondary); color: var(--text-primary)">{{ t('profile.cancel') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
