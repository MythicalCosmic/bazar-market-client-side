<script setup>
import { ref, onUnmounted, nextTick } from 'vue'
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
    <!-- Editorial top bar -->
    <div class="px-5 pt-6 pb-3 flex items-center justify-between">
      <button @click="step === 2 ? step = 1 : navigate('home')" class="flex items-center gap-2 btn-press">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="eyebrow-sm">{{ t('ed.back_word') }}</span>
      </button>
      <span class="num-label text-[11px] tabular">{{ t('ed.step_n_of') }} 0{{ step }} / 02</span>
    </div>

    <!-- Editorial masthead -->
    <div class="px-5 pt-4 pb-6">
      <div class="rule mb-3">
        <span class="eyebrow">{{ step === 1 ? t('ed.join_label') : t('ed.verify_label') }}</span>
      </div>
      <h1 class="display text-[40px]" style="color: var(--text-primary); line-height: 0.95;">
        <template v-if="step === 1">
          {{ t('ed.become_pre') }}<br/>
          <span class="serif-italic" style="color: var(--terracotta);">{{ t('ed.become_italic') }}</span>.
        </template>
        <template v-else>
          {{ t('ed.last_pre') }}<br/>
          <span class="serif-italic" style="color: var(--terracotta);">{{ t('ed.last_italic') }}</span>.
        </template>
      </h1>
      <p class="serif-italic text-[14.5px] mt-3" style="color: var(--text-secondary)">
        {{ step === 1 ? t('register.subtitle') : t('register.verify_subtitle') }}
      </p>
    </div>

    <!-- Form -->
    <div class="flex-1 px-5">
      <div v-if="step === 1" class="flex flex-col gap-5">
        <div>
          <label class="eyebrow-sm block mb-2">{{ t('register.first_name') }}</label>
          <div class="input-frame">
            <input v-model="firstName" autocomplete="given-name" :placeholder="t('register.first_name_placeholder')" class="form-input" />
          </div>
        </div>
        <div>
          <label class="eyebrow-sm block mb-2">{{ t('register.last_name') }} <span class="serif-italic text-[10.5px]" style="color: var(--text-tertiary); text-transform: none; letter-spacing: 0">{{ t('register.optional') }}</span></label>
          <div class="input-frame">
            <input v-model="lastName" autocomplete="family-name" :placeholder="t('register.last_name_placeholder')" class="form-input" />
          </div>
        </div>
        <div>
          <label class="eyebrow-sm block mb-2">{{ t('register.phone') }}</label>
          <div class="input-frame">
            <input :value="phone" @input="onPhoneInput" @keyup.enter="handleRegister" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998 90 123 45 67" class="form-input" />
          </div>
        </div>

        <p v-if="error" class="serif-italic text-[13px] text-center" style="color: var(--bordeaux)">{{ error }}</p>

        <button @click="handleRegister" :disabled="isLoading" type="button"
          class="primary-btn btn-press mt-2"
          :class="{ 'opacity-50': isLoading }">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ isLoading ? t('common.loading') : t('register.send_code') }}</span>
          <svg v-if="!isLoading" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--cream)">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="rule-center mt-2 mb-1">
          <span class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('login.or') }}</span>
        </div>

        <button @click="navigate('login')" type="button" class="ghost-btn btn-press">
          <span class="eyebrow-sm">{{ t('login.have_account') }}</span>
        </button>
        <button @click="navigate('home')" type="button" class="text-btn btn-press">
          <span class="serif-italic text-[13.5px]" style="color: var(--text-tertiary)">{{ t('register.skip') }} →</span>
        </button>
      </div>

      <!-- Step 2 -->
      <div v-else>
        <p class="serif-italic text-[14px] mb-1" style="color: var(--text-secondary)">{{ t('register.code_sent_to') }}</p>
        <p class="serif text-[18px] tabular mb-6" style="color: var(--text-primary); font-weight: 500">{{ phone }}</p>

        <div class="flex gap-2 justify-center mb-5">
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
            class="otp-input"
            :class="{ 'otp-input-filled': codeInputs[i] }"
          />
        </div>

        <div class="text-center mb-4">
          <button v-if="countdown <= 0" @click="resendCode" type="button" class="btn-press">
            <span class="eyebrow-sm" style="color: var(--terracotta)">{{ t('register.resend') }}</span>
          </button>
          <p v-else class="serif-italic text-[12.5px] tabular" style="color: var(--text-tertiary)">{{ t('register.resend_in', { sec: countdown }) }}</p>
        </div>

        <p v-if="error" class="serif-italic text-[13px] text-center" style="color: var(--bordeaux)">{{ error }}</p>

        <button @click="handleVerify" :disabled="isLoading || code.length !== 6" type="button"
          class="primary-btn btn-press mt-4"
          :class="{ 'opacity-50': isLoading || code.length !== 6 }">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ isLoading ? t('common.loading') : t('register.verify') }}</span>
        </button>

        <button @click="step = 1" type="button" class="text-btn btn-press mt-3">
          <span class="serif-italic text-[13.5px]" style="color: var(--text-tertiary)">{{ t('common.back') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-frame {
  border: 1px solid var(--hairline);
  background: var(--surface);
  transition: border-color 0.2s ease;
}
.input-frame:focus-within {
  border-color: var(--text-primary);
}
.form-input {
  width: 100%;
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 16px;
  font-weight: 500;
  padding: 14px 18px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

.primary-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 0;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.ghost-btn {
  width: 100%;
  padding: 16px 0;
  background: transparent;
  border: 1px solid var(--hairline);
  cursor: pointer;
  text-align: center;
}

.text-btn {
  width: 100%;
  padding: 10px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: center;
}

.otp-input {
  width: 46px;
  height: 56px;
  text-align: center;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 24px;
  font-weight: 500;
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--hairline);
  outline: none;
  transition: border-color 0.2s ease;
}
.otp-input:focus,
.otp-input-filled {
  border-color: var(--text-primary);
}
</style>
