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
        <p class="eyebrow-sm">{{ t('ed.preferences') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.your_settings_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.settings_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div class="px-5 mt-5 flex flex-col gap-7">
      <!-- Language -->
      <section>
        <div class="flex items-center gap-2 mb-1">
          <span class="num-label text-[11px] tabular">01</span>
          <p class="eyebrow-sm">{{ t('profile.language') }}</p>
        </div>
        <p class="serif-italic text-[13px] mb-3" style="color: var(--text-tertiary)">{{ t('settings.language_desc') }}</p>
        <SegmentedControl
          :options="LOCALES.map(l => ({ value: l.code, label: l.label }))"
          :modelValue="locale"
          @update:modelValue="setLocale"
        />
      </section>

      <!-- Theme -->
      <section>
        <div class="flex items-center gap-2 mb-1">
          <span class="num-label text-[11px] tabular">02</span>
          <p class="eyebrow-sm">{{ t('profile.theme') }}</p>
        </div>
        <p class="serif-italic text-[13px] mb-3" style="color: var(--text-tertiary)">{{ t('settings.theme_desc') }}</p>
        <SegmentedControl
          :options="[
            { value: 'light', label: t('profile.theme_light') },
            { value: 'dark', label: t('profile.theme_dark') },
            { value: 'auto', label: t('profile.theme_auto') },
          ]"
          :modelValue="mode"
          @update:modelValue="setTheme"
        />
      </section>

      <!-- Account -->
      <section v-if="isLoggedIn">
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">03</span>
          <p class="eyebrow-sm">{{ t('ed.account_section') }}</p>
        </div>
        <div class="hairline mb-1"></div>

        <button @click="showLogoutAll = true" class="settings-row btn-press">
          <div class="text-left">
            <p class="serif text-[15px]" style="color: var(--text-primary); font-weight: 500">{{ t('settings.logout_all') }}</p>
            <p class="text-[11px]" style="color: var(--text-tertiary)">{{ t('settings.logout_all_desc') }}</p>
          </div>
          <svg width="11" height="11" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button @click="showDelete = true" class="settings-row btn-press">
          <div class="text-left">
            <p class="serif text-[15px]" style="color: var(--bordeaux); font-weight: 500">{{ t('settings.delete_account') }}</p>
            <p class="text-[11px]" style="color: var(--text-tertiary)">{{ t('settings.delete_account_desc') }}</p>
          </div>
          <svg width="11" height="11" style="color: var(--bordeaux)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </section>
    </div>

    <!-- Logout-all confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showLogoutAll" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(26, 38, 32, 0.55); backdrop-filter: blur(8px)" @click.self="showLogoutAll = false">
          <div class="w-full max-w-[480px] confirm-sheet safe-bottom">
            <div class="text-center mb-5">
              <p class="num-label text-[12px] mb-2">— {{ t('ed.confirm_word') }} —</p>
              <h3 class="display text-[22px]" style="color: var(--text-primary)">{{ t('settings.logout_all_confirm_title') }}</h3>
              <p class="serif-italic text-[13px] mt-2" style="color: var(--text-secondary)">{{ t('settings.logout_all_confirm_subtitle') }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="showLogoutAll = false" :disabled="isWorking" class="confirm-cancel btn-press">
                <span class="eyebrow-sm">{{ t('profile.cancel') }}</span>
              </button>
              <button @click="confirmLogoutAll" :disabled="isWorking" class="confirm-action btn-press">
                <span class="eyebrow-sm" style="color: var(--cream)">{{ isWorking ? t('common.loading') : t('settings.logout_all_yes') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete account confirmation -->
    <Teleport to="#app">
      <Transition name="fade">
        <div v-if="showDelete" class="fixed inset-0 z-[100] flex items-end justify-center" style="background: rgba(26, 38, 32, 0.55); backdrop-filter: blur(8px)" @click.self="showDelete = false">
          <div class="w-full max-w-[480px] confirm-sheet safe-bottom">
            <div class="text-center mb-5">
              <p class="num-label text-[12px] mb-2" style="color: var(--bordeaux)">— {{ t('ed.irreversible') }} —</p>
              <h3 class="display text-[22px]" style="color: var(--text-primary)">{{ t('settings.delete_confirm_title') }}</h3>
              <p class="serif-italic text-[13px] mt-2" style="color: var(--text-secondary)">{{ t('settings.delete_confirm_subtitle') }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="showDelete = false" :disabled="isWorking" class="confirm-cancel btn-press">
                <span class="eyebrow-sm">{{ t('profile.cancel') }}</span>
              </button>
              <button @click="confirmDelete" :disabled="isWorking" class="confirm-action btn-press">
                <span class="eyebrow-sm" style="color: var(--cream)">{{ isWorking ? t('common.loading') : t('settings.delete_yes') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

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
