import { get, post, patch, publicGet } from './http.js'

// ── Adapters ──

function transformProduct(raw) {
  return {
    id: raw.id,
    name: { uz: raw.name_uz || '', ru: raw.name_ru || '' },
    description: { uz: raw.description_uz || '', ru: raw.description_ru || '' },
    price: parseFloat(raw.price) || 0,
    discountedPrice: raw.discounted_price ? parseFloat(raw.discounted_price) : null,
    image: raw.image || null,
    badge: raw.is_featured ? 'HOT' : null,
    category: raw.category_id,
    categoryName: raw.category_name || '',
    isFeatured: raw.is_featured || false,
    inStock: raw.in_stock !== false,
    unit: raw.unit || 'piece',
    step: raw.step ? parseFloat(raw.step) : 1,
    minQty: raw.min_qty ? parseFloat(raw.min_qty) : 1,
    maxQty: raw.max_qty ? parseFloat(raw.max_qty) : null,
  }
}

function transformCategory(raw) {
  return {
    id: raw.id,
    name: { uz: raw.name_uz || '', ru: raw.name_ru || '' },
    image: raw.image || null,
    icon: null,
    labelKey: null,
    productCount: raw.product_count || 0,
  }
}

function transformBanner(raw) {
  return {
    id: raw.id,
    title: raw.title || '',
    subtitle: null,
    image: raw.image || null,
    gradient: null,
    linkType: raw.link_type || 'none',
    linkValue: raw.link_value || '',
  }
}

function transformCartItem(raw) {
  return {
    id: raw.product_id,
    name: { uz: raw.name_uz || '', ru: raw.name_ru || '' },
    price: parseFloat(raw.price) || 0,
    quantity: parseFloat(raw.quantity) || 1,
    total: parseFloat(raw.total) || 0,
    image: raw.image || null,
    unit: raw.unit || 'piece',
    inStock: raw.in_stock !== false,
  }
}

function transformAddress(raw) {
  return {
    id: raw.id,
    label: raw.label || '',
    address: raw.address_text || '',
    isDefault: raw.is_default || false,
    lat: raw.latitude ? parseFloat(raw.latitude) : null,
    lng: raw.longitude ? parseFloat(raw.longitude) : null,
    entrance: raw.entrance || '',
    floor: raw.floor || '',
    apartment: raw.apartment || '',
    comment: raw.comment || '',
  }
}

