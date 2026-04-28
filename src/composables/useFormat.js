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

  return { formatPrice, formatNum }
}
