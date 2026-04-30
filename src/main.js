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

const { loadDeliveryInfo } = useCartStore()
loadDeliveryInfo()

createApp(App).mount('#app')
