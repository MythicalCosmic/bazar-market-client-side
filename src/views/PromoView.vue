<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'

const { navigate } = useRouter()
const { t } = useI18n()

const playKey = ref(0)
const DURATION = 15000

let endTimer = null
function startReel() {
  playKey.value++
  clearTimeout(endTimer)
  endTimer = setTimeout(() => {
    // Loop back to the start so it can be screen-recorded continuously,
    // unless the user has navigated away.
    playKey.value++
  }, DURATION + 200)
}

function replay() { startReel() }
function exitReel() { navigate('home') }

onMounted(startReel)
onUnmounted(() => clearTimeout(endTimer))

// Filler data for the reel (doesn't hit any APIs)
const otpDigits = ['9', '0', '1', '2', '3', '4']
const phone = '+998 90 123 45 67'
const categories = [
  { name: "Lag'monlar", color: '#F2D9CB', accent: '#8F4226' },
  { name: 'Konservalar', color: '#DCE6DE', accent: '#0F5132' },
  { name: 'Sneklar',     color: '#F0DCC3', accent: '#8F4226' },
  { name: 'Yog\'lar',    color: '#ECF3EE', accent: '#1E6F47' },
]
</script>

<template>
  <div class="reel" :key="playKey">
    <!-- Top chrome (skip/replay) -->
    <div class="reel-chrome">
      <button @click="exitReel" class="chrome-btn">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
      </button>
      <span class="chrome-label">REEL · 00:15</span>
      <button @click="replay" class="chrome-btn">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 3v5h5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <!-- Progress bar -->
    <div class="progress">
      <div class="progress-bar"></div>
    </div>

    <!-- ═══ SCENE 1 — Brand intro (0–2.4s) ═══ -->
    <section class="scene scene-1">
      <div class="s1-bg">
        <span class="s1-orb s1-orb-a"></span>
        <span class="s1-orb s1-orb-b"></span>
        <span v-for="n in 8" :key="n" class="s1-firefly" :style="{ '--x': ((n*37)%100)+'%', '--d': (n*0.2)+'s' }"></span>
      </div>
      <div class="s1-content">
        <p class="s1-eyebrow">EST · MMXXV</p>
        <h1 class="s1-bazar">Bazar</h1>
        <div class="s1-mid">
          <span class="s1-rule"></span>
          <span class="s1-market">MARKET</span>
          <span class="s1-rule"></span>
        </div>
        <div class="s1-go">
          <span class="s1-go-word">Go</span>
          <span class="s1-go-arrow">→</span>
        </div>
      </div>
    </section>

    <!-- ═══ SCENE 2 — Authenticate (2.4–4.8s) ═══ -->
    <section class="scene scene-2">
      <div class="s2-content">
        <div class="s2-step-row">
          <span class="num-italic">№</span>
          <span class="s2-step">STEP 01 / 02</span>
        </div>
        <p class="s2-eyebrow">WELCOME</p>
        <h2 class="s2-headline">
          Step into<br/>
          <em class="s2-italic">the market</em>.
        </h2>

        <div class="s2-input">
          <span class="s2-phone">{{ phone }}</span>
          <span class="s2-caret">|</span>
        </div>

        <div class="s2-otp">
          <span v-for="(d, i) in otpDigits" :key="i" class="s2-otp-cell" :style="{ '--i': i }">{{ d }}</span>
        </div>

        <div class="s2-verify">
          <span>VERIFY</span>
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
    </section>

    <!-- ═══ SCENE 3 — Categories stagger (4.8–7.4s) ═══ -->
    <section class="scene scene-3">
      <div class="s3-content">
        <p class="s3-eyebrow">№ 01 · BROWSE</p>
        <h2 class="s3-headline">All <em>departments</em></h2>
        <div class="s3-grid">
          <div v-for="(cat, i) in categories" :key="i" class="s3-card" :style="{ '--bg': cat.color, '--accent': cat.accent, '--i': i }">
            <span class="s3-card-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <p class="s3-card-name">{{ cat.name }}</p>
            <p class="s3-card-sub">12+ MAHSULOT</p>
          </div>
        </div>
        <!-- Cursor tap on card #1 -->
        <span class="s3-cursor"></span>
      </div>
    </section>

    <!-- ═══ SCENE 4 — Product + add to cart (7.4–10.0s) ═══ -->
    <section class="scene scene-4">
      <div class="s4-content">
        <p class="s4-eyebrow">№ 042 · MAHSULOT</p>
        <h2 class="s4-headline">Lag'mon <em>uy uchun</em></h2>

        <div class="s4-img-frame">
          <div class="s4-img-inset"></div>
          <div class="s4-product">
            <div class="s4-bottle"></div>
            <div class="s4-cap"></div>
          </div>
          <span class="s4-discount">−25%</span>
        </div>

        <div class="s4-row">
          <div>
            <p class="s4-price-label">NARX</p>
            <p class="s4-price">15 000 <span class="s4-currency">so'm</span></p>
          </div>
          <div class="s4-add">
            <span>SAVATCHAGA</span>
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Cart badge flying in -->
        <div class="s4-cart-badge">+1</div>
      </div>
    </section>

    <!-- ═══ SCENE 5 — Checkout total (10.0–12.6s) ═══ -->
    <section class="scene scene-5">
      <div class="s5-content">
        <p class="s5-eyebrow">§ CHECKOUT</p>
        <h2 class="s5-headline">Place your <em>order</em></h2>

        <div class="s5-summary">
          <div class="s5-line"><span class="s5-l-label">Mahsulotlar (3)</span><span class="s5-l-val">42 000 <span class="s5-cur">so'm</span></span></div>
          <div class="s5-line"><span class="s5-l-label">Yetkazib berish</span><span class="s5-l-val">10 000 <span class="s5-cur">so'm</span></span></div>
          <div class="s5-line s5-discount"><span class="s5-l-label">Chegirma</span><span class="s5-l-val">−5 000 <span class="s5-cur">so'm</span></span></div>
          <div class="s5-rule"></div>
          <div class="s5-total">
            <span class="s5-total-label">JAMI</span>
            <span class="s5-total-val">47 000 <span class="s5-cur">so'm</span></span>
          </div>
        </div>

        <div class="s5-cta">
          <span>BUYURTMA BERISH</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <!-- Confirm check -->
        <div class="s5-check">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
    </section>

    <!-- ═══ SCENE 6 — Outro (12.6–15.0s) ═══ -->
    <section class="scene scene-6">
      <div class="s6-bg">
        <span class="s6-orb s6-orb-a"></span>
        <span class="s6-orb s6-orb-b"></span>
      </div>
      <div class="s6-content">
        <div class="s6-rule-top">
          <span class="s6-rule"></span>
          <span class="s6-star">✦</span>
          <span class="s6-rule"></span>
        </div>
        <h1 class="s6-brand">
          <em class="s6-bazar">Bazar</em>
          <span class="s6-market">Market</span>
        </h1>
        <p class="s6-tagline">Mahalliy bozor — kunduzi</p>
        <div class="s6-go">
          <span>Go</span>
          <span class="s6-arrow">→</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ════════════════════════════════════
   15-second editorial promo reel
   6 scenes × ~2.5s, pure CSS timeline
   ════════════════════════════════════ */

