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
  if (card) {
    el.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' })
  }
}

function startAutoScroll() {
  intervalId = setInterval(() => {
    const next = (currentIndex.value + 1) % props.banners.length
    scrollTo(next)
  }, 4000)
}

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  const scrollLeft = el.scrollLeft
  const cardWidth = el.children[0]?.offsetWidth || 1
  currentIndex.value = Math.round(scrollLeft / (cardWidth + 12))
}

onMounted(() => {
  if (props.banners.length > 1) startAutoScroll()
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div v-if="banners.length" class="mt-3">
    <div
      ref="scrollRef"
      class="flex gap-3 px-4 scroll-x snap-x snap-mandatory"
      @scroll="onScroll"
      @touchstart="clearInterval(intervalId)"
      @touchend="startAutoScroll()"
    >
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="flex-shrink-0 w-[calc(100%-32px)] snap-center rounded-2xl p-5 flex items-center justify-between overflow-hidden relative"
        :style="{ background: banner.gradient, minHeight: '120px' }"
      >
        <div class="z-10 flex-1">
          <p class="text-white text-4xl font-black leading-none">
            {{ getLocalizedName(banner.title) }}
          </p>
          <p class="text-white/80 text-xs font-semibold mt-1.5 leading-tight max-w-[160px]">
            {{ getLocalizedName(banner.subtitle) }}
          </p>
        </div>
        <img
          :src="banner.image"
          :alt="getLocalizedName(banner.title)"
          class="absolute right-3 bottom-0 h-24 object-contain"
          style="filter: drop-shadow(0 4px 14px rgba(0,0,0,0.25))"
        />
      </div>
    </div>

    <!-- Dots -->
    <div v-if="banners.length > 1" class="flex items-center justify-center gap-1.5 mt-3">
      <button
        v-for="(_, i) in banners"
        :key="i"
        @click="scrollTo(i)"
        :class="[
          'rounded-full transition-all duration-300',
          currentIndex === i
            ? 'w-6 h-2 bg-primary'
            : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
        ]"
      />
    </div>
  </div>
</template>
