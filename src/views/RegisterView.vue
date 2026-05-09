<script setup>
import { ref, onUnmounted, nextTick, useTemplateRef } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'

const { navigate, routeParams } = useRouter()
const { t } = useI18n()
const auth = useAuth()

const step = ref(1)
const firstName = ref('')
const lastName = ref('')
const phone = ref('+998 ')
const code = ref('')
const isLoading = ref(false)
const error = ref('')
const codeInputs = ref(['', '', '', '', '', ''])
const codeRefs = useTemplateRef('codeRefs')
const countdown = ref(0)
let countdownTimer = null

function formatPhone(val) {
  let digits = val.replace(/\D/g, '')
  if (!digits.startsWith('998')) digits = '998' + digits
  if (digits.length > 12) digits = digits.slice(0, 12)
  let formatted = '+998'
  if (digits.length > 3) formatted += ' ' + digits.slice(3, 5)
  if (digits.length > 5) formatted += ' ' + digits.slice(5, 8)
  if (digits.length > 8) formatted += ' ' + digits.slice(8, 10)
  if (digits.length > 10) formatted += ' ' + digits.slice(10, 12)
  return formatted
}

function onPhoneInput(e) { phone.value = formatPhone(e.target.value) }

function startCountdown(seconds) {
  countdown.value = seconds
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}

async function handleRegister() {
  if (isLoading.value) return
  if (!firstName.value.trim()) { error.value = t('register.fill_all'); return }
  if (phone.value.replace(/\D/g, '').length < 12) { error.value = t('register.invalid_phone'); return }
  error.value = ''
  isLoading.value = true
  const result = await auth.register(firstName.value.trim(), lastName.value.trim(), phone.value)
  isLoading.value = false
  if (result.success) {
    step.value = 2
    startCountdown(result.expiresIn || 120)
    nextTick(() => codeRefs.value?.[0]?.focus())
  } else if (result.status === 429) {
    error.value = t('login.rate_limited', { sec: 60 })
  } else {
    error.value = result.message || t('register.fill_all')
  }
}

function fillCodeFromString(str) {
  const digits = (str || '').replace(/\D/g, '').slice(0, 6).split('')
  for (let i = 0; i < 6; i++) codeInputs.value[i] = digits[i] || ''
  code.value = codeInputs.value.join('')
  const next = Math.min(digits.length, 5)
  nextTick(() => codeRefs.value?.[next]?.focus())
}

function onCodeInput(idx, e) {
  const raw = e.target.value
  if (raw.length > 1) { fillCodeFromString(raw); return }
  const d = raw.replace(/\D/g, '').slice(0, 1)
  codeInputs.value[idx] = d
  code.value = codeInputs.value.join('')
  if (d && idx < 5) codeRefs.value?.[idx + 1]?.focus()
}

function onCodePaste(e) {
  const text = e.clipboardData?.getData('text') || ''
  if (/\d/.test(text)) {
    e.preventDefault()
    fillCodeFromString(text)
  }
}

function onCodeKeydown(idx, e) {
  if (e.key === 'Backspace' && !codeInputs.value[idx] && idx > 0) {
    codeRefs.value?.[idx - 1]?.focus()
  }
}

async function handleVerify() {
  if (isLoading.value) return
  if (code.value.length !== 6) { error.value = t('register.enter_code'); return }
  error.value = ''
  isLoading.value = true
  const result = await auth.verifyRegistration(phone.value, code.value)
  isLoading.value = false
  if (result.success) {
    const intended = routeParams.value?._intendedRoute
    navigate(intended && !['login', 'register'].includes(intended) ? intended : 'home')
  } else {
    error.value = result.message || t('register.wrong_code')
    codeInputs.value = ['', '', '', '', '', '']
    code.value = ''
    nextTick(() => codeRefs.value?.[0]?.focus())
  }
}

async function resendCode() {
  if (countdown.value > 0 || isLoading.value) return
  codeInputs.value = ['', '', '', '', '', '']
  code.value = ''
  error.value = ''
  const result = await auth.resendRegistrationCode(phone.value)
  if (result.success) startCountdown(result.expiresIn || 60)
  else error.value = result.message || ''
}

