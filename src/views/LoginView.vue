<script setup>
import { ref } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useAuth } from '../stores/authStore.js'

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
  if (phoneDigits.length < 12) { error.value = t('register.invalid_phone'); return }
  if (!password.value || password.value.length < 6) { error.value = t('login.password_short'); return }
  error.value = ''
  isLoading.value = true
  const result = await login(phone.value, password.value)
  isLoading.value = false
  if (result.success) {
    navigate('home')
  } else {
    error.value = result.message || t('login.invalid_credentials')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-app)">
    <!-- Hero header -->
    <div class="relative pt-14 pb-10 flex flex-col items-center login-hero">
      <!-- Decorative orbs -->
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
      <div class="login-card">
        <h2 class="text-lg font-bold mb-0.5" style="color: var(--text-primary)">{{ t('login.title') }}</h2>
        <p class="text-xs font-medium mb-5" style="color: var(--text-tertiary)">{{ t('login.subtitle') }}</p>

        <div class="flex flex-col gap-4">
          <!-- Phone field -->
          <div>
            <label class="text-[10px] font-semibold block mb-1.5 tracking-wide uppercase" style="color: var(--text-tertiary)">{{ t('register.phone') }}</label>
            <div class="input-field">
              <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 21.73 16z" stroke-width="2"/>
              </svg>
              <input :value="phone" @input="onPhoneInput" type="tel" placeholder="+998 90 123 45 67" class="bg-transparent outline-none text-sm font-semibold flex-1 min-w-0" style="color: var(--text-primary)" />
            </div>
          </div>

          <!-- Password field -->
          <div>
            <label class="text-[10px] font-semibold block mb-1.5 tracking-wide uppercase" style="color: var(--text-tertiary)">{{ t('login.password') }}</label>
            <div class="input-field">
              <svg width="18" height="18" class="flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" :placeholder="t('login.password_placeholder')" class="bg-transparent outline-none text-sm font-semibold flex-1 min-w-0" style="color: var(--text-primary)" @keyup.enter="handleLogin" />
              <button @click="showPassword = !showPassword" class="btn-press p-1 flex-shrink-0">
                <svg v-if="!showPassword" width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>
                <svg v-else width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        <button @click="navigate('forgot-password')" class="text-xs font-semibold text-primary mt-3 btn-press">{{ t('login.forgot_password') }}</button>

        <p v-if="error" class="text-xs font-semibold text-red-500 text-center mt-3 py-2 px-3 rounded-xl" style="background: rgba(239,68,68,0.06)">{{ error }}</p>

        <button @click="handleLogin" :disabled="isLoading"
          class="w-full text-white font-bold py-4 rounded-2xl btn-press mt-5 transition-opacity login-submit"
          :class="{ 'opacity-60': isLoading }">
          {{ isLoading ? t('common.loading') : t('login.button') }}
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3 my-5 px-4">
        <div class="flex-1 h-px" style="background: var(--border)"></div>
        <span class="text-[10px] font-semibold" style="color: var(--text-tertiary)">{{ t('login.or') }}</span>
        <div class="flex-1 h-px" style="background: var(--border)"></div>
      </div>

      <!-- Register & Skip -->
      <button @click="navigate('register')" class="w-full py-4 rounded-2xl font-bold text-sm btn-press register-btn">{{ t('login.no_account') }}</button>
      <button @click="navigate('home')" class="w-full text-sm font-medium py-3 mt-2 btn-press" style="color: var(--text-tertiary)">{{ t('register.skip') }}</button>
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
