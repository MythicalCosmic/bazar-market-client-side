// Yandex Maps JS API (2.1) loader. The SDK is injected on first use rather than
// in index.html so the catalog pages never pay for it. Views call ensureYmaps()
// and get back a ready `window.ymaps` namespace.
// Prefer a project-provisioned key (set VITE_YANDEX_API_KEY) so the geocoder
// quota / allowed-referrers can be managed without a code change. Falls back to
// the original embedded key.
const API_KEY = import.meta.env.VITE_YANDEX_API_KEY || 'd0b01938-b9be-4499-97f5-baa4c4928c56'

// Default delivery location: Marhamat tumani, Andijon viloyati, Uzbekistan.
export const DEFAULT_LAT = 40.4569
export const DEFAULT_LNG = 72.3144
export const DEFAULT_CENTER = [DEFAULT_LAT, DEFAULT_LNG]

let loadPromise = null

export function ensureYmaps(timeout = 15000) {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.ymaps && window.ymaps.Map) return Promise.resolve(window.ymaps)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    let settled = false
    const fail = (err) => {
      if (settled) return
      settled = true
      loadPromise = null
      reject(err)
    }
    const onLoaded = () => {
      if (window.ymaps && typeof window.ymaps.ready === 'function') {
        window.ymaps.ready(() => {
          if (settled) return
          settled = true
          resolve(window.ymaps)
        })
      } else {
        fail(new Error('Yandex Maps namespace missing'))
      }
    }

    let script = document.getElementById('yandex-maps-sdk')
    if (script) {
      onLoaded()
    } else {
      script = document.createElement('script')
      script.id = 'yandex-maps-sdk'
      script.async = true
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`
      script.onload = onLoaded
      script.onerror = () => fail(new Error('Yandex Maps failed to load'))
      document.head.appendChild(script)
    }

    setTimeout(() => fail(new Error('Yandex Maps timed out')), timeout)
  })
  return loadPromise
}

// Build a readable line from a geo object's components when getAddressLine()
// comes back empty (happens on rural/edge points). Order: street + house, then
// locality/district, dropping the country so the line stays short.
function assembleAddress(obj) {
  if (!obj) return ''
  const pick = (fn) => { try { return (obj[fn] && obj[fn]()) || '' } catch { return '' } }
  const street = pick('getThoroughfare')
  const house = pick('getPremiseNumber') || pick('getPremise')
  const locality = pick('getLocalityName')
  const admin = pick('getAdministrativeAreaName')
  const streetLine = [street, house].filter(Boolean).join(', ')
  const parts = [streetLine, locality, admin].filter(Boolean)
  // De-dup (locality sometimes repeats inside the street line) and trim.
  const seen = new Set()
  const out = []
  for (const p of parts) {
    const key = p.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out.join(', ')
}

// Small LRU-ish cache so panning back over a spot (or re-opening checkout)
// doesn't re-hit the geocoder — that quota is the scarce resource on free keys.
const geoCache = new Map()
const GEO_CACHE_MAX = 200
const cacheKey = (coords) => `${(+coords[0]).toFixed(5)},${(+coords[1]).toFixed(5)}`

function rememberGeo(key, value) {
  geoCache.set(key, value)
  if (geoCache.size > GEO_CACHE_MAX) geoCache.delete(geoCache.keys().next().value)
}

// Dedicated Geocoder API key. The map (JS API) and the geocoder are billed as
// separate Yandex services with separate keys, so the map key alone can't
// resolve addresses. When this is set we call the HTTP Geocoder directly (CORS
// is allowed), which is the reliable path; otherwise we fall back to the JS
// API's ymaps.geocode() using the map key.
const GEOCODER_KEY = import.meta.env.VITE_YANDEX_GEOCODER_KEY || ''

// HTTP Geocoder API (geocode-maps.yandex.ru). Returns '' when nothing matches,
// throws on transport/auth errors so the retry loop can react.
async function httpReverseGeocode(coords, lang) {
  const [lat, lng] = coords
  // No `kind` filter: let Yandex return its most precise match — that's the
  // house (with number) when it has one, the street otherwise.
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_KEY}`
    + `&geocode=${lng},${lat}&format=json&results=1&lang=${lang}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`geocoder HTTP ${res.status}`)
  const data = await res.json()
  const obj = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
  if (!obj) return ''
  return obj.metaDataProperty?.GeocoderMetaData?.text || obj.name || ''
}

// JS API geocoder (uses the map key). Used when no dedicated geocoder key is set.
async function ymapsReverseGeocode(ymaps, coords) {
  const res = await ymaps.geocode(coords, { results: 1 })
  const obj = res.geoObjects.get(0)
  if (!obj) return ''
  return obj.getAddressLine() || assembleAddress(obj)
}

// Build a concise line from Photon (OSM) reverse-geocode properties.
function photonLine(props) {
  if (!props) return ''
  const street = props.street || props.name || ''
  const streetLine = [street, props.housenumber].filter(Boolean).join(' ')
  const area = props.city || props.district || props.county || props.state || ''
  const parts = [streetLine || props.name, area].filter(Boolean)
  const seen = new Set()
  const out = []
  for (const p of parts) {
    const k = p.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out.join(', ')
}

// Free OSM-based reverse geocoder (Komoot Photon). No key, CORS-enabled, and
// has street-level coverage for Uzbekistan — our safety net so addresses
// resolve even without a paid/provisioned Yandex Geocoder key.
async function photonReverseGeocode(coords) {
  const [lat, lng] = coords
  const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`)
  if (!res.ok) throw new Error(`photon HTTP ${res.status}`)
  const data = await res.json()
  return photonLine(data?.features?.[0]?.properties)
}

// Reverse-geocode coordinates → human-readable address line. Tries Yandex first
// (HTTP Geocoder key if set, else the JS API map key) and falls back to the free
// Photon/OSM geocoder when Yandex returns nothing or errors. Caches results and
// logs failures so a blank result is diagnosable from the console.
export async function reverseGeocode(ymaps, coords, lang = 'ru_RU') {
  const key = cacheKey(coords)
  if (geoCache.has(key)) return geoCache.get(key)

  let line = ''
  // 1) Yandex HTTP Geocoder (dedicated key) — best UZ data incl. house numbers.
  if (GEOCODER_KEY) {
    try {
      line = await httpReverseGeocode(coords, lang)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[geocode] Yandex HTTP geocoder failed', e?.message || e)
    }
  }

  // 2) Yandex JS-API geocoder (map key) — can resolve in-browser even when the
  //    HTTP geocoder key is missing or referrer-locked. Also yields house
  //    numbers when Yandex has them.
  if (!line && ymaps) {
    try {
      line = await ymapsReverseGeocode(ymaps, coords)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[geocode] Yandex JS API geocoder failed', e?.message || e)
    }
  }

  // 3) Free OSM fallback (Photon) — street-level, no key. Covers the case where
  //    every Yandex path is unauthorised.
  if (!line) {
    try {
      line = await photonReverseGeocode(coords)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[geocode] Photon fallback failed', e?.message || e)
    }
  }

  rememberGeo(key, line || '')
  return line || ''
}

// Get the device's current position via the browser. Resolves [lat, lng].
// Rejects on denial/timeout so callers can fall back to the default center.
export function locateMe(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout, maximumAge: 30000 },
    )
  })
}
