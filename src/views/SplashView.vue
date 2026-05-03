<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router/index.js'

const { navigate } = useRouter()
const fadeOut = ref(false)
let timeoutId = null

onMounted(() => {
  timeoutId = setTimeout(() => {
    fadeOut.value = true
    setTimeout(() => navigate('home'), 500)
  }, 2400)
})

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
})
</script>

<template>
  <div :class="['splash-screen', { 'splash-exit': fadeOut }]">
    <!-- Animated gradient orbs -->
    <div class="splash-bg">
      <div class="splash-orb splash-orb-1"></div>
      <div class="splash-orb splash-orb-2"></div>
      <div class="splash-orb splash-orb-3"></div>
    </div>

    <!-- Decorative rings -->
    <div class="splash-ring splash-ring-1"></div>
    <div class="splash-ring splash-ring-2"></div>

    <!-- Logo -->
    <div class="splash-logo-container">
      <img src="/logo.png" alt="Bazar Market" class="splash-logo" />
    </div>

    <!-- Brand text -->
    <div class="splash-text">
      <span class="splash-brand">BAZAR</span>
      <span class="splash-divider"></span>
      <span class="splash-sub">MARKET</span>
    </div>

    <!-- Tagline -->
    <p class="splash-tagline">Fresh. Fast. Delivered.</p>

    <!-- Shimmer sweep -->
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
  gap: 24px;
  background: #047857;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.splash-exit {
  opacity: 0;
  transform: scale(1.04);
}

/* ── Background Gradient Orbs ── */
.splash-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.splash-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: opacity, transform;
}

.splash-orb-1 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%);
  top: -15%;
  left: -25%;
  animation: splash-glow 3.5s ease-in-out infinite;
}

.splash-orb-2 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(6, 78, 59, 0.6) 0%, transparent 70%);
  bottom: -10%;
  right: -20%;
  animation: splash-glow 3s ease-in-out infinite 0.8s;
}

.splash-orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.35) 0%, transparent 70%);
  top: 35%;
  left: 55%;
  animation: splash-glow 4s ease-in-out infinite 1.5s;
}

/* ── Decorative rings ── */
.splash-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 1;
}

.splash-ring-1 {
  width: 300px;
  height: 300px;
  animation: splash-float 6s ease-in-out infinite;
}

.splash-ring-2 {
  width: 450px;
  height: 450px;
  animation: splash-float 8s ease-in-out infinite 1s;
}

/* ── Logo ── */
.splash-logo-container {
  position: relative;
  z-index: 2;
  animation: splash-logo-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
  will-change: transform, opacity;
}

.splash-logo {
  width: 110px;
  height: 110px;
  object-fit: contain;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  filter: drop-shadow(0 16px 48px rgba(0, 0, 0, 0.25));
}

/* ── Brand Text ── */
.splash-text {
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2;
}

.splash-brand {
  font-size: 32px;
  font-weight: 800;
  color: white;
  letter-spacing: 5px;
  animation: splash-text-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both;
  will-change: transform, opacity;
}

.splash-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  animation: splash-text-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both;
}

.splash-sub {
  font-size: 32px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 5px;
  animation: splash-text-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both;
  will-change: transform, opacity;
}

/* ── Tagline ── */
.splash-tagline {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 4px;
  text-transform: uppercase;
  z-index: 2;
  animation: splash-text-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.8s both;
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
    rgba(255, 255, 255, 0.06) 40%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.06) 60%,
    transparent 100%
  );
  animation: splash-shimmer 1.3s ease-in-out 1.3s both;
  will-change: transform;
}
</style>
