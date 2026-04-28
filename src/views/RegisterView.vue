<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { sendCode, verifyCode, register } = useAuth()

const step = ref(1) // 1=info, 2=verify
const firstName = ref('')
const lastName = ref('')
const phone = ref('+998 ')
const code = ref('')
const isLoading = ref(false)
const error = ref('')

const codeInputs = ref(['', '', '', '', '', ''])

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

function onPhoneInput(e) {
  phone.value = formatPhone(e.target.value)
}

async function handleSendCode() {
  if (!firstName.value.trim() || !lastName.value.trim()) {
    error.value = t('register.fill_all')
    return
  }
  const phoneDigits = phone.value.replace(/\D/g, '')
  if (phoneDigits.length < 12) {
    error.value = t('register.invalid_phone')
    return
  }
  error.value = ''
  isLoading.value = true
  await sendCode(phone.value)
  isLoading.value = false
  step.value = 2
}

function onCodeInput(idx, e) {
  const val = e.target.value.replace(/\D/g, '')
  codeInputs.value[idx] = val.slice(0, 1)
  if (val && idx < 5) {
    const next = e.target.parentElement.children[idx + 1]
    if (next) next.focus()
  }
  code.value = codeInputs.value.join('')
}

function onCodeKeydown(idx, e) {
  if (e.key === 'Backspace' && !codeInputs.value[idx] && idx > 0) {
    const prev = e.target.parentElement.children[idx - 1]
    if (prev) prev.focus()
  }
}

async function handleVerify() {
  if (code.value.length !== 6) {
    error.value = t('register.enter_code')
    return
  }
  error.value = ''
  isLoading.value = true
  const result = await verifyCode(phone.value, code.value)
  isLoading.value = false
  if (result.success) {
    register(firstName.value.trim(), lastName.value.trim(), phone.value)
    navigate('home')
  } else {
    error.value = t('register.wrong_code')
  }
}

function resendCode() {
  codeInputs.value = ['', '', '', '', '', '']
  code.value = ''
  sendCode(phone.value)
}
</script>

<template>
  <div class="min-h-screen px-4 pt-8 pb-10" style="background: var(--bg-app)">

    <!-- Logo area -->
    <div class="flex flex-col items-center mb-8">
      <div class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4"
        style="box-shadow: 0 6px 20px var(--primary-glow)">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round"/>
          <circle cx="8.5" cy="7" r="4" stroke-width="2"/>
          <path d="M20 8v6M23 11h-6" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h1 class="text-2xl font-black" style="color: var(--text-primary)">
        {{ step === 1 ? t('register.title') : t('register.verify_title') }}
      </h1>
      <p class="text-sm font-semibold mt-1 text-center max-w-[260px]" style="color: var(--text-tertiary)">
        {{ step === 1 ? t('register.subtitle') : t('register.verify_subtitle') }}
      </p>
    </div>

    <!-- Step 1: Info -->
    <div v-if="step === 1" class="flex flex-col gap-3">
      <div class="rounded-2xl p-4" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <div class="flex flex-col gap-3">
          <!-- First Name -->
          <div>
            <label class="text-[10px] font-bold block mb-1" style="color: var(--text-tertiary)">{{ t('register.first_name') }}</label>
            <input
              v-model="firstName"
              :placeholder="t('register.first_name_placeholder')"
              class="w-full text-sm font-bold px-4 py-3 rounded-xl outline-none transition-all"
              :style="{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label class="text-[10px] font-bold block mb-1" style="color: var(--text-tertiary)">{{ t('register.last_name') }}</label>
            <input
              v-model="lastName"
              :placeholder="t('register.last_name_placeholder')"
              class="w-full text-sm font-bold px-4 py-3 rounded-xl outline-none transition-all"
              :style="{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="text-[10px] font-bold block mb-1" style="color: var(--text-tertiary)">{{ t('register.phone') }}</label>
            <input
              :value="phone"
              @input="onPhoneInput"
              type="tel"
              placeholder="+998 90 123 45 67"
              class="w-full text-sm font-bold px-4 py-3 rounded-xl outline-none transition-all"
              :style="{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }"
            />
          </div>
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-xs font-bold text-red-500 text-center">{{ error }}</p>

      <!-- Submit -->
      <button
        @click="handleSendCode"
        :disabled="isLoading"
        class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press mt-2 transition-opacity"
        :class="{ 'opacity-60': isLoading }"
        style="box-shadow: 0 6px 24px var(--primary-glow)"
      >
        {{ isLoading ? t('common.loading') : t('register.send_code') }}
      </button>

      <!-- Skip -->
      <button
        @click="navigate('home')"
        class="text-sm font-bold py-2 btn-press"
        style="color: var(--text-tertiary)"
      >{{ t('register.skip') }}</button>
    </div>

    <!-- Step 2: Verify -->
    <div v-if="step === 2" class="flex flex-col gap-4">
      <div class="rounded-2xl p-6" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
        <p class="text-xs font-bold text-center mb-1" style="color: var(--text-secondary)">
          {{ t('register.code_sent_to') }}
        </p>
        <p class="text-sm font-black text-center mb-5" style="color: var(--text-primary)">{{ phone }}</p>

        <!-- 6-digit code inputs -->
        <div class="flex gap-2 justify-center mb-4">
          <input
            v-for="(d, i) in codeInputs"
            :key="i"
            :value="codeInputs[i]"
            @input="onCodeInput(i, $event)"
            @keydown="onCodeKeydown(i, $event)"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="w-12 h-14 text-center text-xl font-black rounded-xl outline-none transition-all border-2"
            :style="{
              background: 'var(--surface-secondary)',
              color: 'var(--text-primary)',
              borderColor: codeInputs[i] ? 'var(--primary)' : 'var(--border)',
            }"
          />
        </div>

        <button
          @click="resendCode"
          class="text-xs font-bold text-primary btn-press block mx-auto"
        >{{ t('register.resend') }}</button>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-xs font-bold text-red-500 text-center">{{ error }}</p>

      <!-- Verify button -->
      <button
        @click="handleVerify"
        :disabled="isLoading || code.length !== 6"
        class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press transition-opacity"
        :class="{ 'opacity-60': isLoading || code.length !== 6 }"
        style="box-shadow: 0 6px 24px var(--primary-glow)"
      >
        {{ isLoading ? t('common.loading') : t('register.verify') }}
      </button>

      <!-- Back -->
      <button
        @click="step = 1"
        class="text-sm font-bold py-2 btn-press"
        style="color: var(--text-tertiary)"
      >{{ t('common.back') }}</button>
    </div>

  </div>
</template>
