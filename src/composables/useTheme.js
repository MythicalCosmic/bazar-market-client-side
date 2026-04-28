import { ref, watch } from 'vue'
import { useTelegram } from './useTelegram.js'

const mode = ref(localStorage.getItem('bazar-theme') || 'auto')
const isDark = ref(false)

function applyTheme() {
  const { colorScheme } = useTelegram()
  let dark = false

  if (mode.value === 'dark') {
    dark = true
  } else if (mode.value === 'light') {
    dark = false
  } else {
    dark = colorScheme.value === 'dark'
  }

  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
}

function setTheme(newMode) {
  mode.value = newMode
  localStorage.setItem('bazar-theme', newMode)
  applyTheme()
}

function toggleDark() {
  setTheme(isDark.value ? 'light' : 'dark')
}

function init() {
  const { colorScheme } = useTelegram()
  applyTheme()
  watch(colorScheme, () => {
    if (mode.value === 'auto') applyTheme()
  })
}

export function useTheme() {
  return { isDark, mode, setTheme, toggleDark, init }
}
