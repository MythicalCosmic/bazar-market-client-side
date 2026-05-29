<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import { getFavorites, getProduct } from '../services/api.js'
import ProductCard from '../components/ProductCard.vue'

const { navigate } = useRouter()
const { t } = useI18n()
const { loadFavorites } = useFavorites()
const { isLoggedIn } = useAuth()

const favoriteProducts = ref([])
const isLoading = ref(true)

onMounted(async () => {
  if (!isLoggedIn.value) { isLoading.value = false; return }
  await loadFavorites()
  try {
    const favItems = await getFavorites()
    const detailed = await Promise.all(
      favItems.map(item => getProduct(item.id).catch(() => item))
    )
    favoriteProducts.value = detailed
  } catch {}
  isLoading.value = false
})
</script>

<template>
  <div class="min-h-screen pb-28" style="background: var(--bg-app)">
    <!-- Header -->
    <div class="px-4 pt-4 pb-3 sticky top-0 z-20" style="background: var(--bg-app)">
      <h1 class="text-2xl font-black" style="color: var(--text-primary)">{{ t('favorites.title') }} ❤️</h1>
      <p v-if="favoriteProducts.length" class="text-xs font-semibold mt-0.5" style="color: var(--text-tertiary)">{{ favoriteProducts.length }} {{ t('cart.items_count').toLowerCase() }}</p>
    </div>

    <div class="px-4">
      <div v-if="isLoading" class="grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-[240px] rounded-2xl"></div>
      </div>
      <div v-else-if="favoriteProducts.length" class="grid grid-cols-2 gap-3">
        <ProductCard v-for="p in favoriteProducts" :key="p.id" :product="p" />
      </div>
      <div v-else class="flex flex-col items-center justify-center py-20">
        <div class="w-24 h-24 rounded-full flex items-center justify-center mb-4" style="background: var(--primary-light)">
          <svg width="40" height="40" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <p class="text-xl font-black" style="color: var(--text-primary)">{{ t('favorites.empty_title') }}</p>
        <p class="text-sm font-semibold mt-1 text-center max-w-[240px]" style="color: var(--text-tertiary)">{{ t('favorites.empty_subtitle') }}</p>
        <button v-if="isLoggedIn" @click="navigate('home')" class="mt-5 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press" style="box-shadow: 0 4px 16px var(--primary-glow)">{{ t('common.go_catalog') }}</button>
        <button v-else @click="navigate('login')" class="mt-5 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press" style="box-shadow: 0 4px 16px var(--primary-glow)">{{ t('login.button') }}</button>
      </div>
    </div>
  </div>
</template>
