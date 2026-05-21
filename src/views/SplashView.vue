<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'

const { navigate } = useRouter()
const { t } = useI18n()
const stage = ref(0)
const timers = []

function sched(fn, ms) { timers.push(setTimeout(fn, ms)) }

onMounted(() => {
  sched(() => stage.value = 1, 150)
  sched(() => stage.value = 2, 900)
  sched(() => stage.value = 3, 1600)
  sched(() => stage.value = 4, 2300)
  sched(() => stage.value = 5, 2900)
  sched(() => { stage.value = 6; sched(() => navigate('home'), 650) }, 3600)
})

onUnmounted(() => timers.forEach(t => clearTimeout(t)))

const today = new Date()
const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
</script>

<template>
  <div class="splash" :class="{ exit: stage >= 6 }">
    <!-- Soft gradient orbs (warm depth) -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <!-- Paper texture overlay -->
    <div class="paper-tex"></div>

    <!-- Frame border -->
    <div class="frame" :class="{ show: stage >= 1 }">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>
    </div>

    <!-- Top masthead -->
    <div class="top-row">
      <div class="rule-frag" :class="{ show: stage >= 1 }"></div>
      <span class="eyebrow-sm est" :class="{ show: stage >= 1 }">EST · MMXXV</span>
      <div class="rule-frag" :class="{ show: stage >= 1 }"></div>
    </div>

    <!-- Brand wordmark -->
    <div class="brand">
      <!-- "Bazar" - the italic display word -->
      <h1 class="brand-name" :class="{ show: stage >= 2 }">
        <span class="brand-italic">{{ t('brand.bazar') }}</span>
      </h1>

      <!-- Decorative center line + "Market" -->
      <div class="mid-row" :class="{ show: stage >= 3 }">
        <span class="mid-line"></span>
        <span class="mid-word">{{ t('brand.market') }}</span>
        <span class="mid-line"></span>
      </div>

      <!-- "Go" — the play action -->
      <div class="go-wrap" :class="{ show: stage >= 4 }">
        <span class="go-bracket">[</span>
        <span class="go-word">{{ t('brand.go') }}</span>
        <span class="go-arrow">→</span>
        <span class="go-bracket">]</span>
      </div>

      <!-- Tagline -->
      <p class="tagline" :class="{ show: stage >= 5 }">
        {{ t('brand.tagline') }}
      </p>
    </div>

    <!-- Bottom date -->
    <div class="bottom-row">
      <div class="rule-frag" :class="{ show: stage >= 5 }"></div>
      <span class="eyebrow-sm date" :class="{ show: stage >= 5 }">{{ dateStr }}</span>
      <div class="rule-frag" :class="{ show: stage >= 5 }"></div>
    </div>
  </div>
</template>

<style scoped>
.splash {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 60px 32px;
  background:
    radial-gradient(ellipse at 70% 20%, rgba(184, 92, 58, 0.22), transparent 55%),
    radial-gradient(ellipse at 20% 80%, rgba(15, 81, 50, 0.18), transparent 55%),
    radial-gradient(ellipse at 50% 50%, rgba(201, 150, 98, 0.10), transparent 60%),
    linear-gradient(165deg, #14241E 0%, #0F1A14 50%, #080F0C 100%);
  color: var(--cream);
}

.exit {
  animation: exit-fade .65s cubic-bezier(.4,0,.2,1) forwards;
}
@keyframes exit-fade {
  to { opacity: 0; transform: scale(1.02); filter: blur(2px); }
}

/* Floating orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  pointer-events: none;
}
.orb-1 { width: 280px; height: 280px; background: var(--terracotta); top: -10%; right: -10%; animation: float-1 12s ease-in-out infinite; }
.orb-2 { width: 220px; height: 220px; background: var(--primary-mid); bottom: -8%; left: -8%; animation: float-2 14s ease-in-out infinite; }
.orb-3 { width: 180px; height: 180px; background: var(--saffron); top: 45%; left: 60%; animation: float-3 10s ease-in-out infinite; }
@keyframes float-1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-20px, 30px); } }
@keyframes float-2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px, -20px); } }
@keyframes float-3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-15px, -25px); } }

.paper-tex {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(245, 239, 227, 0.014) 2px, rgba(245, 239, 227, 0.014) 3px),
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245, 239, 227, 0.014) 2px, rgba(245, 239, 227, 0.014) 3px);
}

/* Editorial frame with corner marks */
.frame {
  position: absolute;
  inset: 22px;
  border: 1px solid rgba(245, 239, 227, 0.10);
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.9s ease, transform 0.9s ease;
  pointer-events: none;
}
.frame.show {
  opacity: 1;
  transform: scale(1);
}
.corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border-color: rgba(245, 239, 227, 0.55);
  border-style: solid;
  border-width: 0;
}
.corner-tl { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; }
.corner-tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; }
.corner-bl { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; }
.corner-br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; }