.reel {
  position: fixed;
  inset: 0;
  background: #0E1411;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  z-index: 100;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

/* Chrome */
.reel-chrome {
  position: absolute;
  top: 12px;
  left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  z-index: 200;
}
.chrome-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(245, 239, 227, 0.10);
  border: 1px solid rgba(245, 239, 227, 0.20);
  color: #F5EFE3;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  backdrop-filter: blur(8px);
}
.chrome-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: rgba(245, 239, 227, 0.55);
}

/* Progress bar (15s sweep) */
.progress {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: rgba(245, 239, 227, 0.08);
  z-index: 200;
}
.progress-bar {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #C99662, #B85C3A);
  animation: progress-sweep 15s linear forwards;
}
@keyframes progress-sweep {
  to { width: 100%; }
}

/* Generic scene fade — each scene only visible during its window */
.scene {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
}
.scene-1 { animation: scene 2.4s ease forwards 0.0s; background: #194B37; }
.scene-2 { animation: scene 2.4s ease forwards 2.4s; background: #FAF7F1; }
.scene-3 { animation: scene 2.6s ease forwards 4.8s; background: #FAF7F1; }
.scene-4 { animation: scene 2.6s ease forwards 7.4s; background: #FAF7F1; }
.scene-5 { animation: scene 2.6s ease forwards 10.0s; background: #FAF7F1; }
.scene-6 { animation: scene 2.4s ease forwards 12.6s; background: #1A4D38; }

@keyframes scene {
  0%   { opacity: 0; transform: scale(1.02); }
  8%   { opacity: 1; transform: scale(1); }
  92%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.99); }
}

/* ═══ SCENE 1 — Brand ═══ */
.scene-1 {
  background:
    radial-gradient(ellipse at 78% 12%, rgba(201,150,98,0.32), transparent 45%),
    radial-gradient(ellipse at 18% 75%, rgba(60,175,125,0.45), transparent 55%),
    linear-gradient(165deg, #3D8F66 0%, #2F7A53 35%, #194B37 100%);
  color: #F5EFE3;
}
.s1-bg { position: absolute; inset: 0; overflow: hidden; }
.s1-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}
.s1-orb-a { width: 240px; height: 240px; background: #5DBF8A; top: -10%; right: -10%; opacity: 0.5; }
.s1-orb-b { width: 200px; height: 200px; background: #E8B585; bottom: -10%; left: 30%; opacity: 0.3; }

.s1-firefly {
  position: absolute;
  bottom: -10px;
  left: var(--x);
  width: 3px; height: 3px;
  border-radius: 50%;
  background: #FFEFC2;
  box-shadow: 0 0 8px 2px rgba(255,239,194,0.7);
  animation: s1-rise 4s ease-in var(--d) infinite;
}
@keyframes s1-rise {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 0.9; }
  100% { transform: translateY(-100vh); opacity: 0; }
}

.s1-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.s1-eyebrow {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.32em;
  color: rgba(245,239,227,0.55);
  opacity: 0;
  animation: in-up 0.7s ease forwards 0.1s;
}
.s1-bazar {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 96px;
  font-weight: 500;
  letter-spacing: -0.05em;
  color: #FFFAEC;
  line-height: 0.9;
  margin: 0;
  text-shadow: 0 0 30px rgba(245,239,227,0.35), 0 4px 16px rgba(0,0,0,0.4);
  opacity: 0;
  transform: scale(0.85);
  animation: s1-bazar-in 0.9s cubic-bezier(.22,1,.36,1) forwards 0.3s;
}
@keyframes s1-bazar-in {
  to { opacity: 1; transform: scale(1); }
}

.s1-mid {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: -4px;
  opacity: 0;
  animation: in-up 0.7s ease forwards 0.9s;
}
.s1-rule {
  display: block;
  width: 30px;
  height: 1px;
  background: rgba(245,239,227,0.6);
}
.s1-market {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: 0.32em;
  color: #FFFAEC;
}

.s1-go {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 10px 22px 11px 20px;
  border-radius: 999px;
  background: linear-gradient(135deg, #D17A56 0%, #B85C3A 60%, #8F4226 100%);
  box-shadow: 0 0 40px rgba(184,92,58,0.5), 0 8px 20px rgba(0,0,0,0.35);
  opacity: 0;
  transform: scale(0.85);
  animation: s1-go-in 0.6s cubic-bezier(.34,1.56,.64,1) forwards 1.3s;
}
@keyframes s1-go-in {
  to { opacity: 1; transform: scale(1); }
}
.s1-go-word {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 22px;
  font-weight: 600;
  color: #FFFAEC;
}
.s1-go-arrow {
  color: #FFFAEC;
  font-weight: 700;
  font-size: 16px;
}

/* ═══ SCENE 2 — Auth ═══ */
.s2-content {
  width: 100%;
  max-width: 360px;
}
.s2-step-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  opacity: 0;
  animation: in-up 0.5s ease forwards 0.1s;
}
.num-italic {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  color: #B85C3A;
  font-size: 12px;
}
.s2-step {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #8A8C7F;
}

.s2-eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #8A8C7F;
  margin-bottom: 8px;
  opacity: 0;
  animation: in-up 0.5s ease forwards 0.15s;
}
.s2-headline {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 42px;
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 0.95;
  color: #1A2620;
  margin: 0 0 24px;
  opacity: 0;
  animation: in-up 0.6s ease forwards 0.25s;
}
.s2-italic {
  font-style: italic;
  color: #B85C3A;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
}

.s2-input {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #1A2620;
  background: #FFFFFF;
  opacity: 0;
  animation: in-up 0.5s ease forwards 0.5s;
}
.s2-phone {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 17px;
  font-weight: 500;
  color: #1A2620;
  letter-spacing: 0.03em;
  /* Typing reveal */
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  animation: s2-typing 0.9s steps(20) forwards 0.7s;
}
@keyframes s2-typing {
  to { width: 100%; }
}
.s2-caret {
  color: #B85C3A;
  font-weight: 300;
  margin-left: 2px;
  animation: blink 0.6s ease-in-out infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}

.s2-otp {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.s2-otp-cell {
  width: 44px;
  height: 54px;
  border: 1px solid rgba(26,38,32,0.14);
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 22px;
  font-weight: 500;
  color: #1A2620;
  opacity: 0;
  animation: s2-otp-fill 0.3s ease forwards;
  animation-delay: calc(1.7s + var(--i) * 0.08s);
}
@keyframes s2-otp-fill {
  0%   { opacity: 0; transform: scale(0.6); border-color: rgba(26,38,32,0.14); }
  60%  { opacity: 1; transform: scale(1.1); border-color: #1A2620; }
  100% { opacity: 1; transform: scale(1); border-color: #1A2620; }
}

.s2-verify {
  margin-top: 22px;
  padding: 16px;
  background: #1A2620;
  color: #F5EFE3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  opacity: 0;
  animation: s2-verify-in 0.5s ease forwards 2.05s;
}
@keyframes s2-verify-in {
  0%   { opacity: 0; transform: scale(0.96); }
  60%  { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}

/* ═══ SCENE 3 — Categories ═══ */
.s3-content {
  position: relative;
  width: 100%;
  max-width: 360px;
}
.s3-eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #8A8C7F;
  margin-bottom: 8px;
  opacity: 0;
  animation: in-up 0.5s ease forwards 0.1s;
}
.s3-headline {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 36px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 0.95;
  color: #1A2620;
  margin: 0 0 18px;
  opacity: 0;
  animation: in-up 0.6s ease forwards 0.2s;
}
.s3-headline em {
  font-style: italic;
  color: #B85C3A;
}
.s3-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.s3-card {
  position: relative;
  padding: 14px;
  background: var(--bg);
  border: 1px solid rgba(26,38,32,0.10);
  min-height: 92px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) rotate(-2deg);
  animation: s3-card-in 0.55s cubic-bezier(.22,1,.36,1) forwards;
  animation-delay: calc(0.4s + var(--i) * 0.12s);
}
@keyframes s3-card-in {
  to { opacity: 1; transform: translateY(0) rotate(0); }
}
.s3-card-num {
  position: absolute;
  bottom: -16px;
  right: -6px;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 64px;
  font-weight: 500;
  color: var(--accent);
  opacity: 0.18;
  line-height: 1;
}
.s3-card-name {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 15px;
  font-weight: 500;
  color: #1A2620;
  margin-bottom: 6px;
  position: relative;
  z-index: 2;
}
.s3-card-sub {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--accent);
  position: relative;
  z-index: 2;
}

/* Cursor tap effect on first card */
.s3-cursor {
  position: absolute;
  top: 130px;
  left: 80px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(184,92,58,0.20);
  border: 2px solid #B85C3A;
  opacity: 0;
  pointer-events: none;
  animation: s3-tap 0.6s ease forwards 1.7s;
}
@keyframes s3-tap {
  0%   { opacity: 0; transform: scale(2); }
  50%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.7); }
}

/* ═══ SCENE 4 — Product detail ═══ */
.s4-content {
  position: relative;
  width: 100%;
  max-width: 360px;
}
.s4-eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #8A8C7F;
  margin-bottom: 8px;
  opacity: 0;
  animation: in-up 0.5s ease forwards 0.1s;
}
.s4-headline {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
  color: #1A2620;
  margin: 0 0 16px;
  opacity: 0;
  animation: in-up 0.6s ease forwards 0.2s;
}
.s4-headline em {
  font-style: italic;
  color: #B85C3A;
}
.s4-img-frame {
  position: relative;
  height: 200px;
  background: #F0EBDD;
  border: 1px solid rgba(26,38,32,0.10);
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: in-up 0.7s ease forwards 0.4s;
  overflow: hidden;
}
.s4-img-inset {
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(26,38,32,0.06);
  pointer-events: none;
}
/* Pseudo product: gradient bottle */
.s4-product {
  position: relative;
  width: 80px;
  height: 140px;
  transform: scale(0.6);
  opacity: 0;
  animation: s4-product-in 0.7s cubic-bezier(.22,1,.36,1) forwards 0.55s;
}
@keyframes s4-product-in {
  to { opacity: 1; transform: scale(1); }
}
.s4-bottle {
  position: absolute;
  inset: 14px 0 0 0;
  background: linear-gradient(180deg, #C99662 0%, #B85C3A 100%);
  border-radius: 30px 30px 8px 8px;
  box-shadow: inset -8px 0 14px rgba(0,0,0,0.18), 0 6px 16px rgba(26,38,32,0.18);
}
.s4-cap {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 22px;
  background: #1A2620;
  border-radius: 4px 4px 2px 2px;
}
.s4-discount {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 10px;
  background: #5C2A2E;
  color: #F5EFE3;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  animation: in-up 0.4s ease forwards 0.9s;
}

.s4-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  opacity: 0;
  animation: in-up 0.5s ease forwards 1.1s;
}
.s4-price-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #8A8C7F;
  margin-bottom: 4px;
}
.s4-price {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 28px;
  font-weight: 500;
  color: #1A2620;
  letter-spacing: -0.02em;
}
.s4-currency {
  font-size: 12px;
  color: #8A8C7F;
  font-style: italic;
}
.s4-add {
  padding: 13px 18px;
  background: #1A2620;
  color: #F5EFE3;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: s4-add-tap 0.5s ease forwards 1.7s;
  transform-origin: center;
}
@keyframes s4-add-tap {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}

.s4-cart-badge {
  position: absolute;
  top: 0;
  right: 8px;
  background: #B85C3A;
  color: #F5EFE3;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 22px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 16px rgba(184,92,58,0.45);
  opacity: 0;
  animation: s4-badge-pop 0.7s cubic-bezier(.34,1.56,.64,1) forwards 1.9s;
}
@keyframes s4-badge-pop {
  0%   { opacity: 0; transform: translateY(20px) scale(0.5); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.15); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* ═══ SCENE 5 — Checkout total ═══ */
.s5-content {
  position: relative;
  width: 100%;
  max-width: 360px;
}
.s5-eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #8A8C7F;
  margin-bottom: 8px;
  opacity: 0;
  animation: in-up 0.5s ease forwards 0.1s;
}
.s5-headline {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
  color: #1A2620;
  margin: 0 0 22px;
  opacity: 0;
  animation: in-up 0.6s ease forwards 0.2s;
}
.s5-headline em {
  font-style: italic;
  color: #B85C3A;
}

.s5-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;
}
.s5-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  opacity: 0;
  animation: in-up 0.45s ease forwards;
}
.s5-summary .s5-line:nth-child(1) { animation-delay: 0.4s; }
.s5-summary .s5-line:nth-child(2) { animation-delay: 0.55s; }
.s5-summary .s5-line:nth-child(3) { animation-delay: 0.7s; }
.s5-l-label {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 14px;
  color: #4D5950;
}
.s5-l-val {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 15px;
  font-weight: 500;
  color: #1A2620;
}
.s5-discount .s5-l-val {
  color: #5C2A2E;
}
.s5-cur {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #8A8C7F;
  margin-left: 4px;
  text-transform: uppercase;
}
.s5-rule {
  height: 1px;
  background: #1A2620;
  opacity: 0.22;
  margin: 6px 0;
  opacity: 0;
  animation: s5-rule-in 0.5s ease forwards 0.85s;
  transform-origin: left;
  transform: scaleX(0);
}
@keyframes s5-rule-in {
  to { opacity: 0.22; transform: scaleX(1); }
}
.s5-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  opacity: 0;
  animation: in-up 0.5s ease forwards 1.0s;
}
.s5-total-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #8A8C7F;
}
.s5-total-val {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 24px;
  font-weight: 600;
  color: #1A2620;
  letter-spacing: -0.02em;
}

