import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { useTelegram } from './composables/useTelegram.js'
import { useTheme } from './composables/useTheme.js'
import { initAuth } from './stores/authStore.js'
import { useCartStore } from './stores/cartStore.js'

const { init: initTelegram } = useTelegram()
const { init: initTheme } = useTheme()

initTelegram()
initTheme()
initAuth()

// ?ref=CODE / Telegram start_param ref_CODE — capture for first-order reward.
// Cap length and charset to avoid storing arbitrary attacker-supplied content.
const REFERRAL_RE = /^[A-Za-z0-9_-]{1,32}$/
try {
  const urlParams = new URLSearchParams(window.location.search)
  let refCode = urlParams.get('ref') || urlParams.get('start')?.replace(/^ref_/, '')
  if (refCode && REFERRAL_RE.test(refCode)) {
    localStorage.setItem('bazar-pending-referral', refCode)
  }
} catch {}

const { loadDeliveryInfo } = useCartStore()
loadDeliveryInfo()

createApp(App).mount('#app')
