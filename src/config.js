// ── App-wide configuration / single source of truth ──
//
// Contact details and store working hours live here so every screen (Support,
// Orders, Checkout) shows the same values. Working hours are also "API-ready":
// loadDeliveryInfo() in the cart store will override the defaults below if the
// backend ever starts returning them on /delivery/info.

export const SUPPORT_PHONE = '+998 77 709 00 30'
export const SUPPORT_TELEGRAM = '@mythical_cosmic'

// Store is physically in Uzbekistan — gate ordering against Tashkent wall-clock
// time, not the customer's device timezone.
export const STORE_TIMEZONE = 'Asia/Tashkent'

// Defaults match what the storefront has always advertised (09:00–22:00, daily).
export const DEFAULT_OPEN_TIME = '09:00'
export const DEFAULT_CLOSE_TIME = '22:00'

// tel: / t.me targets derived from the display values above.
export const SUPPORT_PHONE_HREF = 'tel:' + SUPPORT_PHONE.replace(/[^\d+]/g, '')
export const SUPPORT_TELEGRAM_HREF = 'https://t.me/' + SUPPORT_TELEGRAM.replace(/^@/, '')
