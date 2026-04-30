import { useI18n } from '../i18n/index.js'

export function useFormat() {
  const { t, locale } = useI18n()

  function formatPrice(value) {
    const num = new Intl.NumberFormat(locale.value === 'uz' ? 'uz-UZ' : locale.value === 'ru' ? 'ru-RU' : 'en-US').format(value)
    return `${num} ${t('currency')}`
  }

  function formatNum(value) {
    return new Intl.NumberFormat(locale.value === 'uz' ? 'uz-UZ' : locale.value === 'ru' ? 'ru-RU' : 'en-US').format(value)
  }

  function formatQty(qty, unit) {
    const q = parseFloat(qty) || 0
    if (unit === 'kg') {
      if (q < 1) return `${Math.round(q * 1000)} g`
      if (q % 1 === 0) return `${q} kg`
      return `${q} kg`
    }
    if (unit === 'liter') {
      if (q < 1) return `${Math.round(q * 1000)} ml`
      return `${q} l`
    }
    return q % 1 === 0 ? String(Math.round(q)) : String(q)
  }

  return { formatPrice, formatNum, formatQty }
}
