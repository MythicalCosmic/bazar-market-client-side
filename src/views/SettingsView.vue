<script setup>
import { useRouter } from '../router/index.js'
import { useI18n, LOCALES } from '../i18n/index.js'
import { useTheme } from '../composables/useTheme.js'
import SegmentedControl from '../components/SegmentedControl.vue'

const { navigate } = useRouter()
const { t, locale, setLocale } = useI18n()
const { mode, setTheme } = useTheme()
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
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

      <!-- Notifications placeholder -->
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke-width="2"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-black" style="color: var(--text-primary)">{{ t('settings.notifications') }}</p>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('settings.notifications_desc') }}</p>
            </div>
          </div>
          <!-- Toggle -->
          <div class="w-11 h-6 rounded-full bg-primary flex items-center px-0.5 cursor-pointer">
            <div class="w-5 h-5 rounded-full bg-white transform translate-x-5 transition-transform" style="box-shadow: 0 1px 3px rgba(0,0,0,0.2)"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
