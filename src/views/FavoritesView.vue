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
    <!-- Editorial header -->
    <div class="px-5 pt-5 pb-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="num-label text-[11px] tabular">№ {{ String(favoriteProducts.length || 0).padStart(2, '0') }}</span>
        <span class="block w-4 h-px" style="background: var(--hairline)"></span>
        <p class="eyebrow-sm">{{ t('ed.saved') }}</p>
      </div>
      <h1 class="display text-[34px]" style="color: var(--text-primary)">
        {{ t('ed.your_fav_pre') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.fav_italic') }}</span>
      </h1>
      <div class="hairline mt-4"></div>
    </div>

    <div class="px-5 mt-5">
      <div v-if="isLoading" class="grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-[260px]"></div>
      </div>
      <div v-else-if="favoriteProducts.length" class="grid grid-cols-2 gap-3">
        <ProductCard v-for="p in favoriteProducts" :key="p.id" :product="p" />
      </div>
      <div v-else class="px-8 pt-12 text-center">
        <p class="num-label text-[14px] mb-3">— № 00 —</p>
        <h2 class="display text-[24px] mb-2" style="color: var(--text-primary)">{{ t('favorites.empty_title') }}</h2>
        <p class="serif-italic text-[14px] leading-relaxed mb-6" style="color: var(--text-secondary)">{{ t('favorites.empty_subtitle') }}</p>
        <button v-if="isLoggedIn" @click="navigate('home')" class="empty-cta btn-press">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ t('common.go_catalog') }}</span>
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--cream)">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button v-else @click="navigate('login')" class="empty-cta btn-press">
          <span class="eyebrow-sm" style="color: var(--cream)">{{ t('login.button') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: var(--surface-ink);
  border: none;
  cursor: pointer;
}
</style>
