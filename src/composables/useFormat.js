export function useFormat() {
  function formatPrice(value) {
    return new Intl.NumberFormat('ru-RU').format(value) + ' сум'
  }
  function formatNum(value) {
    return new Intl.NumberFormat('ru-RU').format(value)
  }
  return { formatPrice, formatNum }
}
