import { ref, computed } from 'vue'
import { getFavorites, toggleFavoriteAPI } from '../services/api.js'
import { getToken } from '../services/http.js'

const favoriteIds = ref([])
let loaded = false

export function useFavorites() {
  const favorites = computed(() => favoriteIds.value)
  const count = computed(() => favoriteIds.value.length)

  function isFavorite(productId) {
    return favoriteIds.value.includes(productId)
  }

  async function toggleFavorite(productId) {
    if (!getToken()) return 'need-auth'
    if (!productId) return

    const idx = favoriteIds.value.indexOf(productId)
    if (idx !== -1) {
      favoriteIds.value.splice(idx, 1)
    } else {
      favoriteIds.value.push(productId)
    }

    try {
      await toggleFavoriteAPI(productId)
    } catch {
      // Rollback
      const idx2 = favoriteIds.value.indexOf(productId)
      if (idx2 !== -1) favoriteIds.value.splice(idx2, 1)
      else favoriteIds.value.push(productId)
    }
  }

  async function loadFavorites() {
    if (!getToken() || loaded) return
    try {
      const items = await getFavorites()
      // API favorites return product_id, our transformProduct maps id from raw.id || raw.product_id
      favoriteIds.value = items.map(p => p.id).filter(Boolean)
      loaded = true
    } catch {}
  }

  function resetFavorites() {
    favoriteIds.value = []
    loaded = false
  }

  return { favorites, count, isFavorite, toggleFavorite, loadFavorites, resetFavorites }
}
