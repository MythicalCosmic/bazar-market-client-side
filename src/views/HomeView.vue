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
const { t, getLocalizedName } = useI18n()

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

    <template v-if="isLoading">
      <div class="mt-3 px-4">
        <div class="skeleton w-full h-[120px] rounded-2xl"></div>
      </div>
      <div class="mt-5 px-4 grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-[200px] rounded-2xl"></div>
      </div>
    </template>

    <template v-else>
      <BannerCarousel :banners="banners" />

      <!-- Category Quick Access -->
      <div v-if="categories.length" class="mt-5 px-4">
        <h2 class="text-base font-black mb-3" style="color: var(--text-primary)">{{ t('home.categories') }}</h2>
        <div class="scroll-x flex gap-3 pb-1">
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="goToCategory(cat.id)"
            class="flex-shrink-0 flex flex-col items-center gap-1.5 btn-press"
          >
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors overflow-hidden" style="background: var(--primary-light)">
              <img v-if="cat.image" :src="cat.image" :alt="getLocalizedName(cat.name)" class="w-full h-full object-cover" />
              <CategoryIcon v-else-if="cat.icon" :icon="cat.icon" size="24" class="text-primary" />
              <svg v-else width="24" height="24" class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="2" stroke-width="2"/>
                <rect x="14" y="3" width="7" height="7" rx="2" stroke-width="2"/>
                <rect x="3" y="14" width="7" height="7" rx="2" stroke-width="2"/>
                <rect x="14" y="14" width="7" height="7" rx="2" stroke-width="2"/>
              </svg>
            </div>
            <span class="text-[10px] font-bold whitespace-nowrap max-w-[60px] truncate" style="color: var(--text-secondary)">
              {{ cat.labelKey ? t(cat.labelKey) : getLocalizedName(cat.name) }}
            </span>
          </button>
        </div>
      </div>

      <FeaturedSection
        :title="t('home.featured')"
        :products="featuredProducts"
        :onSeeAll="() => navigate('categories')"
        :seeAllLabel="t('home.see_all')"
      />

      <div v-if="products.length" class="mt-5">
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
