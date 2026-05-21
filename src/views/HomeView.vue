<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useFormat } from '../composables/useFormat.js'
import { useCartStore } from '../stores/cartStore.js'
import { useAuth } from '../stores/authStore.js'
import AppHeader from '../components/AppHeader.vue'
import BannerCarousel from '../components/BannerCarousel.vue'
import FeaturedSection from '../components/FeaturedSection.vue'
import ProductCard from '../components/ProductCard.vue'
import { featuredProducts, banners, categories, categoryProducts, loadProducts, isLoading } from '../stores/productsStore.js'

const { navigate } = useRouter()
const { t, getLocalizedName } = useI18n()

onMounted(() => { loadProducts() })

function goToCategory(catId) { navigate('categories', { category: catId }) }

const today = new Date()
const dateLine = computed(() => {
  return today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})
const volume = computed(() => 'Vol. ' + String(today.getMonth() + 1).padStart(2, '0'))

// Layout variants to break the repetitive horizontal scroll pattern
const layoutVariants = ['scroll', 'feature', 'grid']
function layoutFor(idx) {
  return layoutVariants[idx % layoutVariants.length]
}

// Pick a "Editor's pick" — first featured if any
const editorsPick = computed(() => featuredProducts.value?.[0] || null)
const editorsRest = computed(() => featuredProducts.value?.slice(1) || [])

// Marquee strip (translated, comma-separated)
const marqueeItems = computed(() => t('ed.marquee').split('·').map(s => s.trim()).filter(Boolean))
</script>

