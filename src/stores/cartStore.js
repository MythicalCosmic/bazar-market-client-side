import { reactive, computed, ref } from 'vue'
import { getCart, addToCartAPI, updateCartAPI, removeFromCartAPI, clearCartAPI, getDeliveryInfo } from '../services/api.js'
import { getToken } from '../services/http.js'
import { useToast } from '../composables/useToast.js'
import { setStoreHours } from '../composables/useStoreHours.js'
import { onLogout, onLogin } from './authStore.js'

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

// ── Buy-by-sum metadata ──
// The customer buys a weighed item by MONEY ("give me 5 000 so'm of apples"),
// not by weight. The backend cart only stores weight, so the chosen UZS amount
// is kept here, keyed by productId, persisted so it survives a reload, pruned
// to the live cart on server load, and wiped on logout/clear. This amount is
// what we show the customer and the admins — the weight is just derived.
const SUMS_KEY = 'bazar-cart-sums'
export const MIN_SUM = 1000        // smallest amount the customer may enter (so'm)
const MIN_WEIGHT = 0.001           // never round a paid amount down to "nothing"

function loadSums() {
  try {
    const obj = JSON.parse(localStorage.getItem(SUMS_KEY) || '{}')
    return obj && typeof obj === 'object' ? obj : {}
  } catch { return {} }
}

const sumOrders = reactive(loadSums())

function persistSums() {
  try { localStorage.setItem(SUMS_KEY, JSON.stringify(sumOrders)) } catch {}
}
function setSum(productId, amount) { sumOrders[String(productId)] = amount; persistSums() }
function clearSum(productId) {
  const k = String(productId)
  if (k in sumOrders) { delete sumOrders[k]; persistSums() }
}
function wipeSums() {
  for (const k of Object.keys(sumOrders)) delete sumOrders[k]
  persistSums()
}
function pruneSums(validIds) {
  let changed = false
  for (const k of Object.keys(sumOrders)) {
    if (!validIds.has(k)) { delete sumOrders[k]; changed = true }
  }
  if (changed) persistSums()
}

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
  // Drop any by-sum tags whose product is no longer in the cart.
  pruneSums(new Set(state.items.map(i => String(i.id))))
}

function resetCart() {
  state.items = []
  state.discount = 0
  state.appliedCoupon = null
  for (const t of debounces.values()) clearTimeout(t)
  debounces.clear()
  wipeSums()
}

onLogout(resetCart)

// On login, push the guest cart (built up in memory while logged out) to the
// server so checkout doesn't place an order against an empty server-side cart.
// Items already on the server are left alone, then we reconcile with truth.
async function mergeGuestCartIntoServer() {
  if (!getToken()) return
  const guestItems = state.items.slice()
  try {
    if (guestItems.length) {
      let serverIds = new Set()
      try {
        const server = await getCart()
        serverIds = new Set((server.items || []).map(i => i.id))
      } catch {}
      for (const item of guestItems) {
        if (serverIds.has(item.id)) continue
        try { await addToCartAPI(item.id, item.quantity) } catch {}
      }
    }
    await loadCartImpl()
  } catch {}
}

onLogin(mergeGuestCartIntoServer)

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
      // Use the API value when present — including a legitimate 0 (free
      // delivery). Only fall back to the default when it's missing/non-numeric.
      const fee = parseFloat(data.default_delivery_fee)
      state.deliveryCost = Number.isFinite(fee) ? fee : DEFAULT_DELIVERY
      const min = parseFloat(data.min_order_total)
      state.minOrderTotal = Number.isFinite(min) ? min : DEFAULT_MIN_ORDER
      // API-ready: pick up working hours if the backend starts returning them.
      // Falls back to the defaults in config.js when absent (current behaviour).
      setStoreHours(data.opens_at ?? data.open_time, data.closes_at ?? data.close_time)
    } catch {}
  }

  function addToCart(product) {
    // A plain +1 tap means the customer is counting in units now, not money.
    clearSum(product.id)
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
    clearSum(productId)
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
    clearSum(productId)
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
    wipeSums()
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
    clearSum(productId) // typing a weight overrides any by-sum intent
    item.quantity = qty
    if (getToken()) {
      syncQty(productId, qty, () => { item.quantity = oldQty })
    }
  }

  // ── Buy by sum ──
  // The customer enters a MONEY amount in so'm; we set the line to the weight
  // that amount buys at the unit price and remember the amount so the cart,
  // checkout and admin note all show the money — not grams. Enforces the
  // MIN_SUM floor, never rounds the weight down to nothing, and skips setQty's
  // step/min snapping (the cart API accepts any decimal-string quantity).
  function setBySum(product, rawAmount) {
    const amount = Math.max(MIN_SUM, Math.round(parseFloat(String(rawAmount).replace(',', '.')) || 0))
    const unitPrice = (product.discountedPrice && product.discountedPrice < product.price)
      ? product.discountedPrice : product.price
    if (!(unitPrice > 0)) return
    const weight = Math.max(round(amount / unitPrice), MIN_WEIGHT)

    const existing = state.items.find((i) => i.id === product.id)
    if (existing) {
      const oldQty = parseFloat(existing.quantity) || 0
      existing.quantity = weight
      if (getToken()) syncQty(product.id, weight, () => { existing.quantity = oldQty })
    } else {
      const step = product.step || (['kg', 'liter'].includes(product.unit) ? 0.1 : 1)
      state.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        discountedPrice: product.discountedPrice ?? null,
        image: product.image,
        unit: product.unit || 'piece',
        step,
        minQty: product.minQty || step,
        maxQty: product.maxQty ?? null,
        stockQty: product.stockQty ?? null,
        quantity: weight,
      })
      if (getToken()) {
        addToCartAPI(product.id, weight).catch(async (e) => {
          const { error } = useToast()
          error(e.message || 'Failed to add to cart')
          const idx = state.items.findIndex(i => i.id === product.id)
          if (idx !== -1) state.items.splice(idx, 1)
          clearSum(product.id)
          try { await loadCartImpl() } catch {}
        })
      }
    }
    setSum(product.id, amount) // record last — the helpers above clear it
  }

  // The so'm amount a line was bought for (null if it was bought by weight).
  function getSumOrder(productId) {
    const v = sumOrders[String(productId)]
    return v != null ? v : null
  }

  // Cart lines bought by sum, each with its chosen so'm amount attached.
  const sumOrderItems = computed(() =>
    state.items
      .filter(i => sumOrders[String(i.id)] != null)
      .map(i => ({ ...i, sumAmount: sumOrders[String(i.id)] }))
  )

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
    setBySum, getSumOrder, sumOrderItems, MIN_SUM,
    loadCart, loadDeliveryInfo, setDeliveryCost, setDiscount, clearDiscount,
    resetCart,
  }
}
