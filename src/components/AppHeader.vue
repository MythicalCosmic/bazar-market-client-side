<script setup>
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()
</script>

<template>
  <header
    class="px-4 pt-3 pb-3 sticky top-0 z-30"
    style="background: var(--surface); box-shadow: 0 2px 16px var(--shadow)"
  >
    <!-- Location -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 cursor-pointer btn-press">
        <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
          <svg class="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div>
          <p class="text-[10px] font-semibold leading-none" style="color: var(--text-tertiary)">{{ t('header.current_location') }}</p>
          <div class="flex items-center gap-0.5">
            <p class="text-sm font-black leading-tight" style="color: var(--text-primary)">Mustaqillik ko'chasi 52</p>
            <svg class="w-3.5 h-3.5" style="color: var(--text-secondary)" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center rounded-xl px-3 py-2.5 gap-2" style="background: var(--surface-secondary)">
      <svg class="w-4 h-4 flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" stroke-width="2"/>
        <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        :placeholder="t('header.search_placeholder')"
        class="bg-transparent outline-none text-sm font-semibold flex-1"
        style="color: var(--text-primary)"
      />
    </div>
  </header>
</template>
