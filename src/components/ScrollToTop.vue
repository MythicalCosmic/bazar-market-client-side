<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 400
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <Teleport to="#app">
    <Transition name="fade">
      <button v-if="visible" @click="scrollToTop"
        class="fixed bottom-24 right-4 w-10 h-10 rounded-full flex items-center justify-center z-40 btn-press"
        style="background: var(--surface); box-shadow: 0 4px 16px var(--shadow-lg); border: 1px solid var(--border);">
        <svg width="18" height="18" style="color: var(--text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M18 15l-6-6-6 6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </Transition>
  </Teleport>
</template>
