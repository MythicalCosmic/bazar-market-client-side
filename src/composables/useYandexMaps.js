// Yandex Maps JS API (2.1) loader. The SDK is injected on first use rather than
// in index.html so the catalog pages never pay for it. Views call ensureYmaps()
// and get back a ready `window.ymaps` namespace.
const API_KEY = '0b9a1746-ef15-4465-bd05-61b6d2d908e6'

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

// Reverse-geocode coordinates → human-readable address line. Returns '' on miss.
export async function reverseGeocode(ymaps, coords) {
  const res = await ymaps.geocode(coords, { results: 1 })
  const obj = res.geoObjects.get(0)
  return obj ? obj.getAddressLine() : ''
}
