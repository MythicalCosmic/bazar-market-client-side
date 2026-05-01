import { ref } from 'vue'
import { getProducts, getCategoryTree, getFeaturedProducts, getPromoBanners } from '../services/api.js'

export const products = ref([])
export const categories = ref([])
export const featuredProducts = ref([])
export const banners = ref([])
export const isLoading = ref(false)

let loadedAt = 0
const STALE_MS = 5 * 60 * 1000 // 5 minutes

export async function loadProducts(force = false) {
  if (!force && loadedAt && Date.now() - loadedAt < STALE_MS) return
  isLoading.value = true
  try {
    const [cats, prodsResult, featured, bans] = await Promise.all([
      getCategoryTree(),
      getProducts({ per_page: 50 }),
      getFeaturedProducts(),
      getPromoBanners(),
    ])
    categories.value = cats
    products.value = prodsResult.items || prodsResult
    featuredProducts.value = featured
    banners.value = bans
    loadedAt = Date.now()
  } catch (e) {
    // Silent fail — products will show empty
  } finally {
    isLoading.value = false
  }
}

export function resetProducts() {
  loadedAt = 0
  products.value = []
  categories.value = []
  featuredProducts.value = []
  banners.value = []
}
