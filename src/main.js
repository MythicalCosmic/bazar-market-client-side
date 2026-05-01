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

// Handle referral deep link ?ref=CODE
const urlParams = new URLSearchParams(window.location.search)
const refCode = urlParams.get('ref') || urlParams.get('start')?.replace('ref_', '')
if (refCode) {
  localStorage.setItem('bazar-pending-referral', refCode)
}

const { loadDeliveryInfo } = useCartStore()
loadDeliveryInfo()

createApp(App).mount('#app')
