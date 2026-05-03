<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../i18n/index.js'

const props = defineProps({
  banners: { type: Array, default: () => [] },
})

const { getLocalizedName } = useI18n()
const currentIndex = ref(0)
const scrollRef = ref(null)
let intervalId = null

function scrollTo(idx) {
  currentIndex.value = idx
  const el = scrollRef.value
  if (!el) return
  const card = el.children[idx]
  if (card) el.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' })
}

function startAutoScroll() {
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(() => {
    const next = (currentIndex.value + 1) % props.banners.length
    scrollTo(next)
  }, 4000)
}

function onScroll() {
  const el = scrollRef.value
  if (!el || !el.children[0]) return
  const cardWidth = el.children[0].offsetWidth || 1
  currentIndex.value = Math.round(el.scrollLeft / (cardWidth + 12))
}

onMounted(() => { if (props.banners.length > 1) startAutoScroll() })
onUnmounted(() => { if (intervalId) clearInterval(intervalId) })

const defaultGradient = 'linear-gradient(135deg, #059669 0%, #047857 55%, #065F46 100%)'
</script>

<template>
  <div v-if="banners.length" class="mt-4">
    <div ref="scrollRef" class="flex gap-3 px-4 scroll-x snap-x snap-mandatory" @scroll="onScroll"
      @touchstart="clearInterval(intervalId)" @touchend="startAutoScroll()">
      <div v-for="banner in banners" :key="banner.id"
        class="flex-shrink-0 snap-center overflow-hidden relative banner-slide"
        :style="{ width: banners.length > 1 ? 'calc(100% - 28px)' : '100%' }">
        <!-- Background -->
        <div class="absolute inset-0 banner-bg-layer" :style="{ background: banner.gradient || defaultGradient }"></div>
        <img v-if="banner.image" :src="banner.image" class="absolute inset-0 w-full h-full object-cover" />
        <div v-if="banner.image" class="absolute inset-0 banner-img-overlay"></div>

        <!-- Content -->
        <div class="relative z-10 p-5 flex flex-col justify-end h-full">
          <p class="text-white text-[22px] font-bold leading-tight max-w-[200px]">
            {{ typeof banner.title === 'object' ? getLocalizedName(banner.title) : banner.title }}
          </p>
          <p v-if="banner.subtitle" class="text-white/60 text-[11px] font-medium mt-1.5 leading-snug max-w-[180px]">
            {{ typeof banner.subtitle === 'object' ? getLocalizedName(banner.subtitle) : banner.subtitle }}
          </p>
        </div>

        <!-- Decorative -->
        <div class="absolute top-0 right-0 w-32 h-32 rounded-full" style="background: rgba(255,255,255,0.06); filter: blur(30px); transform: translate(20%, -30%);"></div>
        <div class="absolute bottom-0 left-1/2 w-24 h-24 rounded-full" style="background: rgba(255,255,255,0.04); filter: blur(20px); transform: translate(-50%, 40%);"></div>
      </div>
    </div>

    <!-- Dots -->
    <div v-if="banners.length > 1" class="flex items-center justify-center gap-1.5 mt-3">
      <button v-for="(_, i) in banners" :key="i" @click="scrollTo(i)"
        class="banner-dot"
        :class="currentIndex === i ? 'banner-dot-active' : 'banner-dot-idle'" />
    </div>
  </div>
</template>

<style scoped>
.banner-slide {
  border-radius: 20px;
  min-height: 148px;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.08);
}

.banner-bg-layer {
  border-radius: 20px;
}

.banner-img-overlay {
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.2) 40%,
    rgba(0, 0, 0, 0.05) 70%,
    transparent 100%
  );
}

.banner-dot {
  border-radius: 50%;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.banner-dot-active {
  width: 20px;
  height: 6px;
  border-radius: 3px;
  background: var(--primary);
}

.banner-dot-idle {
  width: 6px;
  height: 6px;
  background: var(--surface-tertiary);
}
</style>
