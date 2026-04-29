<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useFavorites } from '../stores/favoritesStore.js'
import { useAuth } from '../stores/authStore.js'
import { getFavorites } from '../services/api.js'
import ProductCard from '../components/ProductCard.vue'

const { navigate } = useRouter()
const { t } = useI18n()
const { loadFavorites } = useFavorites()
const { isLoggedIn } = useAuth()

const favoriteProducts = ref([])
const isLoading = ref(true)

onMounted(async () => {
  if (!isLoggedIn.value) {
    isLoading.value = false
    return
  }
  await loadFavorites()
  try {
    favoriteProducts.value = await getFavorites()
  } catch {}
  isLoading.value = false
})
</script>

<template>
  <div class="min-h-screen pb-10" style="background: var(--bg-app)">
    <div class="flex items-center justify-between px-4 py-3 sticky top-0 z-20" style="background: var(--surface); box-shadow: 0 2px 12px var(--shadow)">
      <button @click="navigate('profile')" class="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style="background: var(--surface-secondary)">
        <svg class="w-5 h-5" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="text-base font-black" style="color: var(--text-primary)">{{ t('favorites.title') }}</p>
      <div class="w-9"></div>
    </div>

    <div class="px-4 mt-4">
      <div v-if="isLoading" class="grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
      </div>
      <div v-else-if="favoriteProducts.length" class="grid grid-cols-2 gap-3">
        <ProductCard v-for="p in favoriteProducts" :key="p.id" :product="p" />
      </div>
      <div v-else class="flex flex-col items-center justify-center py-24">
        <div class="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/></svg>
        </div>
        <p class="text-lg font-black" style="color: var(--text-primary)">{{ t('favorites.empty_title') }}</p>
        <p class="text-sm font-semibold mt-1 text-center" style="color: var(--text-tertiary)">{{ t('favorites.empty_subtitle') }}</p>
        <button v-if="isLoggedIn" @click="navigate('home')" class="mt-5 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press" style="box-shadow: 0 4px 16px var(--primary-glow)">{{ t('common.go_catalog') }}</button>
        <button v-else @click="navigate('login')" class="mt-5 bg-primary text-white font-black px-8 py-3 rounded-2xl btn-press" style="box-shadow: 0 4px 16px var(--primary-glow)">{{ t('login.button') }}</button>
      </div>
    </div>
  </div>
</template>
