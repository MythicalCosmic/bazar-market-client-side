<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { user, verifyCode, sendCode } = useAuth()

const code = ref('')
const codeInputs = ref(['', '', '', '', '', ''])
const isLoading = ref(false)
const error = ref('')
const codeSent = ref(false)

async function handleSendCode() {
  isLoading.value = true
  error.value = ''
  const result = await sendCode()
  isLoading.value = false
  if (result.success) {
    codeSent.value = true
  } else {
    error.value = result.message || ''
  }
}

function onCodeInput(idx, e) {
  const val = e.target.value.replace(/\D/g, '')
  codeInputs.value[idx] = val.slice(0, 1)
  if (val && idx < 5) e.target.parentElement.children[idx + 1]?.focus()
  code.value = codeInputs.value.join('')
}

function onCodeKeydown(idx, e) {
  if (e.key === 'Backspace' && !codeInputs.value[idx] && idx > 0) e.target.parentElement.children[idx - 1]?.focus()
}

async function handleVerify() {
  if (code.value.length !== 6) { error.value = t('register.enter_code'); return }
  error.value = ''
  isLoading.value = true
  const result = await verifyCode(code.value)
  isLoading.value = false
  if (result.success) {
    navigate('home')
  } else {
    error.value = result.message || t('register.wrong_code')
  }
}

async function resendCode() {
  codeInputs.value = ['', '', '', '', '', '']
  code.value = ''
  await sendCode()
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-app)">
    <!-- Header -->
    <div class="relative pt-12 pb-8 flex flex-col items-center" style="background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 0 0 32px 32px;">
      <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm" style="box-shadow: 0 8px 32px rgba(0,0,0,0.15)">
        <svg width="32" height="32" class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
        </svg>
      </div>
      <h1 class="text-white text-2xl font-black">{{ t('verify.title') }}</h1>
      <p class="text-white/70 text-xs font-semibold mt-1 text-center max-w-[260px]">{{ t('verify.subtitle') }}</p>
    </div>

    <div class="flex-1 px-4 -mt-4">
      <!-- Step 1: Send code -->
      <div v-if="!codeSent">
        <div class="rounded-2xl p-6" style="background: var(--surface); box-shadow: 0 4px 24px var(--shadow-lg)">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
              <svg width="24" height="24" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-black" style="color: var(--text-primary)">{{ user?.phone || '' }}</p>
              <p class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('verify.will_receive_sms') }}</p>
            </div>
          </div>

          <p v-if="error" class="text-xs font-bold text-red-500 mb-3">{{ error }}</p>

          <button @click="handleSendCode" :disabled="isLoading"
            class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press transition-opacity"
            :class="{ 'opacity-60': isLoading }"
            style="box-shadow: 0 6px 24px var(--primary-glow)">
            {{ isLoading ? t('common.loading') : t('verify.send_sms') }}
          </button>
        </div>

        <button @click="navigate('profile')" class="w-full text-sm font-bold py-3 mt-4 btn-press" style="color: var(--text-tertiary)">{{ t('common.back') }}</button>
      </div>

      <!-- Step 2: Enter code -->
      <div v-else>
        <div class="rounded-2xl p-6" style="background: var(--surface); box-shadow: 0 4px 24px var(--shadow-lg)">
          <p class="text-xs font-bold text-center mb-1" style="color: var(--text-secondary)">{{ t('register.code_sent_to') }}</p>
          <p class="text-sm font-black text-center mb-5" style="color: var(--text-primary)">{{ user?.phone || '' }}</p>

          <div class="flex gap-2 justify-center mb-4">
            <input v-for="(d, i) in codeInputs" :key="i" :value="codeInputs[i]"
              @input="onCodeInput(i, $event)" @keydown="onCodeKeydown(i, $event)"
              type="text" inputmode="numeric" maxlength="1"
              class="w-12 h-14 text-center text-xl font-black rounded-xl outline-none transition-all border-2"
              :style="{ background: 'var(--surface-secondary)', color: 'var(--text-primary)', borderColor: codeInputs[i] ? 'var(--primary)' : 'var(--border)' }" />
          </div>

          <button @click="resendCode" class="text-xs font-bold text-primary btn-press block mx-auto">{{ t('register.resend') }}</button>
        </div>

        <p v-if="error" class="text-xs font-bold text-red-500 text-center mt-3">{{ error }}</p>

        <button @click="handleVerify" :disabled="isLoading || code.length !== 6"
          class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press mt-4 transition-opacity"
          :class="{ 'opacity-60': isLoading || code.length !== 6 }"
          style="box-shadow: 0 6px 24px var(--primary-glow)">
          {{ isLoading ? t('common.loading') : t('register.verify') }}
        </button>

        <button @click="codeSent = false" class="w-full text-sm font-bold py-3 mt-2 btn-press" style="color: var(--text-tertiary)">{{ t('common.back') }}</button>
      </div>
    </div>
  </div>
</template>
