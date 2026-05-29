<script setup>
import { ref, onUnmounted, nextTick } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'

const { navigate, routeParams } = useRouter()
const { t } = useI18n()
const { requestLoginCode, verifyLogin, resendLoginCode } = useAuth()

const step = ref(1) // 1 = phone, 2 = otp
const phone = ref('+998 ')
const isLoading = ref(false)
const error = ref('')
const codeInputs = ref(['', '', '', '', '', ''])
const code = ref('')
const codeRefs = ref([])
const setCodeRef = (i) => (el) => { codeRefs.value[i] = el }
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
  if (isLoading.value) return
  const digits = phone.value.replace(/\D/g, '')
  if (digits.length < 12) { error.value = t('register.invalid_phone'); return }
  error.value = ''
  isLoading.value = true
  const result = await requestLoginCode(phone.value)
  isLoading.value = false
  if (result.success) {
    step.value = 2
    startCountdown(result.expiresIn || 120)
    nextTick(() => codeRefs.value?.[0]?.focus())
  } else if (result.status === 429) {
    error.value = t('login.rate_limited', { sec: result.retryAfter || 60 })
  } else {
    error.value = result.message || t('common.error_generic')
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
  const result = await verifyLogin(phone.value, code.value)
  isLoading.value = false
  if (result.success) {
    const intended = routeParams.value?._intendedRoute
    navigate(intended && intended !== 'login' ? intended : 'home')
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
  const result = await resendLoginCode(phone.value)
  if (result.success) startCountdown(result.expiresIn || 60)
  else error.value = result.message || ''
}

function backToPhone() {
  step.value = 1
  error.value = ''
  codeInputs.value = ['', '', '', '', '', '']
  code.value = ''
  clearInterval(countdownTimer)
  countdown.value = 0
}

onUnmounted(() => clearInterval(countdownTimer))
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-app)">
    <!-- Hero header -->
    <div class="relative pt-14 pb-10 flex flex-col items-center login-hero">
      <div class="absolute top-0 left-0 w-32 h-32 rounded-full" style="background: rgba(255,255,255,0.06); filter: blur(40px);"></div>
      <div class="absolute bottom-4 right-0 w-24 h-24 rounded-full" style="background: rgba(255,255,255,0.04); filter: blur(30px);"></div>

      <div class="w-20 h-20 rounded-[22px] flex items-center justify-center mb-4 logo-glass">
        <img src="/logo.png" alt="Bazar Market" class="w-13 h-13 object-contain" style="width: 52px; height: 52px;" />
      </div>
      <h1 class="text-white text-[22px] font-bold tracking-wider">BAZAR MARKET</h1>
      <p class="text-white/50 text-xs font-medium mt-1.5 tracking-wide">{{ t('login.welcome') }}</p>
    </div>

    <!-- Form card -->
    <div class="flex-1 px-4 -mt-5 relative z-10">
      <!-- Step 1: phone -->
      <div v-if="step === 1" class="login-card">
        <h2 class="text-lg font-bold mb-0.5" style="color: var(--text-primary)">{{ t('login.title') }}</h2>
        <p class="text-xs font-medium mb-5" style="color: var(--text-tertiary)">{{ t('login.phone_subtitle') }}</p>

        <div>
          <label class="text-[10px] font-semibold block mb-1.5 tracking-wide uppercase" style="color: var(--text-tertiary)">{{ t('register.phone') }}</label>
          <div class="input-field">
            <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
            </svg>
            <input
              :value="phone"
              @input="onPhoneInput"
              @keyup.enter="handleSendCode"
              type="tel"
              autocomplete="tel"
              inputmode="tel"
              placeholder="+998 90 123 45 67"
              class="bg-transparent outline-none text-sm font-semibold flex-1 min-w-0"
              style="color: var(--text-primary)"
            />
          </div>
        </div>

        <p v-if="error" class="text-xs font-semibold text-red-500 text-center mt-3 py-2 px-3 rounded-xl" style="background: rgba(239,68,68,0.06)">{{ error }}</p>

        <button @click="handleSendCode" :disabled="isLoading" type="button"
          class="w-full text-white font-bold py-4 rounded-2xl btn-press mt-5 transition-opacity login-submit"
          :class="{ 'opacity-60': isLoading }">
          {{ isLoading ? t('common.loading') : t('login.send_code') }}
        </button>

        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 h-px" style="background: var(--border)"></div>
          <span class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('login.or') }}</span>
          <div class="flex-1 h-px" style="background: var(--border)"></div>
        </div>

        <button @click="navigate('register')" type="button" class="w-full py-4 rounded-2xl font-bold text-sm btn-press register-btn">{{ t('login.no_account') }}</button>
        <button @click="navigate('home')" type="button" class="w-full text-sm font-medium py-3 mt-2 btn-press" style="color: var(--text-tertiary)">{{ t('register.skip') }}</button>
      </div>

      <!-- Step 2: OTP -->
      <div v-else class="login-card">
        <h2 class="text-lg font-bold mb-0.5" style="color: var(--text-primary)">{{ t('register.verify_title') }}</h2>
        <p class="text-xs font-medium mb-1" style="color: var(--text-tertiary)">{{ t('register.code_sent_to') }}</p>
        <p class="text-sm font-bold mb-5" style="color: var(--text-primary)">{{ phone }}</p>

        <div class="flex gap-2 justify-center mb-4">
          <input
            v-for="(d, i) in codeInputs"
            :key="i"
            :ref="setCodeRef(i)"
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

        <p v-if="error" class="text-xs font-semibold text-red-500 text-center mt-3 py-2 px-3 rounded-xl" style="background: rgba(239,68,68,0.06)">{{ error }}</p>

        <button @click="handleVerify" :disabled="isLoading || code.length !== 6" type="button"
          class="w-full text-white font-bold py-4 rounded-2xl btn-press mt-5 transition-opacity login-submit"
          :class="{ 'opacity-60': isLoading || code.length !== 6 }">
          {{ isLoading ? t('common.loading') : t('register.verify') }}
        </button>

        <button @click="backToPhone" type="button" class="w-full text-xs font-semibold py-3 mt-2 btn-press" style="color: var(--text-tertiary)">{{ t('login.use_different_phone') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-hero {
  background: linear-gradient(160deg, #059669 0%, #047857 40%, #065F46 100%);
  border-radius: 0 0 28px 28px;
}

.logo-glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.login-card {
  border-radius: 20px;
  padding: 24px;
  background: var(--surface);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 12px 32px var(--shadow-lg);
}

.input-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--surface-secondary);
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}
.input-field:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.08);
}

.login-submit {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 4px 16px var(--primary-glow), 0 2px 4px rgba(0, 0, 0, 0.1);
}

.register-btn {
  background: var(--surface);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 12px var(--shadow);
}
</style>
