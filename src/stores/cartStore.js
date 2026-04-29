import { reactive, computed, ref } from 'vue'
import { getCart, addToCartAPI, updateCartAPI, removeFromCartAPI, clearCartAPI } from '../services/api.js'
import { getToken } from '../services/http.js'

const state = reactive({
  items: [],
  deliveryCost: 0,
  discount: 0,
})

const syncing = ref(false)

export function useCartStore() {
  const cartItems    = computed(() => state.items)
  const totalCount   = computed(() => state.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0))
  const subtotal     = computed(() => state.items.reduce((s, i) => s + (i.price * (parseFloat(i.quantity) || 0)), 0))
  const total        = computed(() => subtotal.value - state.discount + state.deliveryCost)
  const deliveryCost = computed(() => state.deliveryCost)
  const discount     = computed(() => state.discount)

  async function loadCart() {
    if (!getToken()) return
    try {
      const data = await getCart()
      state.items = data.items || []
    } catch {}
  }

  function addToCart(product) {
    const existing = state.items.find((i) => i.id === product.id)
    if (existing) {
      existing.quantity = (parseFloat(existing.quantity) || 0) + 1
    } else {
      state.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit || 'piece',
        quantity: 1,
      })
    }
    if (getToken()) {
      addToCartAPI(product.id, 1).catch(() => loadCart())
    }
  }

  function decrement(productId) {
    const item = state.items.find((i) => i.id === productId)
    if (!item) return
    const qty = (parseFloat(item.quantity) || 0)
    if (qty > 1) {
      item.quantity = qty - 1
      if (getToken()) {
        updateCartAPI(productId, qty - 1).catch(() => loadCart())
      }
    } else {
      state.items.splice(state.items.indexOf(item), 1)
      if (getToken()) {
        removeFromCartAPI(productId).catch(() => loadCart())
      }
    }
  }

  function deleteItem(productId) {
    const idx = state.items.findIndex((i) => i.id === productId)
    if (idx !== -1) state.items.splice(idx, 1)
    if (getToken()) {
      removeFromCartAPI(productId).catch(() => loadCart())
    }
  }

  function clearCart() {
    state.items.splice(0)
    if (getToken()) {
      clearCartAPI().catch(() => {})
    }
  }

  function getQty(productId) {
    const item = state.items.find((i) => i.id === productId)
    return item ? (parseFloat(item.quantity) || 0) : 0
  }

  function setDeliveryCost(cost) {
    state.deliveryCost = cost
  }

  function setDiscount(d) {
    state.discount = d
  }

  return {
    cartItems, totalCount, subtotal, total,
    deliveryCost, discount, syncing,
    addToCart, decrement, deleteItem, clearCart, getQty,
    loadCart, setDeliveryCost, setDiscount,
  }
}
