import { ref, computed } from 'vue'
import uz from './uz.js'
import ru from './ru.js'
import en from './en.js'

const messages = { uz, ru, en }
const locale = ref(localStorage.getItem('bazar-locale') || 'uz')

export const LOCALES = [
  { code: 'uz', label: "O'z" },
  { code: 'ru', label: 'Рус' },
  { code: 'en', label: 'Eng' },
]

export function useI18n() {
  function t(key, params) {
    let str = messages[locale.value]?.[key] || messages['uz']?.[key] || key
    if (params) {
      Object.keys(params).forEach((k) => {
        str = str.replace(`{${k}}`, params[k])
      })
    }
    return str
  }

  function setLocale(code) {
    locale.value = code
    localStorage.setItem('bazar-locale', code)
    document.documentElement.lang = code
  }

  function getLocalizedName(obj) {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    return obj[locale.value] || obj['uz'] || obj['en'] || ''
  }

  return { t, locale, setLocale, getLocalizedName }
}
