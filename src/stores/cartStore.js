import { reactive, computed, ref } from 'vue'
import { getCart, addToCartAPI, updateCartAPI, removeFromCartAPI, clearCartAPI, getDeliveryInfo } from '../services/api.js'
import { getToken } from '../services/http.js'
import { useToast } from '../composables/useToast.js'

const state = reactive({
  items: [],
  deliveryCost: 10000,
  minOrderTotal: 30000,
  discount: 0,
})

const syncing = ref(false)

function round(val, decimals = 3) {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function useCartStore() {
  const cartItems    = computed(() => state.items)
  const totalCount   = computed(() => state.items.length)
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

  async function loadDeliveryInfo() {
    try {
      const data = await getDeliveryInfo()
      state.deliveryCost = parseFloat(data.default_delivery_fee) || 10000
      state.minOrderTotal = parseFloat(data.min_order_total) || 30000
    } catch {}
  }

  function addToCart(product) {
    const step = product.step || (['kg', 'liter'].includes(product.unit) ? 0.1 : 1)
    const minQty = product.minQty || step
    const existing = state.items.find((i) => i.id === product.id)

    if (existing) {
      const oldQty = parseFloat(existing.quantity)
      existing.quantity = round(oldQty + step)
      if (getToken()) {
        updateCartAPI(product.id, existing.quantity).catch((e) => {
          existing.quantity = oldQty
          const { error } = useToast()
          error(e.message || 'Failed to update cart')
        })
      }
    } else {
      const newItem = {
        id: product.id,
        name: product.name,
        price: product.discountedPrice || product.price,
        image: product.image,
        unit: product.unit || 'piece',
        step: step,
        minQty: minQty,
        quantity: minQty,
      }
      state.items.push(newItem)
      if (getToken()) {
        addToCartAPI(product.id, minQty).catch((e) => {
          const idx = state.items.indexOf(newItem)
          if (idx !== -1) state.items.splice(idx, 1)
          const { error } = useToast()
          error(e.message || 'Failed to add to cart')
        })
      }
    }
  }

  function decrement(productId) {
    const item = state.items.find((i) => i.id === productId)
    if (!item) return
    const qty = parseFloat(item.quantity) || 0
    const step = item.step || 1
    const minQty = item.minQty || step

    if (round(qty - step) >= minQty) {
      const newQty = round(qty - step)
      item.quantity = newQty
      if (getToken()) {
        updateCartAPI(productId, newQty).catch((e) => {
          item.quantity = qty
          const { error } = useToast()
          error(e.message || 'Failed to update cart')
        })
      }
    } else {
      const idx = state.items.indexOf(item)
      state.items.splice(idx, 1)
      if (getToken()) {
        removeFromCartAPI(productId).catch((e) => {
          state.items.splice(idx, 0, { ...item, quantity: qty })
          const { error } = useToast()
          error(e.message || 'Failed to remove from cart')
        })
      }
    }
  }

  function deleteItem(productId) {
    const idx = state.items.findIndex((i) => i.id === productId)
    const removed = idx !== -1 ? state.items.splice(idx, 1)[0] : null
    if (getToken()) {
      removeFromCartAPI(productId).catch((e) => {
        if (removed) state.items.splice(idx, 0, removed)
        const { error } = useToast()
        error(e.message || 'Failed to remove item')
      })
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

  const minOrderTotal = computed(() => state.minOrderTotal)

  return {
    cartItems, totalCount, subtotal, total,
    deliveryCost, discount, minOrderTotal, syncing,
    addToCart, decrement, deleteItem, clearCart, getQty,
    loadCart, loadDeliveryInfo, setDeliveryCost, setDiscount,
  }
}