<template>
  <div class="pb-32 page-container">
    <AppHeader />

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <div class="px-5 mt-6">
        <div class="skeleton h-3 w-32 mb-3"></div>
        <div class="skeleton h-9 w-2/3 mb-6"></div>
        <div class="skeleton h-[320px] mb-8"></div>
        <div class="skeleton h-3 w-24 mb-3"></div>
        <div class="skeleton h-7 w-1/2 mb-4"></div>
        <div class="flex gap-3"><div v-for="i in 3" :key="i" class="skeleton w-[170px] h-[260px] flex-shrink-0"></div></div>
      </div>
    </template>

    <template v-else>
      <!-- ═══ Editorial intro / Masthead body ═══ -->
      <section class="px-5 pt-6 pb-2 fade-up">
        <div class="rule mb-3">
          <span class="eyebrow">{{ t('ed.todays_edition') }}</span>
        </div>
        <h1 class="display text-[40px] leading-[0.95]" style="color: var(--text-primary);">
          {{ t('ed.fresh_l1') }}<br/>
          <span class="serif-italic" style="color: var(--terracotta);">{{ t('ed.fresh_l2_italic') }}</span>.
        </h1>
        <div class="mt-3 flex items-center gap-2">
          <span class="num-label text-[11px] tabular">{{ volume }}</span>
          <span class="block w-3 h-px" style="background: var(--text-tertiary)"></span>
          <p class="text-[11.5px]" style="color: var(--text-secondary); letter-spacing: 0.04em;">{{ dateLine }}</p>
        </div>
      </section>

      <!-- ═══ Magazine Hero / Banners ═══ -->
      <BannerCarousel :banners="banners" />

      <!-- ═══ Editorial Marquee Strip ═══ -->
      <div class="mt-6 marquee-strip">
        <div class="marquee flex items-center gap-10 whitespace-nowrap py-2.5">
          <template v-for="i in 2" :key="i">
            <span class="eyebrow flex items-center gap-3" style="color: var(--text-primary)">
              <template v-for="(item, idx) in marqueeItems" :key="idx">
                {{ item }}<span class="dot"></span>
              </template>
            </span>
          </template>
        </div>
      </div>

      <!-- ═══ Categories — editorial chip grid ═══ -->
      <section v-if="categories.length" class="mt-8 fade-up">
        <div class="px-5 mb-4">
          <div class="flex items-end justify-between mb-1">
            <div>
              <p class="eyebrow">{{ t('ed.departments') }}</p>
              <h2 class="display text-[24px] mt-1" style="color: var(--text-primary)">
                {{ t('ed.aisles_l1') }} <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.aisles_italic') }}</span>
              </h2>
            </div>
            <button @click="navigate('categories')" class="see-all">
              <span class="eyebrow-sm">{{ t('ed.view_all') }}</span>
            </button>
          </div>
          <div class="hairline mt-3"></div>
        </div>
        <div class="scroll-x flex gap-2.5 px-5 pb-1">
          <button v-for="(cat, i) in categories" :key="cat.id" @click="goToCategory(cat.id)"
            class="cat-card btn-press">
            <div class="cat-img">
              <img v-if="cat.image" :src="cat.image" class="w-full h-full object-contain p-2" style="mix-blend-mode: multiply;" />
              <svg v-else width="22" height="22" style="color: var(--text-tertiary); opacity: 0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.4">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div class="text-left">
              <span class="num-label text-[10px] block leading-none mb-1">0{{ i + 1 }}</span>
              <span class="cat-name">{{ getLocalizedName(cat.name) }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- ═══ Editor's Pick — large feature ═══ -->
      <section v-if="editorsPick" class="mt-10 px-5 fade-up">
        <div class="flex items-center gap-2 mb-3">
          <span class="num-label text-[11px] tabular">№ 01</span>
          <span class="block w-4 h-px" style="background: var(--hairline)"></span>
          <p class="eyebrow-sm">{{ t('ed.editors_pick') }}</p>
        </div>

        <div class="editors-pick" @click="navigate('product', { productId: editorsPick.id })">
          <div class="editors-img">
            <img v-if="editorsPick.image" :src="editorsPick.image" :alt="getLocalizedName(editorsPick.name)" class="w-full h-full object-contain p-8" style="mix-blend-mode: multiply;" />
            <div class="editors-overlay">
              <div class="absolute top-4 left-4 flex items-center gap-2">
                <span class="block w-7 h-px bg-white opacity-60"></span>
                <p class="eyebrow-sm text-white opacity-90">{{ t('ed.this_week') }}</p>
              </div>
            </div>
          </div>
          <div class="editors-meta">
            <p class="eyebrow mb-2" style="color: var(--terracotta)">{{ t('ed.editors_eyebrow') }}</p>
            <h3 class="display text-[28px] leading-[0.95] mb-3" style="color: var(--text-primary)">
              {{ getLocalizedName(editorsPick.name) }}
            </h3>
            <p class="text-[13px] mb-4" style="color: var(--text-secondary); line-height: 1.55; letter-spacing: 0.01em;">
              {{ t('ed.editors_desc') }}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="eyebrow-sm">{{ t('ed.discover') }}</span>
                <span class="block w-6 h-px" style="background: var(--text-primary)"></span>
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--text-primary)">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ Featured collection ═══ -->
      <FeaturedSection
        v-if="editorsRest.length"
        :products="editorsRest"
        :eyebrow="t('ed.collection')"
        :italic="t('ed.popular_italic')"
        :title="t('ed.this_season')"
        number="02"
        :on-see-all="() => navigate('categories')"
      />

      <!-- ═══ Pull quote / editorial break ═══ -->
      <section class="mt-10 px-5 fade-up">
        <div class="rule-center mb-4">
          <span class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('ed.note_market') }}</span>
        </div>
        <blockquote class="text-center px-2">
          <p class="serif-italic text-[24px] leading-[1.2]" style="color: var(--text-primary); letter-spacing: -0.015em;">
            "{{ t('ed.quote') }}"
          </p>
          <p class="eyebrow-sm mt-4" style="color: var(--terracotta); letter-spacing: 0.22em;">{{ t('ed.curators') }}</p>
        </blockquote>
        <div class="hairline mt-6"></div>
      </section>

      <!-- ═══ Category Sections (alternating layouts) ═══ -->
      <template v-for="(cat, catIdx) in categories" :key="'section-' + cat.id">
        <FeaturedSection
          v-if="categoryProducts[cat.id]?.length && layoutFor(catIdx) === 'scroll'"
          :products="categoryProducts[cat.id]"
          :eyebrow="t('ed.department')"
          :title="getLocalizedName(cat.name)"
          :number="String(catIdx + 3).padStart(2, '0')"
          :see-all-label="t('ed.view_all')"
          :on-see-all="() => goToCategory(cat.id)"
        />

        <!-- Grid layout variant -->
        <section v-else-if="categoryProducts[cat.id]?.length && layoutFor(catIdx) === 'grid'" class="mt-10 px-5 fade-up">
          <div class="mb-4">
            <div class="flex items-end justify-between gap-4 mb-2.5">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="num-label text-[11px] tabular">№ {{ String(catIdx + 3).padStart(2, '0') }}</span>
                  <span class="block w-4 h-px" style="background: var(--hairline)"></span>
                  <p class="eyebrow-sm">{{ t('ed.department') }}</p>
                </div>
                <h2 class="display text-[26px]" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</h2>
              </div>
              <button @click="goToCategory(cat.id)" class="see-all">
                <span class="eyebrow-sm">{{ t('ed.view_all') }}</span>
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="hairline"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <ProductCard v-for="prod in categoryProducts[cat.id].slice(0, 4)" :key="prod.id" :product="prod" />
          </div>
        </section>

        <!-- Feature single (1 big + 2 small) -->
        <section v-else-if="categoryProducts[cat.id]?.length" class="mt-10 px-5 fade-up">
          <div class="mb-4">
            <div class="flex items-end justify-between gap-4 mb-2.5">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="num-label text-[11px] tabular">№ {{ String(catIdx + 3).padStart(2, '0') }}</span>
                  <span class="block w-4 h-px" style="background: var(--hairline)"></span>
                  <p class="eyebrow-sm">{{ t('ed.department') }}</p>
                </div>
                <h2 class="display text-[26px]" style="color: var(--text-primary)">{{ getLocalizedName(cat.name) }}</h2>
              </div>
              <button @click="goToCategory(cat.id)" class="see-all">
                <span class="eyebrow-sm">{{ t('ed.view_all') }}</span>
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="hairline"></div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="row-span-2">
              <ProductCard :product="categoryProducts[cat.id][0]" />
            </div>
            <ProductCard v-if="categoryProducts[cat.id][1]" :product="categoryProducts[cat.id][1]" />
            <ProductCard v-if="categoryProducts[cat.id][2]" :product="categoryProducts[cat.id][2]" />
          </div>
        </section>
      </template>

      <!-- ═══ Closing editorial note ═══ -->
      <section class="mt-14 px-5 fade-up">
        <div class="rule-center mb-3">
          <span class="num-label text-[12px]">{{ t('ed.fin') }}</span>
        </div>
        <p class="text-center serif text-[13px]" style="color: var(--text-tertiary); letter-spacing: 0.04em;">
          {{ t('ed.signoff') }} <span class="serif-italic">{{ t('ed.see_tomorrow') }}</span>
        </p>
        <div class="text-center mt-4 flex items-center justify-center gap-1.5" style="color: var(--text-muted)">
          <span class="block w-1 h-1 rounded-full" style="background: currentColor"></span>
          <span class="block w-1 h-1 rounded-full" style="background: currentColor"></span>
          <span class="block w-1 h-1 rounded-full" style="background: currentColor"></span>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page-container {
  width: 100%;
  max-width: 480px;
  margin-inline: auto;
}

.see-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}

/* Marquee */
.marquee-strip {
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  overflow: hidden;
  background: var(--surface-secondary);
}
.dot {
  display: inline-block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--terracotta);
}

/* Category cards */
.cat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 8px 8px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 2px;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease;
  flex-shrink: 0;
}
.cat-card:active {
  transform: scale(0.96);
  border-color: var(--text-primary);
}
.cat-img {
  width: 44px;
  height: 44px;
  background: var(--img-bg);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cat-name {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 40;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  display: block;
  line-height: 1.1;
  white-space: nowrap;
}

/* Editor's pick */
.editors-pick {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 2px;
  overflow: hidden;
}
.editors-pick:active {
  transform: scale(0.99);
}

.editors-img {
  position: relative;
  height: 280px;
  background: var(--img-bg);
  overflow: hidden;
}
.editors-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.editors-meta {
  padding: 22px 22px 24px;
  background: var(--surface);
}

/* Skeleton sizing for editorial */
.skeleton {
  border-radius: 2px;
}
</style>
