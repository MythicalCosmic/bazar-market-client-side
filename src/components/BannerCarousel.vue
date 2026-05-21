<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from '../i18n/index.js'

const props = defineProps({
  banners: { type: Array, default: () => [] },
})

const { t, getLocalizedName } = useI18n()
const currentIndex = ref(0)
const scrollRef = ref(null)
let intervalId = null

function scrollTo(idx) {
  currentIndex.value = idx
  const el = scrollRef.value
  if (!el) return
  const card = el.children[idx]
  if (card) el.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' })
}

function startAutoScroll() {
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(() => {
    const next = (currentIndex.value + 1) % props.banners.length
    scrollTo(next)
  }, 5500)
}

function onScroll() {
  const el = scrollRef.value
  if (!el || !el.children[0]) return
  const cardWidth = el.children[0].offsetWidth || 1
  currentIndex.value = Math.round(el.scrollLeft / (cardWidth + 12))
}

onMounted(() => { if (props.banners.length > 1) startAutoScroll() })
onUnmounted(() => { if (intervalId) clearInterval(intervalId) })

const defaultGradient = 'linear-gradient(135deg, #0F5132 0%, #093D24 55%, #052619 100%)'

const total = computed(() => String(props.banners.length).padStart(2, '0'))
const current = computed(() => String(currentIndex.value + 1).padStart(2, '0'))
</script>

<template>
  <div v-if="banners.length" class="mt-5">
    <!-- Editorial header row -->
    <div class="px-5 mb-3 flex items-end justify-between">
      <div>
        <p class="eyebrow">{{ t('ed.this_weeks') }}</p>
        <h2 class="display text-[26px] mt-1" style="color: var(--text-primary);">
          <span class="serif-italic" style="color: var(--terracotta)">{{ t('ed.featured_italic') }}</span> {{ t('ed.featured_goods') }}
        </h2>
      </div>
      <p class="num-label text-[12px] tabular">№ {{ current }} / {{ total }}</p>
    </div>

    <div ref="scrollRef" class="flex gap-3 px-5 scroll-x snap-x snap-mandatory" @scroll="onScroll"
      @touchstart="clearInterval(intervalId)" @touchend="startAutoScroll()">
      <div v-for="(banner, idx) in banners" :key="banner.id"
        class="flex-shrink-0 snap-center overflow-hidden relative banner-slide"
        :style="{ width: banners.length > 1 ? 'calc(100% - 40px)' : '100%' }">
        <!-- Background -->
        <div class="absolute inset-0 banner-bg-layer" :style="{ background: banner.gradient || defaultGradient }"></div>
        <img v-if="banner.image" :src="banner.image" class="absolute inset-0 w-full h-full object-cover banner-img" />
        <div v-if="banner.image" class="absolute inset-0 banner-img-overlay"></div>

        <!-- Frame border -->
        <div class="absolute inset-3 banner-frame"></div>

        <!-- Content -->
        <div class="relative z-10 p-6 flex flex-col justify-between h-full">
          <!-- Top: issue tag -->
          <div class="flex items-center gap-2">
            <span class="block w-7 h-px" style="background: rgba(245,239,227,0.6)"></span>
            <p class="eyebrow-sm" style="color: rgba(245,239,227,0.85); letter-spacing: 0.24em;">№ 0{{ idx + 1 }}</p>
          </div>

          <!-- Bottom: title + cta -->
          <div>
            <p class="serif text-[28px] leading-[0.95] text-cream max-w-[240px]" style="font-weight: 500; letter-spacing: -0.02em;">
              {{ typeof banner.title === 'object' ? getLocalizedName(banner.title) : banner.title }}
            </p>
            <p v-if="banner.subtitle" class="text-[12px] mt-2.5 leading-snug max-w-[220px]" style="color: rgba(245,239,227,0.78);">
              {{ typeof banner.subtitle === 'object' ? getLocalizedName(banner.subtitle) : banner.subtitle }}
            </p>
            <div class="mt-4 flex items-center gap-2">
              <span class="eyebrow-sm" style="color: var(--cream); letter-spacing: 0.22em;">{{ t('ed.discover') }}</span>
              <span class="block w-8 h-px" style="background: var(--cream); opacity: 0.7;"></span>
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" style="color: var(--cream)">
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editorial progress bar -->
    <div v-if="banners.length > 1" class="px-5 mt-4 flex items-center gap-2">
      <span class="num-label text-[10px] tabular">{{ current }}</span>
      <div class="flex-1 flex gap-1">
        <button v-for="(_, i) in banners" :key="i" @click="scrollTo(i)"
          class="banner-dash"
          :class="currentIndex === i ? 'banner-dash-active' : ''" />
      </div>
      <span class="num-label text-[10px] tabular" style="opacity: 0.5">{{ total }}</span>
    </div>
  </div>
</template>

<style scoped>
.banner-slide {
  border-radius: 4px;
  min-height: 320px;
  box-shadow:
    0 2px 6px rgba(26, 38, 32, 0.06),
    0 24px 60px rgba(26, 38, 32, 0.18);
  overflow: hidden;
}

.banner-bg-layer {
  border-radius: 4px;
}

.banner-img {
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.banner-frame {
  border: 1px solid rgba(245, 239, 227, 0.22);
  pointer-events: none;
  z-index: 5;
}

.banner-img-overlay {
  background: linear-gradient(
    160deg,
    rgba(26, 38, 32, 0.20) 0%,
    rgba(26, 38, 32, 0.45) 50%,
    rgba(26, 38, 32, 0.78) 100%
  );
}

.text-cream {
  color: var(--cream);
}

.banner-dash {
  flex: 1;
  height: 1.5px;
  background: var(--hairline);
  transition: background 0.4s ease, height 0.4s ease;
  border-radius: 0;
}
.banner-dash-active {
  background: var(--text-primary);
  height: 2px;
}
</style>
