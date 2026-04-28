import { createApp } from 'vue'
import App from './App.vue'
import { useTelegram } from './composables/useTelegram.js'
import { useTheme } from './composables/useTheme.js'

const { init: initTelegram } = useTelegram()
const { init: initTheme } = useTheme()

initTelegram()
initTheme()

createApp(App).mount('#app')
