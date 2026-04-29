<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router/index.js'

const { navigate } = useRouter()
const fadeOut = ref(false)
let timeoutId = null

onMounted(() => {
  timeoutId = setTimeout(() => {
    fadeOut.value = true
    setTimeout(() => navigate('home'), 400)
  }, 2200)
})

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
})
</script>

<template>
  <div
    :class="['splash-screen', { 'splash-fadeout': fadeOut }]"
    style="background: #2DB84B"
  >
    <!-- Ripple -->
    <div class="splash-ripple"></div>

    <!-- Logo -->
    <div class="splash-logo-wrap">
      <img src="/logo.png" alt="Bazar Market" class="splash-logo" />
    </div>

    <!-- Text -->
    <div class="splash-text-wrap">
      <span class="splash-text-bazar">BAZAR</span>
      <span class="splash-text-market">MARKET</span>
    </div>

    <!-- Shimmer overlay -->
    <div class="splash-shimmer"></div>
  </div>
</template>

<style scoped>
.splash-screen {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  gap: 16px;
  transition: opacity 0.4s ease;
}

.splash-fadeout {
  opacity: 0;
}

/* ── Logo ── */
.splash-logo-wrap {
  position: relative;
  z-index: 2;
  animation: splash-logo-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  will-change: transform, opacity;
}
.splash-logo {
  width: 160px;
  height: 160px;
  object-fit: contain;
  filter: drop-shadow(0 8px 30px rgba(0, 0, 0, 0.2));
}

/* ── Text ── */
.splash-text-wrap {
  display: flex;
  gap: 10px;
  z-index: 2;
  overflow: hidden;
}
.splash-text-bazar {
  font-size: 32px;
  font-weight: 900;
  color: white;
  letter-spacing: 4px;
  animation: splash-text-left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s both;
  will-change: transform, opacity;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}
.splash-text-market {
  font-size: 32px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 4px;
  animation: splash-text-right 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s both;
  will-change: transform, opacity;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

/* ── Shimmer ── */
.splash-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
}
.splash-shimmer::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 40%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 45%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.15) 55%,
    transparent 100%
  );
  animation: splash-shimmer 1s ease-in-out 1s both;
  will-change: transform;
}

/* ── Ripple ── */
.splash-ripple {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  z-index: 1;
  animation: splash-ripple 1.8s ease-out 0.6s both;
  will-change: transform, opacity;
}
</style>