.s5-cta {
  padding: 16px;
  background: #1A2620;
  color: #F5EFE3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  opacity: 0;
  animation: in-up 0.5s ease forwards 1.4s;
}

.s5-check {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  margin: -40px 0 0 -40px;
  border-radius: 50%;
  background: #0F5132;
  color: #F5EFE3;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: s5-check-in 0.6s cubic-bezier(.34,1.56,.64,1) forwards 1.95s;
  box-shadow: 0 0 60px rgba(15,81,50,0.55), 0 12px 32px rgba(0,0,0,0.25);
}
@keyframes s5-check-in {
  0%   { opacity: 0; transform: scale(0.3); }
  60%  { opacity: 1; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
}

/* ═══ SCENE 6 — Outro ═══ */
.scene-6 {
  background:
    radial-gradient(ellipse at 50% 30%, rgba(201,150,98,0.30), transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(60,175,125,0.40), transparent 55%),
    linear-gradient(165deg, #3D8F66 0%, #2F7A53 35%, #194B37 100%);
  color: #F5EFE3;
}
.s6-bg { position: absolute; inset: 0; overflow: hidden; }
.s6-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}
.s6-orb-a { width: 280px; height: 280px; background: #5DBF8A; top: -10%; right: -10%; opacity: 0.5; }
.s6-orb-b { width: 220px; height: 220px; background: #E8B585; bottom: -10%; left: 30%; opacity: 0.3; }

.s6-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
.s6-rule-top {
  display: flex;
  align-items: center;
  gap: 14px;
  opacity: 0;
  animation: in-up 0.5s ease forwards 0.1s;
}
.s6-rule {
  display: block;
  width: 36px;
  height: 1px;
  background: rgba(245,239,227,0.5);
}
.s6-star {
  font-family: 'Fraunces', Georgia, serif;
  color: #E8B585;
  font-size: 16px;
}
.s6-brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 0;
  opacity: 0;
  animation: s1-bazar-in 0.9s cubic-bezier(.22,1,.36,1) forwards 0.25s;
}
.s6-bazar {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 144, 'SOFT' 60, 'WONK' 1;
  font-size: 64px;
  font-weight: 500;
  color: #FFFAEC;
  letter-spacing: -0.04em;
  line-height: 0.9;
  text-shadow: 0 0 20px rgba(245,239,227,0.3);
}
.s6-market {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 24px;
  font-weight: 500;
  color: #FFFAEC;
  letter-spacing: 0.16em;
}
.s6-tagline {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 14px;
  color: rgba(245,239,227,0.7);
  opacity: 0;
  animation: in-up 0.6s ease forwards 0.85s;
}
.s6-go {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 20px 11px;
  border-radius: 999px;
  background: linear-gradient(135deg, #D17A56 0%, #B85C3A 60%, #8F4226 100%);
  box-shadow: 0 0 40px rgba(184,92,58,0.5), 0 8px 20px rgba(0,0,0,0.35);
  opacity: 0;
  animation: s1-go-in 0.6s cubic-bezier(.34,1.56,.64,1) forwards 1.25s;
}
.s6-go span {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 22px;
  font-weight: 600;
  color: #FFFAEC;
}
.s6-arrow {
  font-style: normal !important;
  font-size: 16px !important;
  font-weight: 700 !important;
}

/* Shared util — fade up */
@keyframes in-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
