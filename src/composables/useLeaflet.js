// Leaflet is loaded as a script tag in index.html. This composable provides
// a single load-and-wait helper so views never reach for `window.L` blind.
let readyPromise = null

export function ensureLeaflet(timeout = 5000) {
  if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L)
  if (readyPromise) return readyPromise

  readyPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'))
    if (window.L) return resolve(window.L)

    const start = Date.now()
    const interval = setInterval(() => {
      if (window.L) {
        clearInterval(interval)
        resolve(window.L)
      } else if (Date.now() - start > timeout) {
        clearInterval(interval)
        readyPromise = null
        reject(new Error('Leaflet failed to load'))
      }
    }, 50)
  })
  return readyPromise
}