onUnmounted(() => clearInterval(countdownTimer))
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-app)">
    <div class="relative pt-12 pb-8 flex flex-col items-center" style="background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 0 0 32px 32px;">
      <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm" style="box-shadow: 0 8px 32px rgba(0,0,0,0.15)">
        <svg width="32" height="32" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/><circle cx="8.5" cy="7" r="4" stroke-width="2"/><path d="M20 8v6M23 11h-6" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h1 class="text-white text-2xl font-black">{{ step === 1 ? t('register.title') : t('register.verify_title') }}</h1>
      <p class="text-white/70 text-xs font-semibold mt-1 text-center max-w-[260px]">{{ step === 1 ? t('register.subtitle') : t('register.verify_subtitle') }}</p>
    </div>

    <div class="flex-1 px-4 -mt-4">
      <!-- Step 1: Register form -->
      <div v-if="step === 1">
        <div class="rounded-2xl p-5" style="background: var(--surface); box-shadow: 0 4px 24px var(--shadow-lg)">
          <div class="flex flex-col gap-3.5">
            <div>
              <label class="text-[10px] font-bold block mb-1.5" style="color: var(--text-tertiary)">{{ t('register.first_name') }}</label>
              <div class="flex items-center rounded-xl px-4 py-3 gap-3" style="background: var(--surface-secondary)">
                <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke-width="2"/></svg>
                <input v-model="firstName" autocomplete="given-name" :placeholder="t('register.first_name_placeholder')" class="bg-transparent outline-none text-sm font-bold flex-1 min-w-0" style="color: var(--text-primary)" />
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold block mb-1.5" style="color: var(--text-tertiary)">{{ t('register.last_name') }} <span class="font-semibold opacity-60">{{ t('register.optional') }}</span></label>
              <div class="flex items-center rounded-xl px-4 py-3 gap-3" style="background: var(--surface-secondary)">
                <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke-width="2"/></svg>
                <input v-model="lastName" autocomplete="family-name" :placeholder="t('register.last_name_placeholder')" class="bg-transparent outline-none text-sm font-bold flex-1 min-w-0" style="color: var(--text-primary)" />
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold block mb-1.5" style="color: var(--text-tertiary)">{{ t('register.phone') }}</label>
              <div class="flex items-center rounded-xl px-4 py-3 gap-3" style="background: var(--surface-secondary)">
                <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/></svg>
                <input :value="phone" @input="onPhoneInput" @keyup.enter="handleRegister" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998 90 123 45 67" class="bg-transparent outline-none text-sm font-bold flex-1 min-w-0" style="color: var(--text-primary)" />
              </div>
            </div>
          </div>
          <p v-if="error" class="text-xs font-bold text-red-500 text-center mt-3">{{ error }}</p>
          <button @click="handleRegister" :disabled="isLoading" type="button" class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press mt-5 transition-opacity" :class="{ 'opacity-60': isLoading }" style="box-shadow: 0 6px 24px var(--primary-glow)">{{ isLoading ? t('common.loading') : t('register.send_code') }}</button>
        </div>
        <div class="flex items-center gap-3 my-5 px-4">
          <div class="flex-1 h-px" style="background: var(--border)"></div>
          <span class="text-[10px] font-bold" style="color: var(--text-tertiary)">{{ t('login.or') }}</span>
          <div class="flex-1 h-px" style="background: var(--border)"></div>
        </div>
        <button @click="navigate('login')" type="button" class="w-full py-4 rounded-2xl font-black text-sm btn-press" style="background: var(--surface); color: var(--text-primary); box-shadow: 0 2px 12px var(--shadow)">{{ t('login.have_account') }}</button>
        <button @click="navigate('home')" type="button" class="w-full text-sm font-bold py-3 mt-2 btn-press" style="color: var(--text-tertiary)">{{ t('register.skip') }}</button>
      </div>

      <!-- Step 2: OTP Verify -->
      <div v-else>
        <div class="rounded-2xl p-6" style="background: var(--surface); box-shadow: 0 4px 24px var(--shadow-lg)">
          <p class="text-xs font-bold text-center mb-1" style="color: var(--text-secondary)">{{ t('register.code_sent_to') }}</p>
          <p class="text-sm font-black text-center mb-5" style="color: var(--text-primary)">{{ phone }}</p>
          <div class="flex gap-2 justify-center mb-4">
            <input
              v-for="(d, i) in codeInputs"
              :key="i"
              :ref="(el) => { if (codeRefs) codeRefs[i] = el }"
              :value="codeInputs[i]"
              @input="onCodeInput(i, $event)"
              @keydown="onCodeKeydown(i, $event)"
              @paste="onCodePaste"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              class="w-12 h-14 text-center text-xl font-black rounded-xl outline-none transition-all border-2"
              :style="{ background: 'var(--surface-secondary)', color: 'var(--text-primary)', borderColor: codeInputs[i] ? 'var(--primary)' : 'var(--border)' }"
            />
          </div>
          <div class="text-center">
            <button v-if="countdown <= 0" @click="resendCode" type="button" class="text-xs font-bold text-primary btn-press">{{ t('register.resend') }}</button>
            <p v-else class="text-xs font-semibold" style="color: var(--text-tertiary)">{{ t('register.resend_in', { sec: countdown }) }}</p>
          </div>
        </div>
        <p v-if="error" class="text-xs font-bold text-red-500 text-center mt-3">{{ error }}</p>
        <button @click="handleVerify" :disabled="isLoading || code.length !== 6" type="button" class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press mt-4 transition-opacity" :class="{ 'opacity-60': isLoading || code.length !== 6 }" style="box-shadow: 0 6px 24px var(--primary-glow)">{{ isLoading ? t('common.loading') : t('register.verify') }}</button>
        <button @click="step = 1" type="button" class="w-full text-sm font-bold py-3 mt-2 btn-press" style="color: var(--text-tertiary)">{{ t('common.back') }}</button>
      </div>
    </div>
  </div>
</template>
