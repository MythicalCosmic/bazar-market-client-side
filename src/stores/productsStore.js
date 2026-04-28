import { ref } from 'vue'
import { getProducts, getCategories, getFeaturedProducts, getPromoBanners } from '../services/api.js'

export const products = ref([])
export const categories = ref([])
export const featuredProducts = ref([])
export const banners = ref([])
export const isLoading = ref(false)

let loaded = false

export async function loadProducts() {
  if (loaded) return
  isLoading.value = true
  try {
    const [cats, prods, featured, bans] = await Promise.all([
      getCategories(),
      getProducts(),
      getFeaturedProducts(),
      getPromoBanners(),
    ])
    categories.value = cats
    products.value = prods
    featuredProducts.value = featured
    banners.value = bans
    loaded = true
  } finally {
    isLoading.value = false
  }
}
