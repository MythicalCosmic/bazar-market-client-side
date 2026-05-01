import { ref, watch } from 'vue'
import { fetchImage } from '../services/api.js'

export function useImage(srcRef) {
  const resolved = ref(null)

  async function resolve(url) {
    if (!url) { resolved.value = null; return }
    resolved.value = await fetchImage(url)
  }

  if (typeof srcRef === 'string') {
    resolve(srcRef)
  } else {
    watch(srcRef, (val) => resolve(val), { immediate: true })
  }

  return resolved
}

export function useImageSrc() {
  const cache = new Map()

  async function resolve(url) {
    if (!url) return null
    if (cache.has(url)) return cache.get(url)
    const result = await fetchImage(url)
    cache.set(url, result)
    return result
  }

  return { resolve }
}
