import { get, post, patch, publicGet } from './http.js'

// ── Image URL helper ──

function imageUrl(url) {
  if (!url) return null
  // Proxy through same origin to fix Telegram WebView on Android
  // Handles both http:// and https:// URLs from the API
  if (url.includes('files.bazarmarket.org/files/')) {
    return url.replace(/https?:\/\/files\.bazarmarket\.org\/files\//, '/files/')
  }
  return url
}

// ── Adapters ──

function transformProduct(raw) {
  const price = parseFloat(raw.price) || 0
  const discountedPrice = raw.discounted_price ? parseFloat(raw.discounted_price) : null
  const discount = raw.discount || null

  return {
    id: raw.id || raw.product_id,
    name: { uz: raw.name_uz || '', ru: raw.name_ru || '' },
    description: { uz: raw.description_uz || '', ru: raw.description_ru || '' },
    price,
    discountedPrice: discountedPrice && discountedPrice < price ? discountedPrice : null,
    discount: discount ? {
      id: discount.discount_id,
      name: discount.discount_name,
      type: discount.discount_type,
      value: discount.discount_value,
      amount: parseFloat(discount.discount_amount) || 0,
    } : null,
    image: imageUrl(raw.image),
    badge: raw.is_featured ? 'HOT' : (discountedPrice && discountedPrice < price ? 'SALE' : null),
    category: raw.category_id,
    categoryName: raw.category_name || '',
    isFeatured: raw.is_featured || false,
    inStock: raw.in_stock !== false,
    unit: raw.unit || 'piece',
    stockQty: raw.stock_qty ? parseFloat(raw.stock_qty) : null,
    step: raw.step ? parseFloat(raw.step) : (['kg', 'liter'].includes(raw.unit) ? 0.1 : 1),
    minQty: raw.min_qty ? parseFloat(raw.min_qty) : (['kg', 'liter'].includes(raw.unit) ? 0.1 : 1),
    maxQty: raw.max_qty ? parseFloat(raw.max_qty) : null,
  }
}

function transformCategory(raw) {
  return {
    id: raw.id,
    name: { uz: raw.name_uz || '', ru: raw.name_ru || '' },
    image: imageUrl(raw.image),
    icon: null,
    labelKey: null,
    productCount: raw.product_count || 0,
    children: (raw.children || []).map(transformCategory),
  }
}

function transformBanner(raw) {
  return {
    id: raw.id,
    title: raw.title || '',
    subtitle: null,
    image: imageUrl(raw.image),
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
    image: imageUrl(raw.image),
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

export async function getCategoryTree() {
  const data = await publicGet('/categories/tree')
  return (Array.isArray(data) ? data : []).map(transformCategory)
}

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
  const product = transformProduct(data)
  // Detail endpoint has extra fields
  product.images = (data.images || []).map(img => ({
    id: img.id,
    image: imageUrl(img.image),
    isPrimary: img.is_primary,
  }))
  product.discounts = data.discounts || []
  return product
}

export async function getPromoBanners() {
  const data = await publicGet('/banners')
  return (Array.isArray(data) ? data : []).map(transformBanner)
}

export async function checkDelivery(lat, lng) {
  return publicGet(`/delivery/check?lat=${lat}&lng=${lng}`)
}

export async function getDeliveryInfo() {
  return publicGet('/delivery/info')
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

export async function getRewards() {
  const data = await get('/rewards')
  return Array.isArray(data) ? data : []
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
