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

// Haversine distance in metres between two [lat, lng] points.
function distMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Accept a house-level match only when it sits within this many metres of the
// requested point. Reverse geocoders happily return the *nearest* building even
// when it's across a field — beyond this radius the number would be wrong, so we
// keep the street-level line instead.
const HOUSE_SNAP_M = 80

// --- Yandex HTTP GeoObject accessors -------------------------------------------
function yObjKind(obj) { return obj?.metaDataProperty?.GeocoderMetaData?.kind || '' }
function yObjLine(obj) { return obj?.metaDataProperty?.GeocoderMetaData?.text || obj?.name || '' }
function yObjHouse(obj) {
  const comps = obj?.metaDataProperty?.GeocoderMetaData?.Address?.Components || []
  return comps.find((c) => c.kind === 'house')?.name || ''
}
function yObjCoords(obj) {
  const pos = obj?.Point?.pos // "lng lat"
  if (!pos) return null
  const [lng, lat] = pos.split(' ').map(Number)
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
}

// Fetch the first GeoObject from the HTTP Geocoder for a fully-built URL.
async function yandexFetchObj(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`geocoder HTTP ${res.status}`)
  const data = await res.json()
  return data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject || null
}

// HTTP Geocoder API (geocode-maps.yandex.ru). Returns '' when nothing matches,
// throws on transport/auth errors so the retry loop can react.
async function httpReverseGeocode(coords, lang) {
  const [lat, lng] = coords
  const base = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_KEY}`
    + `&geocode=${lng},${lat}&format=json&results=1&lang=${lang}`

  // General match: the most precise toponym Yandex has for the point.
  const general = await yandexFetchObj(base)
  if (!general) return ''
  let line = yObjLine(general)

  // When that match is a street/district (no building number) ask specifically
  // for the nearest house and adopt its line — but only if it's close enough to
  // actually be this point's building.
  if (!yObjHouse(general) && (yObjKind(general) === 'street' || yObjKind(general) === 'district')) {
    try {
      const house = await yandexFetchObj(`${base}&kind=house`)
      const hCoords = yObjCoords(house)
      if (house && yObjHouse(house) && hCoords && distMeters(coords, hCoords) <= HOUSE_SNAP_M) {
        line = yObjLine(house) || line
      }
    } catch { /* keep the general line */ }
  }
  return line
}

// JS API geocoder (uses the map key). Used when no dedicated geocoder key is set.
async function ymapsReverseGeocode(ymaps, coords) {
  const res = await ymaps.geocode(coords, { results: 1 })
  const obj = res.geoObjects.get(0)
  if (!obj) return ''
  let line = obj.getAddressLine() || assembleAddress(obj)

  // No building number on the closest match → ask for the nearest house and use
  // it when it snaps close to the requested point.
  const premise = (() => { try { return (obj.getPremiseNumber && obj.getPremiseNumber()) || '' } catch { return '' } })()
  if (!premise) {
    try {
      const hres = await ymaps.geocode(coords, { results: 1, kind: 'house' })
      const hobj = hres.geoObjects.get(0)
      const hCoords = hobj?.geometry?.getCoordinates?.()
      if (hobj && hCoords && distMeters(coords, hCoords) <= HOUSE_SNAP_M) {
        line = hobj.getAddressLine() || line
      }
    } catch { /* keep the closest-match line */ }
  }
  return line
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
  const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=10`)
  if (!res.ok) throw new Error(`photon HTTP ${res.status}`)
  const data = await res.json()
  const feats = data?.features || []
  if (!feats.length) return ''

  // Prefer the nearest feature that carries a house number (within snap range);
  // otherwise fall back to the closest feature Photon returned.
  let best = null
  for (const f of feats) {
    if (!f?.properties?.housenumber) continue
    const g = f.geometry?.coordinates // [lng, lat]
    const fc = g ? [g[1], g[0]] : null
    const d = fc ? distMeters(coords, fc) : Infinity
    if (d <= HOUSE_SNAP_M && (!best || d < best.d)) best = { props: f.properties, d }
  }
  return photonLine(best ? best.props : feats[0].properties)
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
//
// Two-stage lookup: a quick high-accuracy fix first, then a coarse retry with a
// longer timeout. Desktop/laptop browsers have no GPS, so the high-accuracy pass
// often just times out waiting for a satellite fix — the low-accuracy pass then
// resolves fine from wifi/IP. We only give up after both fail.
//
// Rejects with a `.code` so callers can tell apart: 1 = permission denied,
// 2 = position unavailable, 3 = timeout, undefined = API/secure-context missing.
export function locateMe() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'))
      return
    }
    // Geolocation only works in a secure context (https or localhost). Surfacing
    // this early avoids a confusing silent timeout when testing over a LAN IP.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      const err = new Error('Geolocation requires a secure (https) context')
      err.code = 2
      reject(err)
      return
    }

    const ok = (pos) => resolve([pos.coords.latitude, pos.coords.longitude])

    // Second attempt: coarse but reliable (wifi/IP), generous timeout.
    const coarse = (firstErr) => {
      navigator.geolocation.getCurrentPosition(
        ok,
        () => reject(firstErr), // report the first, usually more specific, error
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 },
      )
    }

    // First attempt: precise, short. A denied permission won't change on retry,
    // so fail fast instead of waiting out the coarse pass.
    navigator.geolocation.getCurrentPosition(
      ok,
      (err) => { if (err && err.code === 1) reject(err); else coarse(err) },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 },
    )
  })
}