function transformOrder(raw) {
  return {
    id: raw.order_number || `#ORD-${raw.id}`,
    orderId: raw.id,
    status: raw.status,
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    time: raw.created_at ? new Date(raw.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '',
    address: raw.delivery_address_text || '',
    items: (raw.items || []).map(item => ({
      name: { uz: item.product_name || item.name_uz || '', ru: item.product_name || item.name_ru || '' },
      qty: parseFloat(item.quantity) || 1,
      price: parseFloat(item.unit_price || item.price) || 0,
    })),
    total: parseFloat(raw.total) || 0,
    subtotal: parseFloat(raw.subtotal) || 0,
    deliveryFee: parseFloat(raw.delivery_fee) || 0,
    discount: parseFloat(raw.discount) || 0,
    paymentMethod: raw.payment_method || '',
    paymentStatus: raw.payment_status || '',
    userNote: raw.user_note || '',
    statusLog: raw.status_log || [],
    cancelledAt: raw.cancelled_at,
    deliveredAt: raw.delivered_at,
  }
}

// ── Catalog (Public) ──

export async function getCategories() {
  const data = await publicGet('/categories')
  return (Array.isArray(data) ? data : []).map(transformCategory)
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams()
  if (params.category_id) query.set('category_id', params.category_id)
  if (params.q) query.set('q', params.q)
  if (params.is_featured) query.set('is_featured', 'true')
  if (params.order_by) query.set('order_by', params.order_by)
  if (params.page) query.set('page', params.page)
  if (params.per_page) query.set('per_page', params.per_page)
  const qs = query.toString()
  const data = await publicGet(`/products${qs ? '?' + qs : ''}`)
  const items = data.items || data || []
  return { items: items.map(transformProduct), total: data.total || items.length, page: data.page || 1, totalPages: data.total_pages || 1 }
}

export async function getFeaturedProducts() {
  const data = await publicGet('/products/featured')
  const items = data.items || data || []
  return items.map(transformProduct)
}

export async function getPopularProducts() {
  const data = await publicGet('/products/popular')
  const items = data.items || data || []
  return items.map(transformProduct)
}

export async function searchProducts(q) {
  const data = await publicGet(`/products/search?q=${encodeURIComponent(q)}`)
  const items = data.items || data || []
  return items.map(transformProduct)
}

export async function getProduct(id) {
  const data = await publicGet(`/product/${id}`)
  return transformProduct(data)
}

export async function getPromoBanners() {
  const data = await publicGet('/banners')
  return (Array.isArray(data) ? data : []).map(transformBanner)
}

export async function checkDelivery(lat, lng) {
  return publicGet(`/delivery/check?lat=${lat}&lng=${lng}`)
}

// ── Cart ──

export async function getCart() {
  const data = await get('/cart')
  return {
    items: (data.items || []).map(transformCartItem),
    itemCount: data.item_count || 0,
    subtotal: parseFloat(data.subtotal) || 0,
  }
}

export async function addToCartAPI(productId, quantity = 1) {
  return post('/cart/add', { product_id: productId, quantity: String(quantity) })
}

export async function updateCartAPI(productId, quantity) {
  return post('/cart/update', { product_id: productId, quantity: String(quantity) })
}

export async function removeFromCartAPI(productId) {
  return post('/cart/remove', { product_id: productId })
}

export async function clearCartAPI() {
  return post('/cart/clear')
}

// ── Addresses ──

export async function getAddresses() {
  const data = await get('/addresses')
  return (Array.isArray(data) ? data : []).map(transformAddress)
}

export async function addAddressAPI(addressData) {
  return post('/address/add', addressData)
}

export async function updateAddressAPI(id, addressData) {
  return patch(`/address/${id}/update`, addressData)
}

export async function deleteAddressAPI(id) {
  return post(`/address/${id}/delete`)
}

export async function setDefaultAddressAPI(id) {
  return post(`/address/${id}/default`)
}

// ── Orders ──

export async function getOrders(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', params.page)
  const qs = query.toString()
  const data = await get(`/orders${qs ? '?' + qs : ''}`)
  const items = data.items || data || []
  return Array.isArray(items) ? items.map(transformOrder) : []
}

export async function getActiveOrders() {
  const data = await get('/orders/active')
  return (Array.isArray(data) ? data : []).map(transformOrder)
}

export async function getOrder(id) {
  const data = await get(`/order/${id}`)
  return transformOrder(data)
}

export async function placeOrder(orderData) {
  return post('/orders/place', orderData)
}

export async function cancelOrder(id, reason) {
  return post(`/order/${id}/cancel`, reason ? { reason } : {})
}

export async function reorderOrder(id) {
  return post(`/order/${id}/reorder`)
}

// ── Favorites ──

export async function getFavorites(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  const qs = query.toString()
  const data = await get(`/favorites${qs ? '?' + qs : ''}`)
  const items = data.items || data || []
  return items.map ? items.map(transformProduct) : []
}

export async function toggleFavoriteAPI(productId) {
  return post(`/favorite/${productId}/toggle`)
}

export async function checkFavoriteAPI(productId) {
  const data = await get(`/favorite/${productId}/check`)
  return data.is_favorited || false
}

// ── Coupons ──

export async function validateCoupon(code, subtotal) {
  return post('/coupon/validate', { code, subtotal })
}

// ── Referrals ──

export async function getReferral() {
  return get('/referral')
}

export async function getReferralList(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  const qs = query.toString()
  return get(`/referral/list${qs ? '?' + qs : ''}`)
}

export async function applyReferral(code) {
  return post('/referral/apply', { referral_code: code })
}

// ── Reviews ──

export async function submitReview(data) {
  return post('/review/submit', data)
}

export async function getReviews() {
  return get('/reviews')
}

// ── Notifications ──

export async function getNotifications() {
  return get('/notifications')
}

export async function getUnreadCount() {
  const data = await get('/notifications/unread-count')
  return data.unread_count || 0
}

export async function markNotificationRead(id) {
  return post(`/notification/${id}/read`)
}

export async function markAllNotificationsRead() {
  return post('/notifications/read-all')
}

// ── Profile (convenience, wraps auth) ──

export async function getUserProfile() {
  const data = await get('/auth/me')
  return {
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    phone: data.phone || '',
    verified: data.is_phone_verified || false,
    language: data.language || 'uz',
    ordersCount: 0,
    favoritesCount: 0,
    couponsCount: 0,
  }
}
