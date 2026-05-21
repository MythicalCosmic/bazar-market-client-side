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
  { icon: 'phone', labelKey: 'support.call', value: '+998 71 200 00 00' },
  { icon: 'telegram', labelKey: 'support.telegram', value: '@bazarmarket_support' },
  { icon: 'email', labelKey: 'support.email', value: 'support@bazarmarket.uz' },
]

function toggleFaq(idx) {
  expandedFaq.value = expandedFaq.value === idx ? null : idx
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
        <p class="eyebrow-sm">{{ t('ed.assistance') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.help_q_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.help_q_italic') }}</span>?
      </h1>
      <p class="serif-italic text-[14px] mt-2" style="color: var(--text-secondary)">{{ t('support.hero_subtitle') }}</p>
      <div class="hairline mt-4"></div>
    </div>

    <div class="px-5 mt-5 flex flex-col gap-7">
      <!-- Contact Methods -->
      <section>
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">01</span>
          <p class="eyebrow-sm">{{ t('support.contact_us') }}</p>
        </div>
        <div class="hairline mb-1"></div>
        <div class="flex flex-col">
          <a v-for="method in contactMethods" :key="method.icon"
            class="contact-row btn-press">
            <div class="contact-icon">
              <svg v-if="method.icon === 'phone'" width="14" height="14" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z"/>
              </svg>
              <svg v-else-if="method.icon === 'telegram'" width="14" height="14" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M21 5L2 12.5l7 1M21 5l-4 15-8-8.5M21 5L9 13.5M9 13.5V19l3.2-3.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="method.icon === 'email'" width="14" height="14" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 7l-10 7L2 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="flex-1 text-left">
              <p class="eyebrow-sm mb-0.5">{{ t(method.labelKey) }}</p>
              <p class="serif text-[14.5px] tabular" style="color: var(--text-primary); font-weight: 500">{{ method.value }}</p>
            </div>
            <svg width="11" height="11" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      <!-- FAQ -->
      <section>
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">02</span>
          <p class="eyebrow-sm">{{ t('support.faq_title') }}</p>
        </div>
        <div class="hairline mb-1"></div>

        <div v-for="(faq, idx) in faqs" :key="idx" class="faq-item">
          <button @click="toggleFaq(idx)" class="faq-q btn-press">
            <span class="num-label text-[12px] tabular flex-shrink-0">Q{{ idx + 1 }}</span>
            <span class="serif text-[15px] flex-1 text-left leading-snug" style="color: var(--text-primary); font-weight: 500">{{ t(faq.key) }}</span>
            <svg width="12" height="12"
              :style="{ color: 'var(--text-tertiary)', transform: expandedFaq === idx ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6">
              <path d="M6 9l6 6 6-6" stroke-linecap="round"/>
            </svg>
          </button>
          <div v-if="expandedFaq === idx" class="faq-a">
            <p class="serif-italic text-[14px] leading-relaxed" style="color: var(--text-secondary)">{{ t(faq.ansKey) }}</p>
          </div>
        </div>
      </section>

      <!-- Working hours -->
      <section class="text-center pt-2">
        <div class="rule-center mb-3">
          <span class="num-label text-[11px]">— {{ t('ed.hours_label') }} —</span>
        </div>
        <p class="serif text-[22px] tabular" style="color: var(--text-primary); font-weight: 500">09:00 — 22:00</p>
        <p class="serif-italic text-[13px] mt-1" style="color: var(--text-tertiary)">{{ t('support.every_day') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.contact-row {
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
  text-decoration: none;
}
.contact-icon {
  width: 36px;
  height: 36px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.faq-item {
  border-bottom: 1px solid var(--hairline);
}
.faq-q {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.faq-a {
  padding: 0 0 18px 32px;
  animation: fade-up 0.3s ease both;
}
</style>
