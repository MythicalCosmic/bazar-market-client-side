<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'

const { navigate } = useRouter()
const { t } = useI18n()

const expandedFaq = ref(null)

const faqs = [
  { key: 'support.faq1_q', ansKey: 'support.faq1_a' },
  { key: 'support.faq2_q', ansKey: 'support.faq2_a' },
  { key: 'support.faq3_q', ansKey: 'support.faq3_a' },
  { key: 'support.faq4_q', ansKey: 'support.faq4_a' },
]

const contactMethods = [
  { icon: 'phone', labelKey: 'support.call', value: '+998 71 200 00 00', color: 'text-green-500', bg: 'bg-green-500/10' },
  { icon: 'telegram', labelKey: 'support.telegram', value: '@bazarmarket_support', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: 'email', labelKey: 'support.email', value: 'support@bazarmarket.uz', color: 'text-purple-500', bg: 'bg-purple-500/10' },
]

function toggleFaq(idx) {
  expandedFaq.value = expandedFaq.value === idx ? null : idx
}
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
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('support.title') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-4 flex flex-col gap-4">

      <!-- Hero -->
      <div class="rounded-2xl p-6 text-center" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="text-lg font-black mb-1" style="color: var(--text-primary)">{{ t('support.hero_title') }}</h2>
        <p class="text-xs font-semibold" style="color: var(--text-tertiary)">{{ t('support.hero_subtitle') }}</p>
      </div>

      <!-- Contact Methods -->
      <div class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="px-4 pt-4 pb-2 text-sm font-black" style="color: var(--text-primary)">{{ t('support.contact_us') }}</p>
        <div
          v-for="(method, idx) in contactMethods"
          :key="method.icon"
          :class="['flex items-center gap-3 px-4 py-3.5 btn-press', idx < contactMethods.length - 1 ? 'border-b' : '']"
          :style="{ borderColor: 'var(--border)' }"
        >
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', method.bg]">
            <!-- Phone -->
            <svg v-if="method.icon === 'phone'" :class="['w-5 h-5', method.color]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
            </svg>
            <!-- Telegram -->
            <svg v-else-if="method.icon === 'telegram'" :class="['w-5 h-5', method.color]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 5L2 12.5l7 1M21 5l-4 15-8-8.5M21 5L9 13.5M9 13.5V19l3.2-3.2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- Email -->
            <svg v-else-if="method.icon === 'email'" :class="['w-5 h-5', method.color]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke-width="2"/>
              <path d="M22 7l-10 7L2 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-xs font-bold" style="color: var(--text-primary)">{{ t(method.labelKey) }}</p>
            <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ method.value }}</p>
          </div>
          <svg class="w-4 h-4" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <!-- FAQ -->
      <div class="rounded-2xl overflow-hidden" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="px-4 pt-4 pb-2 text-sm font-black" style="color: var(--text-primary)">{{ t('support.faq_title') }}</p>
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="border-b last:border-b-0"
          :style="{ borderColor: 'var(--border)' }"
        >
          <button
            @click="toggleFaq(idx)"
            class="w-full flex items-center justify-between px-4 py-3.5 btn-press text-left"
          >
            <span class="text-xs font-bold flex-1 pr-2" style="color: var(--text-primary)">{{ t(faq.key) }}</span>
            <svg
              class="w-4 h-4 flex-shrink-0 transition-transform duration-200"
              :style="{ color: 'var(--text-tertiary)', transform: expandedFaq === idx ? 'rotate(180deg)' : '' }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div
            v-if="expandedFaq === idx"
            class="px-4 pb-3.5"
          >
            <p class="text-xs font-semibold leading-relaxed" style="color: var(--text-secondary)">{{ t(faq.ansKey) }}</p>
          </div>
        </div>
      </div>

      <!-- Working hours -->
      <div class="rounded-2xl p-4 text-center" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-xs font-bold" style="color: var(--text-tertiary)">{{ t('support.working_hours') }}</p>
        <p class="text-sm font-black mt-1" style="color: var(--text-primary)">09:00 - 22:00</p>
        <p class="text-[10px] font-semibold mt-0.5" style="color: var(--text-tertiary)">{{ t('support.every_day') }}</p>
      </div>

    </div>
  </div>
</template>
