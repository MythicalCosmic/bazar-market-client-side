import { reactive, computed, ref } from 'vue'
import { getCart, addToCartAPI, updateCartAPI, removeFromCartAPI, clearCartAPI, getDeliveryInfo } from '../services/api.js'
import { getToken } from '../services/http.js'
import { useToast } from '../composables/useToast.js'
import { onLogout } from './authStore.js'

const state = reactive({
  items: [],
  deliveryCost: 10000,
  minOrderTotal: 30000,
  discount: 0,
  appliedCoupon: null,
})

const syncing = ref(false)

// Per-product debounced sync — coalesces rapid increments into one round-trip
// and reloads the cart on failure so we don't trust a stale optimistic state.
const SYNC_DELAY = 250
const debounces = new Map() // productId -> timer
const DEFAULT_DELIVERY = 10000
const DEFAULT_MIN_ORDER = 30000

function round(val, decimals = 3) {
  const m = 10 ** decimals
  return Math.round(val * m) / m
}

function clearDebounce(productId) {
  const t = debounces.get(productId)
  if (t) { clearTimeout(t); debounces.delete(productId) }
}

function syncQty(productId, qty, onError) {
  clearDebounce(productId)
  debounces.set(productId, setTimeout(async () => {
    debounces.delete(productId)
    try {
      await updateCartAPI(productId, qty)
    } catch (e) {
      const { error } = useToast()
      error(e.message || 'Failed to update cart')
      onError?.()
      // Reconcile with server truth on any failure.
      try { await loadCartImpl() } catch {}
    }
  }, SYNC_DELAY))
}

async function loadCartImpl() {
  if (!getToken()) return
  const data = await getCart()
  state.items = data.items || []
}

function resetCart() {
  state.items = []
  state.discount = 0
  state.appliedCoupon = null
  for (const t of debounces.values()) clearTimeout(t)
  debounces.clear()
}

onLogout(resetCart)

export function useCartStore() {
  const cartItems    = computed(() => state.items)
  const totalCount   = computed(() => state.items.length)
  const subtotal     = computed(() => state.items.reduce((s, i) => {
    const price = i.discountedPrice ?? i.price
    return s + (price * (parseFloat(i.quantity) || 0))
  }, 0))
  const total        = computed(() => Math.max(0, subtotal.value - state.discount + state.deliveryCost))
  const deliveryCost = computed(() => state.deliveryCost)
  const discount     = computed(() => state.discount)
  const appliedCoupon = computed(() => state.appliedCoupon)

  async function loadCart() {
    try { await loadCartImpl() } catch {}
  }

  async function loadDeliveryInfo() {
    try {
      const data = await getDeliveryInfo()
      state.deliveryCost = parseFloat(data.default_delivery_fee) || DEFAULT_DELIVERY
      state.minOrderTotal = parseFloat(data.min_order_total) || DEFAULT_MIN_ORDER
    } catch {}
  }

  function addToCart(product) {
    const step = product.step || (['kg', 'liter'].includes(product.unit) ? 0.1 : 1)
    const minQty = product.minQty || step
    const existing = state.items.find((i) => i.id === product.id)

    if (existing) {
      const oldQty = parseFloat(existing.quantity) || 0
      const newQty = round(oldQty + step)
      existing.quantity = newQty
      if (getToken()) {
        syncQty(product.id, newQty, () => {
          // Best-effort revert; loadCartImpl will reconcile next.
          existing.quantity = oldQty
        })
      }
      return
    }

    const newItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice ?? null,
      image: product.image,
      unit: product.unit || 'piece',
      step,
      minQty,
      maxQty: product.maxQty ?? null,
      stockQty: product.stockQty ?? null,
      quantity: minQty,
    }
    state.items.push(newItem)
    if (getToken()) {
      addToCartAPI(product.id, minQty).catch(async (e) => {
        const { error } = useToast()
        error(e.message || 'Failed to add to cart')
        const idx = state.items.findIndex(i => i.id === product.id)
        if (idx !== -1) state.items.splice(idx, 1)
        try { await loadCartImpl() } catch {}
      })
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
        syncQty(productId, newQty, () => { item.quantity = qty })
      }
    } else {
      // Drop below min — remove the line.
      const idx = state.items.findIndex(i => i.id === productId)
      if (idx === -1) return
      const removed = state.items.splice(idx, 1)[0]
      clearDebounce(productId)
      if (getToken()) {
        removeFromCartAPI(productId).catch(async (e) => {
          const { error } = useToast()
          error(e.message || 'Failed to remove from cart')
          // Re-find by id — DON'T use stale idx; cart may have changed.
          const exists = state.items.some(i => i.id === productId)
          if (!exists) state.items.push(removed)
          try { await loadCartImpl() } catch {}
        })
      }
    }
  }

  function deleteItem(productId) {
    const idx = state.items.findIndex((i) => i.id === productId)
    if (idx === -1) return
    const removed = state.items.splice(idx, 1)[0]
    clearDebounce(productId)
    if (getToken()) {
      removeFromCartAPI(productId).catch(async (e) => {
        const { error } = useToast()
        error(e.message || 'Failed to remove item')
        const exists = state.items.some(i => i.id === productId)
        if (!exists) state.items.push(removed)
        try { await loadCartImpl() } catch {}
      })
    }
  }

  function clearCart() {
    state.items.splice(0)
    state.discount = 0
    state.appliedCoupon = null
    for (const t of debounces.values()) clearTimeout(t)
    debounces.clear()
    if (getToken()) {
      clearCartAPI().catch(() => {})
    }
  }

  function setQty(productId, rawQty) {
    const item = state.items.find((i) => i.id === productId)
    if (!item) return
    const step = item.step || 1
    const minQty = item.minQty || step
    const stockMax = item.stockQty != null ? item.stockQty : Infinity
    const hardMax = item.maxQty != null ? item.maxQty : Infinity
    const max = Math.min(stockMax, hardMax)

    const parsed = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty).replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) return

    let qty = round(Math.round(parsed / step) * step)
    if (qty < minQty) qty = minQty
    if (qty > max) qty = round(Math.floor(max / step) * step)
    if (qty <= 0) return

    const oldQty = parseFloat(item.quantity) || 0
    if (qty === oldQty) return
    item.quantity = qty
    if (getToken()) {
      syncQty(productId, qty, () => { item.quantity = oldQty })
    }
  }

  function getQty(productId) {
    const item = state.items.find((i) => i.id === productId)
    return item ? (parseFloat(item.quantity) || 0) : 0
  }

  function setDeliveryCost(cost) { state.deliveryCost = cost }

  function setDiscount(d, coupon = null) {
    state.discount = d
    state.appliedCoupon = coupon
  }

  function clearDiscount() {
    state.discount = 0
    state.appliedCoupon = null
  }

  const minOrderTotal = computed(() => state.minOrderTotal)

  return {
    cartItems, totalCount, subtotal, total,
    deliveryCost, discount, appliedCoupon, minOrderTotal, syncing,
    addToCart, decrement, deleteItem, clearCart, getQty, setQty,
    loadCart, loadDeliveryInfo, setDeliveryCost, setDiscount, clearDiscount,
    resetCart,
  }
}
