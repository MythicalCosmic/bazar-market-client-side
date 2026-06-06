import { reactive, computed } from 'vue'
import { STORE_TIMEZONE, DEFAULT_OPEN_TIME, DEFAULT_CLOSE_TIME } from '../config.js'

// ── Store working-hours / open-closed gate ──
//
// Single shared reactive source consumed by Support (display), Checkout
// (ordering gate) and any badge. The "now" tick re-evaluates every 30s so the
// open/closed state flips on its own without a reload.

const state = reactive({
  open: DEFAULT_OPEN_TIME,
  close: DEFAULT_CLOSE_TIME,
  // Bumped by the interval below to invalidate the isOpen computed.
  tick: 0,
})

// "09:00" -> 540 (minutes since midnight). Returns null on bad input.
function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim())
  if (!m) return null
  const h = +m[1]
  const min = +m[2]
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

// Current minutes-since-midnight in the store's timezone (not the device's).
function nowMinutesInStoreTz() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: STORE_TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date())
  const h = +parts.find((p) => p.type === 'hour')?.value
  const min = +parts.find((p) => p.type === 'minute')?.value
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null
  return h * 60 + min
}

// Called from loadDeliveryInfo when/if the backend returns hours, so the gate
// tracks server config automatically. Ignores blank/invalid values.
export function setStoreHours(open, close) {
  if (toMinutes(open) != null) state.open = open
  if (toMinutes(close) != null) state.close = close
}

// One module-level timer keeps the shared state fresh for every consumer.
if (typeof setInterval === 'function') {
  setInterval(() => { state.tick++ }, 30000)
}

export function useStoreHours() {
  const openTime = computed(() => state.open)
  const closeTime = computed(() => state.close)

  const isOpen = computed(() => {
    // Touch the tick so the value recomputes on each interval fire.
    void state.tick
    const now = nowMinutesInStoreTz()
    const openMin = toMinutes(state.open)
    const closeMin = toMinutes(state.close)
    // Fail open if anything is malformed — never block ordering on a bad config.
    if (now == null || openMin == null || closeMin == null) return true
    // Same-day window (e.g. 09:00–22:00).
    if (closeMin > openMin) return now >= openMin && now < closeMin
    // Overnight window (e.g. 22:00–02:00).
    return now >= openMin || now < closeMin
  })

  return { isOpen, openTime, closeTime }
}
