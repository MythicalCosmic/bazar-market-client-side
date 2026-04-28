import { reactive, computed } from 'vue'

const state = reactive({
  items: [],
  deliveryCost: 10000,
  discount: 8000,
})

export function useCartStore() {
  const cartItems    = computed(() => state.items)
  const totalCount   = computed(() => state.items.reduce((s, i) => s + i.quantity, 0))
  const subtotal     = computed(() => state.items.reduce((s, i) => s + i.price * i.quantity, 0))
  const total        = computed(() => subtotal.value - state.discount + state.deliveryCost)
  const deliveryCost = computed(() => state.deliveryCost)
  const discount     = computed(() => state.discount)

  function addToCart(product) {
    const existing = state.items.find((i) => i.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      state.items.push({ ...product, quantity: 1 })
    }
  }

  function decrement(productId) {
    const item = state.items.find((i) => i.id === productId)
    if (!item) return
    if (item.quantity > 1) {
      item.quantity--
    } else {
      state.items.splice(state.items.indexOf(item), 1)
    }
  }

  function deleteItem(productId) {
    const idx = state.items.findIndex((i) => i.id === productId)
    if (idx !== -1) state.items.splice(idx, 1)
  }

  function clearCart() {
    state.items.splice(0)
  }

  function getQty(productId) {
    return state.items.find((i) => i.id === productId)?.quantity ?? 0
  }

  return {
    cartItems, totalCount, subtotal, total,
    deliveryCost, discount,
    addToCart, decrement, deleteItem, clearCart, getQty,
  }
}
