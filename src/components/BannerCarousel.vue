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

const defaultGradient = 'linear-gradient(135deg, #2DB84B 0%, #1aac40 55%, #0d8c30 100%)'
</script>

<template>
  <div v-if="banners.length" class="mt-3">
    <div ref="scrollRef" class="flex gap-3 px-4 scroll-x snap-x snap-mandatory" @scroll="onScroll"
      @touchstart="clearInterval(intervalId)" @touchend="startAutoScroll()">
      <div v-for="banner in banners" :key="banner.id"
        class="flex-shrink-0 w-[calc(100%-32px)] snap-center rounded-2xl overflow-hidden relative"
        :style="{ minHeight: '120px' }">
        <!-- Background: image or gradient -->
        <div class="absolute inset-0" :style="{ background: banner.gradient || defaultGradient }"></div>
        <img v-if="banner.image" :src="banner.image" class="absolute inset-0 w-full h-full object-cover" />
        <div v-if="banner.image && !banner.gradient" class="absolute inset-0" style="background: linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%)"></div>

        <!-- Content -->
        <div class="relative z-10 p-5 flex items-center justify-between min-h-[120px]">
          <div class="flex-1">
            <p class="text-white text-3xl font-black leading-none">
              {{ typeof banner.title === 'object' ? getLocalizedName(banner.title) : banner.title }}
            </p>
            <p v-if="banner.subtitle" class="text-white/80 text-xs font-semibold mt-1.5 leading-tight max-w-[160px]">
              {{ typeof banner.subtitle === 'object' ? getLocalizedName(banner.subtitle) : banner.subtitle }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="banners.length > 1" class="flex items-center justify-center gap-1.5 mt-3">
      <button v-for="(_, i) in banners" :key="i" @click="scrollTo(i)"
        :class="['rounded-full transition-all duration-300', currentIndex === i ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-gray-300 dark:bg-gray-600']" />
    </div>
  </div>
</template>
