<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'
import { images } from '../assets/images.js'

const { navigate } = useRouter()
const { t } = useI18n()
const { login } = useAuth()

const phone = ref('+998 ')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')

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

async function handleLogin() {
  const phoneDigits = phone.value.replace(/\D/g, '')
  if (phoneDigits.length < 12) {
    error.value = t('register.invalid_phone')
    return
  }
  if (!password.value || password.value.length < 4) {
    error.value = t('login.password_short')
    return
  }
  error.value = ''
  isLoading.value = true
  const result = await login(phone.value, password.value)
  isLoading.value = false
  if (result.success) {
    navigate('home')
  } else {
    error.value = t('login.invalid_credentials')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-app)">

    <!-- Top branded area -->
    <div class="relative pt-12 pb-8 flex flex-col items-center" style="background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 0 0 32px 32px;">
      <div class="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm"
        style="box-shadow: 0 8px 32px rgba(0,0,0,0.15)">
        <img :src="images.logo" alt="Bazar Market" class="w-14 h-14 object-contain" />
      </div>
      <h1 class="text-white text-2xl font-black tracking-wide">BAZAR MARKET</h1>
      <p class="text-white/70 text-xs font-semibold mt-1">{{ t('login.welcome') }}</p>
      <div class="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/5"></div>
      <div class="absolute bottom-8 right-6 w-10 h-10 rounded-full bg-white/5"></div>
    </div>

    <!-- Form -->
    <div class="flex-1 px-4 -mt-4">
      <div class="rounded-2xl p-5" style="background: var(--surface); box-shadow: 0 4px 24px var(--shadow-lg)">
        <h2 class="text-lg font-black mb-1" style="color: var(--text-primary)">{{ t('login.title') }}</h2>
        <p class="text-xs font-semibold mb-5" style="color: var(--text-tertiary)">{{ t('login.subtitle') }}</p>

        <div class="flex flex-col gap-3.5">
          <!-- Phone -->
          <div>
            <label class="text-[10px] font-bold block mb-1.5" style="color: var(--text-tertiary)">{{ t('register.phone') }}</label>
            <div class="flex items-center rounded-xl px-4 py-3 gap-3" style="background: var(--surface-secondary)">
              <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
              </svg>
              <input :value="phone" @input="onPhoneInput" type="tel" placeholder="+998 90 123 45 67"
                class="bg-transparent outline-none text-sm font-bold flex-1 min-w-0" style="color: var(--text-primary)" />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="text-[10px] font-bold block mb-1.5" style="color: var(--text-tertiary)">{{ t('login.password') }}</label>
            <div class="flex items-center rounded-xl px-4 py-3 gap-3" style="background: var(--surface-secondary)">
              <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke-width="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" :placeholder="t('login.password_placeholder')"
                class="bg-transparent outline-none text-sm font-bold flex-1 min-w-0" style="color: var(--text-primary)" @keyup.enter="handleLogin" />
              <button @click="showPassword = !showPassword" class="btn-press p-0.5 flex-shrink-0">
                <svg v-if="!showPassword" width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/>
                </svg>
                <svg v-else width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-width="2" stroke-linecap="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button class="text-xs font-bold text-primary mt-3 btn-press">{{ t('login.forgot_password') }}</button>

        <p v-if="error" class="text-xs font-bold text-red-500 text-center mt-3">{{ error }}</p>

        <button @click="handleLogin" :disabled="isLoading"
          class="w-full bg-primary text-white font-black py-4 rounded-2xl btn-press mt-5 transition-opacity"
          :class="{ 'opacity-60': isLoading }"
          style="box-shadow: 0 6px 24px var(--primary-glow)">
          {{ isLoading ? t('common.loading') : t('login.button') }}
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3 my-5 px-4">
        <div class="flex-1 h-px" style="background: var(--border)"></div>
        <span class="text-[10px] font-bold" style="color: var(--text-tertiary)">{{ t('login.or') }}</span>
        <div class="flex-1 h-px" style="background: var(--border)"></div>
      </div>

      <button @click="navigate('register')"
        class="w-full py-4 rounded-2xl font-black text-sm btn-press"
        style="background: var(--surface); color: var(--text-primary); box-shadow: 0 2px 12px var(--shadow)">
        {{ t('login.no_account') }}
      </button>

      <button @click="navigate('home')" class="w-full text-sm font-bold py-3 mt-2 btn-press" style="color: var(--text-tertiary)">
        {{ t('register.skip') }}
      </button>
    </div>
  </div>
</template>
