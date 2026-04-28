import { ref, reactive } from 'vue'

const tg = window.Telegram?.WebApp || null
const isAvailable = !!tg

const user = reactive(
  tg?.initDataUnsafe?.user || {
    id: 0,
    first_name: 'Guest',
    last_name: '',
    username: '',
    photo_url: '',
  }
)

const colorScheme = ref(tg?.colorScheme || 'light')
const viewportHeight = ref(tg?.viewportHeight || window.innerHeight)
const viewportStableHeight = ref(tg?.viewportStableHeight || window.innerHeight)

function init() {
  if (!tg) return

  tg.ready()
  tg.expand()

  try { tg.disableVerticalSwipes?.() } catch {}

  tg.onEvent?.('viewportChanged', () => {
    viewportHeight.value = tg.viewportHeight
    viewportStableHeight.value = tg.viewportStableHeight
  })

  tg.onEvent?.('themeChanged', () => {
    colorScheme.value = tg.colorScheme
  })
}

function haptic(type = 'impact', style = 'light') {
  try {
    if (!tg?.HapticFeedback) return
    if (type === 'impact') tg.HapticFeedback.impactOccurred(style)
    else if (type === 'notification') tg.HapticFeedback.notificationOccurred(style)
    else if (type === 'selection') tg.HapticFeedback.selectionChanged()
  } catch {}
}

function showBackButton(callback) {
  if (!tg?.BackButton) return
  tg.BackButton.show()
  tg.BackButton.onClick(callback)
}

function hideBackButton() {
  if (!tg?.BackButton) return
  tg.BackButton.hide()
  tg.BackButton.offClick()
}

function close() {
  if (tg) tg.close()
}

export function useTelegram() {
  return {
    tg,
    isAvailable,
    user,
    colorScheme,
    viewportHeight,
    viewportStableHeight,
    init,
    haptic,
    showBackButton,
    hideBackButton,
    close,
  }
}
