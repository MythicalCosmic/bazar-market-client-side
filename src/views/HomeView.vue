<script setup>
import { onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import AppHeader from '../components/AppHeader.vue'
import BannerCarousel from '../components/BannerCarousel.vue'
import FeaturedSection from '../components/FeaturedSection.vue'
import ProductCard from '../components/ProductCard.vue'
import CategoryIcon from '../components/CategoryIcon.vue'
import { products, featuredProducts, banners, categories, loadProducts, isLoading } from '../stores/productsStore.js'

const { navigate } = useRouter()
const { t } = useI18n()

onMounted(() => {
  loadProducts()
})

function goToCategory(catId) {
  navigate('categories', { category: catId })
}
</script>

<template>
  <div class="pb-28">
    <AppHeader />

    <!-- Loading skeletons -->
    <template v-if="isLoading">
      <div class="mt-3 px-4">
        <div class="skeleton w-full h-[120px] rounded-2xl"></div>
      </div>
      <div class="mt-5 px-4 grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
      </div>
    </template>

    <template v-else>
      <!-- Banner Carousel -->
      <BannerCarousel :banners="banners" />

      <!-- Category Quick Access -->
      <div class="mt-5 px-4">
        <h2 class="text-base font-black mb-3" style="color: var(--text-primary)">{{ t('home.categories') }}</h2>
        <div class="scroll-x flex gap-3 pb-1">
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="goToCategory(cat.id)"
            class="flex-shrink-0 flex flex-col items-center gap-1.5 btn-press"
          >
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors text-primary"
              style="background: var(--primary-light)"
            >
              <CategoryIcon :icon="cat.icon" size="24" />
            </div>
            <span class="text-[10px] font-bold whitespace-nowrap" style="color: var(--text-secondary)">
              {{ t(cat.labelKey) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Featured Products -->
      <FeaturedSection
        :title="t('home.featured')"
        :products="featuredProducts"
        :onSeeAll="() => navigate('categories')"
        :seeAllLabel="t('home.see_all')"
      />

      <!-- All Products Grid -->
      <div class="mt-5">
        <div class="flex items-center justify-between px-4 mb-3">
          <h2 class="text-base font-black" style="color: var(--text-primary)">{{ t('home.for_you') }}</h2>
        </div>
        <div class="px-4 grid grid-cols-2 gap-3">
          <ProductCard v-for="p in products" :key="p.id" :product="p" />
        </div>
      </div>
    </template>
  </div>
</template>
