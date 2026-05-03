import { ref } from 'vue'
import { getProducts, getCategoryTree, getFeaturedProducts, getPromoBanners } from '../services/api.js'

export const products = ref([])
export const categories = ref([])
export const featuredProducts = ref([])
export const banners = ref([])
export const categoryProducts = ref({}) // { categoryId: Product[] }
export const isLoading = ref(false)

let loadedAt = 0
const STALE_MS = 5 * 60 * 1000

export async function loadProducts(force = false) {
  if (!force && loadedAt && Date.now() - loadedAt < STALE_MS) return
  isLoading.value = true
  try {
    const [cats, featured, bans] = await Promise.all([
      getCategoryTree(),
      getFeaturedProducts(),
      getPromoBanners(),
    ])
    categories.value = cats
    featuredProducts.value = featured
    banners.value = bans

    // Load products for each category (first 10 per category for homepage)
    const catProds = {}
    await Promise.all(
      cats.map(async (cat) => {
        const childIds = (cat.children || []).map(c => c.id)
        const allIds = [cat.id, ...childIds]
        const results = await Promise.all(
          allIds.map(id => getProducts({ category_id: id, per_page: 10 }).catch(() => ({ items: [] })))
        )
        const seen = new Set()
        const merged = []
        for (const result of results) {
          for (const product of (result.items || [])) {
            if (!seen.has(product.id) && merged.length < 10) {
              seen.add(product.id)
              merged.push(product)
            }
          }
        }
        catProds[cat.id] = merged
      })
    )
    categoryProducts.value = catProds

    // Flatten all for the "products" ref (used by search etc)
    const allProds = Object.values(catProds).flat()
    const seen = new Set()
    products.value = allProds.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })

    loadedAt = Date.now()
  } catch {
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
  categoryProducts.value = {}
}
