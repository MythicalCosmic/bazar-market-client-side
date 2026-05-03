<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { forgotPassword, resetPassword } = useAuth()

const step = ref(1) // 1=phone, 2=code+newpass
const phone = ref('+998 ')
const code = ref('')
const newPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const codeInputs = ref(['', '', '', '', '', ''])
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

async function handleSendCode() {
  if (phone.value.replace(/\D/g, '').length < 12) { error.value = t('register.invalid_phone'); return }
  error.value = ''
  isLoading.value = true
  const result = await forgotPassword(phone.value)
  isLoading.value = false
  if (result.success) {
    step.value = 2
    startCountdown(result.expiresIn || 120)
  } else {
    error.value = result.message || ''
  }
}

function onCodeInput(idx, e) {
  const val = e.target.value.replace(/\D/g, '')
  codeInputs.value[idx] = val.slice(0, 1)
  if (val && idx < 5) { e.target.parentElement.children[idx + 1]?.focus() }
  code.value = codeInputs.value.join('')
}

function onCodeKeydown(idx, e) {
  if (e.key === 'Backspace' && !codeInputs.value[idx] && idx > 0) { e.target.parentElement.children[idx - 1]?.focus() }
}

async function handleReset() {
  if (code.value.length !== 6) { error.value = t('register.enter_code'); return }
  if (!newPassword.value || newPassword.value.length < 6) { error.value = t('login.password_short'); return }
  error.value = ''
  isLoading.value = true
  const result = await resetPassword(phone.value, code.value, newPassword.value)
  isLoading.value = false
  if (result.success) {
    navigate('login')
  } else {
    error.value = result.message || t('register.wrong_code')
  }
}

async function resendCode() {
  if (countdown.value > 0) return
  codeInputs.value = ['', '', '', '', '', '']
  code.value = ''
  const result = await forgotPassword(phone.value)
  if (result.success) startCountdown(result.expiresIn || 60)
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-app)">
    <div class="relative pt-12 pb-8 flex flex-col items-center" style="background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 0 0 32px 32px;">
      <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm" style="box-shadow: 0 8px 32px rgba(0,0,0,0.15)">
        <svg width="32" height="32" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h1 class="text-white text-2xl font-black">{{ step === 1 ? t('forgot.title') : t('forgot.reset_title') }}</h1>
      <p class="text-white/70 text-xs font-semibold mt-1 text-center max-w-[260px]">{{ step === 1 ? t('forgot.subtitle') : t('forgot.reset_subtitle') }}</p>
    </div>

    <div class="flex-1 px-4 -mt-4">
      <!-- Step 1: Enter phone -->
      <div v-if="step === 1">
        <div class="rounded-2xl p-5" style="background: var(--surface); box-shadow: 0 4px 24px var(--shadow-lg)">
          <label class="text-[10px] font-bold block mb-1.5" style="color: var(--text-tertiary)">{{ t('register.phone') }}</label>
          <div class="flex items-center rounded-xl px-4 py-3 gap-3" style="background: var(--surface-secondary)">
            <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/></svg>
            <input :value="phone" @input="onPhoneInput" type="tel" placeholder="+998 90 123 45 67" class="bg-transparent outline-none text-sm font-bold flex-1 min-w-0" style="color: var(--text-primary)" />
          </div>
          <p v-if="error" class="text-xs font-bold text-red-500 text-center mt-3">{{ error }}</p>
          <button @click="handleSendCode" :disabled="isLoading" class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press mt-5 transition-opacity" :class="{ 'opacity-60': isLoading }" style="box-shadow: 0 6px 24px var(--primary-glow)">{{ isLoading ? t('common.loading') : t('forgot.send_code') }}</button>
        </div>
        <button @click="navigate('login')" class="w-full text-sm font-bold py-3 mt-4 btn-press" style="color: var(--text-tertiary)">{{ t('common.back') }}</button>
      </div>

      <!-- Step 2: Code + new password -->
      <div v-if="step === 2">
        <div class="rounded-2xl p-6" style="background: var(--surface); box-shadow: 0 4px 24px var(--shadow-lg)">
          <p class="text-xs font-bold text-center mb-1" style="color: var(--text-secondary)">{{ t('register.code_sent_to') }}</p>
          <p class="text-sm font-black text-center mb-5" style="color: var(--text-primary)">{{ phone }}</p>
          <div class="flex gap-2 justify-center mb-4">
            <input v-for="(d, i) in codeInputs" :key="i" :value="codeInputs[i]" @input="onCodeInput(i, $event)" @keydown="onCodeKeydown(i, $event)" type="text" inputmode="numeric" maxlength="1" class="w-12 h-14 text-center text-xl font-black rounded-xl outline-none transition-all border-2" :style="{ background: 'var(--surface-secondary)', color: 'var(--text-primary)', borderColor: codeInputs[i] ? 'var(--primary)' : 'var(--border)' }" />
          </div>
          <div class="text-center mb-4">
            <button v-if="countdown <= 0" @click="resendCode" class="text-xs font-bold text-primary btn-press">{{ t('register.resend') }}</button>
            <p v-else class="text-xs font-semibold" style="color: var(--text-tertiary)">{{ t('register.resend_in', { sec: countdown }) }}</p>
          </div>

          <!-- New password -->
          <label class="text-[10px] font-bold block mb-1.5" style="color: var(--text-tertiary)">{{ t('forgot.new_password') }}</label>
          <div class="flex items-center rounded-xl px-4 py-3 gap-3" style="background: var(--surface-secondary)">
            <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2" stroke-linecap="round"/></svg>
            <input v-model="newPassword" :type="showPassword ? 'text' : 'password'" :placeholder="t('forgot.new_password_placeholder')" class="bg-transparent outline-none text-sm font-bold flex-1 min-w-0" style="color: var(--text-primary)" />
            <button @click="showPassword = !showPassword" class="btn-press p-0.5 flex-shrink-0">
              <svg v-if="!showPassword" width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>
              <svg v-else width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <p v-if="error" class="text-xs font-bold text-red-500 text-center mt-3">{{ error }}</p>
        <button @click="handleReset" :disabled="isLoading" class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press mt-4 transition-opacity" :class="{ 'opacity-60': isLoading }" style="box-shadow: 0 6px 24px var(--primary-glow)">{{ isLoading ? t('common.loading') : t('forgot.reset_button') }}</button>
        <button @click="step = 1" class="w-full text-sm font-bold py-3 mt-2 btn-press" style="color: var(--text-tertiary)">{{ t('common.back') }}</button>
      </div>
    </div>
  </div>
</template>