/* Top / bottom rows */
.top-row,
.bottom-row {
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 5;
}
.rule-frag {
  width: 0;
  height: 1px;
  background: rgba(245, 239, 227, 0.4);
  transition: width 0.8s cubic-bezier(.22,1,.36,1);
}
.rule-frag.show { width: 42px; }
.est,
.date {
  opacity: 0;
  transition: opacity 0.7s ease 0.2s;
  color: var(--cream);
  letter-spacing: 0.32em;
}
.est.show,
.date.show { opacity: 0.6; }
.date { letter-spacing: 0.22em; }

/* Brand wrapper */
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
}

/* "Bazar" — huge italic serif display */
.brand-name {
  margin: 0;
  line-height: 0.9;
  opacity: 0;
  transform: scale(0.92) translateY(20px);
  transition: opacity 1.1s cubic-bezier(.22,1,.36,1), transform 1.1s cubic-bezier(.22,1,.36,1);
}
.brand-name.show {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.brand-italic {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-style: italic;
  font-size: 120px;
  font-weight: 500;
  letter-spacing: -0.05em;
  color: #FFFAEC;
  text-shadow:
    0 0 30px rgba(245, 239, 227, 0.35),
    0 0 60px rgba(201, 150, 98, 0.20),
    0 4px 16px rgba(0, 0, 0, 0.4);
}

/* "— Market —" row */
.mid-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: -10px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.8s cubic-bezier(.22,1,.36,1) 0.1s, transform 0.8s cubic-bezier(.22,1,.36,1) 0.1s;
}
.mid-row.show {
  opacity: 1;
  transform: translateY(0);
}
.mid-line {
  display: block;
  width: 36px;
  height: 1px;
  background: rgba(245, 239, 227, 0.6);
}
.mid-word {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 20;
  font-size: 32px;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #FFFAEC;
  padding-right: 0;
  padding-left: 0.15em;
  text-shadow: 0 0 20px rgba(245, 239, 227, 0.25), 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* "Go" pill */
.go-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  padding: 8px 18px;
  border: 1px solid rgba(245, 239, 227, 0.35);
  border-radius: 999px;
  background: rgba(245, 239, 227, 0.04);
  backdrop-filter: blur(6px);
  opacity: 0;
  transform: translateY(12px) scale(0.95);
  transition: opacity 0.7s cubic-bezier(.34,1.56,.64,1) 0.1s, transform 0.7s cubic-bezier(.34,1.56,.64,1) 0.1s;
}
.go-wrap.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.go-bracket {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 18px;
  color: var(--terracotta);
  font-weight: 400;
  line-height: 1;
}
.go-word {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 22px;
  font-weight: 500;
  color: var(--cream);
  letter-spacing: -0.01em;
  line-height: 1;
}
.go-arrow {
  font-size: 15px;
  color: var(--terracotta);
  font-weight: 600;
  line-height: 1;
  animation: arrow-pulse 1.6s ease-in-out infinite;
}
@keyframes arrow-pulse {
  0%, 100% { transform: translateX(0); opacity: 0.7; }
  50% { transform: translateX(3px); opacity: 1; }
}

.tagline {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 14px;
  color: rgba(245, 239, 227, 0.6);
  margin-top: 28px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.8s ease, transform 0.8s ease;
  letter-spacing: 0.01em;
  text-align: center;
}
.tagline.show {
  opacity: 1;
  transform: translateY(0);
}
</style>
