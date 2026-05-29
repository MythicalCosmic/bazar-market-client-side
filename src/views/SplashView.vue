<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router/index.js'

const { navigate } = useRouter()
const stage = ref(0)
const timers = []

const fruits = [
  { name: 'apple',  color: '#10B981', delay: 0,    sx: -120, sy: -80,  ex: -58, ey: -52 },
  { name: 'pear',   color: '#34D399', delay: 0.35,  sx: 120,  sy: -80,  ex: 58,  ey: -48 },
  { name: 'citrus', color: '#6EE7B7', delay: 0.70,  sx: -120, sy: 80,   ex: -54, ey: 52  },
  { name: 'leaf',   color: '#059669', delay: 1.05,  sx: 120,  sy: 80,   ex: 54,  ey: 48  },
]

function sched(fn, ms) { timers.push(setTimeout(fn, ms)) }

onMounted(() => {
  sched(() => stage.value = 1, 100)
  sched(() => stage.value = 2, 2500)
  sched(() => stage.value = 3, 3100)
  sched(() => stage.value = 4, 3900)
  sched(() => stage.value = 5, 4700)
  sched(() => { stage.value = 6; sched(() => navigate('home'), 650) }, 5600)
})

onUnmounted(() => timers.forEach(t => clearTimeout(t)))
</script>

<template>
  <div class="splash" :class="{ exit: stage >= 6 }">

    <!-- ── Ambient background ── -->
    <div class="bg">
      <div class="bg-o o1"></div>
      <div class="bg-o o2"></div>
      <div class="bg-o o3"></div>
    </div>

    <!-- ── Fruit stage ── -->
    <div class="fstage">
      <div v-for="f in fruits" :key="f.name"
        class="fi"
        :class="{ enter: stage >= 1, detail: stage >= 2, converge: stage >= 3 }"
        :style="{
          '--d': f.delay + 's',
          '--c': f.color,
          '--sx': f.sx + 'px', '--sy': f.sy + 'px',
          '--ex': f.ex + 'px', '--ey': f.ey + 'px',
        }">
        <!-- Apple (red) -->
        <svg v-if="f.name === 'apple'" viewBox="0 0 64 64" width="64" height="64" fill="none">
          <path d="M33 10c1-4 5-6 7-4" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M36 12c2-1 4 0 5 2" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path d="M32 16c-11 0-20 10-18 22 2 12 10 18 18 18s16-6 18-18c2-12-7-22-18-22z" fill="#EF4444"/>
          <path d="M32 16c-3 0-6 1-8 3 4-1 8 0 11 3 3-4 7-5 11-4-3-2-8-2-14-2z" fill="#F87171" opacity="0.6"/>
          <path class="fd" d="M32 22v26M26 34q6-6 12 0" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round" opacity="0"/>
        </svg>
        <!-- Pear (yellow-green) -->
        <svg v-else-if="f.name === 'pear'" viewBox="0 0 64 64" width="60" height="60" fill="none">
          <path d="M33 9c0-3 3-5 4-3" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M32 14c-4 0-7 6-9 14s-6 16-2 22c4 6 16 6 20 0 4-6 0-14-2-22s-5-14-7-14z" fill="#A3E635"/>
          <path d="M32 14c-2 0-4 2-5 6 3-2 6-2 9 0-1-4-3-6-4-6z" fill="#BEF264" opacity="0.5"/>
          <path class="fd" d="M32 20v30" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round" opacity="0"/>
        </svg>
        <!-- Orange (citrus cross-section) -->
        <svg v-else-if="f.name === 'citrus'" viewBox="0 0 64 64" width="60" height="60" fill="none">
          <circle cx="32" cy="32" r="22" fill="#FB923C"/>
          <circle cx="32" cy="32" r="19" fill="#FDBA74" opacity="0.5"/>
          <circle cx="32" cy="32" r="17" fill="#FED7AA" opacity="0.3"/>
          <g class="fd" opacity="0">
            <line x1="32" y1="13" x2="32" y2="51" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
            <line x1="15" y1="32" x2="49" y2="32" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
            <line x1="19" y1="19" x2="45" y2="45" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
            <line x1="45" y1="19" x2="19" y2="45" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
          </g>
        </svg>
        <!-- Leaf (green) -->
        <svg v-else-if="f.name === 'leaf'" viewBox="0 0 64 64" width="56" height="56" fill="none">
          <path d="M32 8c-16 8-22 24-16 40 4 8 12 10 16 8s12-10 16-24c4-12 0-22-16-24z" fill="#22C55E"/>
          <path d="M32 8c-8 4-14 12-16 22 6-6 14-10 22-10-1-5-3-9-6-12z" fill="#4ADE80" opacity="0.4"/>
          <g class="fd" opacity="0">
            <path d="M32 14c-4 14-6 26-4 38" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M28 26l-6 5M35 34l5-3M29 42l-5 3" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </g>
        </svg>
      </div>
    </div>

    <!-- ── Light sweep ── -->
    <div v-if="stage >= 2" class="sweep"></div>

    <!-- ── Convergence pulse ── -->
    <div v-if="stage >= 3" class="cpulse"></div>

    <!-- ── Logo ── -->
    <div class="lw" :class="{ show: stage >= 4 }">
      <div class="lglow"></div>
      <div class="lbox">
        <img src="/logo.png" alt="Bazar Market" class="limg" />
      </div>
    </div>

    <!-- ── Brand text ── -->
    <div class="brow">
      <span class="bb" :class="{ show: stage >= 5 }">BAZAR</span>
      <span class="bdot" :class="{ show: stage >= 5 }"></span>
      <span class="bm" :class="{ show: stage >= 5 }">MARKET</span>
    </div>

    <!-- ── Tagline (Uzbek) ── -->
    <p class="tl" :class="{ show: stage >= 5 }">Sifat · Tezlik · Qulay narx.</p>

    <!-- ── Final shimmer ── -->
    <div v-if="stage >= 5" class="shm"></div>
  </div>
</template>

<style scoped>
/* ════════════════════════════════════
   Premium Splash — Fruit Silhouettes
   ════════════════════════════════════ */

.splash {
  width: 100%; min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  gap: 22px;
  background: linear-gradient(155deg, #6EE7B7 0%, #34D399 25%, #10B981 55%, #059669 100%);
}

.exit { animation: _exit .65s cubic-bezier(.4,0,.2,1) forwards; }
@keyframes _exit {
  to { opacity: 0; transform: scale(1.05); filter: blur(8px); }
}

/* ── AMBIENT BG ── */
.bg { position: absolute; inset: 0; pointer-events: none; }
.bg-o { position: absolute; border-radius: 50%; will-change: transform; }
.o1 { width: 320px; height: 320px; background: radial-gradient(circle,rgba(167,243,208,.22),transparent 65%); top: -16%; left: -22%; animation: _bd 9s ease-in-out infinite alternate; }
.o2 { width: 270px; height: 270px; background: radial-gradient(circle,rgba(52,211,153,.18),transparent 65%); bottom: -12%; right: -16%; animation: _bd 10s ease-in-out infinite alternate-reverse; }
.o3 { width: 200px; height: 200px; background: radial-gradient(circle,rgba(110,231,183,.15),transparent 65%); top: 42%; left: 55%; animation: _bd 8s ease-in-out infinite alternate 2s; }
@keyframes _bd { to { transform: translate(18px,-14px) scale(1.08); } }

/* ══ FRUITS ══ */
.fstage {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 10; pointer-events: none;
}

.fi {
  position: absolute;
  opacity: 0;
  transform: translate(var(--sx), var(--sy)) scale(.5);
  filter: drop-shadow(0 8px 20px rgba(0,0,0,.12)) drop-shadow(0 2px 6px rgba(0,0,0,.08));
  will-change: transform, opacity;
}

/* Stage 1 — enter & settle */
.fi.enter {
  animation: _fe .85s cubic-bezier(.22,1,.36,1) var(--d) forwards;
}
@keyframes _fe {
  0%   { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(.5) rotate(-8deg); }
  55%  { opacity: 1; transform: translate(var(--ex), var(--ey)) scale(1.06) rotate(2deg); }
  100% { opacity: 1; transform: translate(var(--ex), var(--ey)) scale(1) rotate(0deg); }
}

/* Stage 2 — inner detail reveal */
.fi.detail :deep(.fd) {
  animation: _dr .7s ease .35s forwards;
}
@keyframes _dr { to { opacity: 1; } }

/* Stage 3 — converge to center */
.fi.converge {
  animation:
    _fe .85s cubic-bezier(.22,1,.36,1) var(--d) forwards,
    _fc .75s cubic-bezier(.4,0,.2,1) forwards;
}
@keyframes _fc {
  0%   { opacity: 1; transform: translate(var(--ex), var(--ey)) scale(1); }
  100% { opacity: 0; transform: translate(0,0) scale(.25) rotate(12deg); }
}

/* ── LIGHT SWEEP ── */
.sweep {
  position: absolute; inset: 0;
  z-index: 12; pointer-events: none; overflow: hidden;
}
.sweep::after {
  content: '';
  position: absolute; top: -60%; left: -140%;
  width: 90px; height: 280%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255,255,255,.02) 15%,
    rgba(255,255,255,.12) 42%,
    rgba(255,255,255,.22) 50%,
    rgba(255,255,255,.12) 58%,
    rgba(255,255,255,.02) 85%,
    transparent
  );
  transform: rotate(28deg);
  animation: _sw .9s cubic-bezier(.4,0,.2,1) forwards;
}
@keyframes _sw {
  0%   { translate: 0 0; }
  100% { translate: calc(100vw + 240px) 0; }
}

/* ── CONVERGENCE PULSE ── */
.cpulse {
  position: absolute; top: 50%; left: 50%;
  width: 140px; height: 140px;
  margin: -70px 0 0 -70px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.28), transparent 65%);
  z-index: 14;
  animation: _cp .85s ease-out forwards;
}
@keyframes _cp {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(3.5); opacity: 0; }
}

/* ══ LOGO ══ */
.lw {
  position: relative; z-index: 20;
  opacity: 0; transform: scale(0);
}
.lw.show {
  animation: _li .8s cubic-bezier(.34,1.56,.64,1) forwards;
}
@keyframes _li {
  0%   { opacity: 0; transform: scale(0); }
  48%  { opacity: 1; transform: scale(1.1); }
  72%  { transform: scale(.96); }
  88%  { transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}

.lglow {
  position: absolute; inset: -44px; border-radius: 50%;
  background: radial-gradient(circle, rgba(167,243,208,.38), transparent 60%);
  animation: _gp 3s ease-in-out infinite; z-index: -1;
}
@keyframes _gp {
  0%,100% { transform: scale(.88); opacity: .3; }
  50%     { transform: scale(1.18); opacity: .55; }
}

.lbox {
  width: 112px; height: 112px; border-radius: 30px;
  background: rgba(255,255,255,.14);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1.5px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 32px rgba(0,0,0,.1), inset 0 -1px 0 rgba(255,255,255,.08);
}
.limg {
  width: 72px; height: 72px; object-fit: contain;
  filter: drop-shadow(0 3px 8px rgba(0,0,0,.1));
}

/* ══ BRAND TEXT ══ */
.brow {
  display: flex; align-items: center; gap: 12px;
  z-index: 20; overflow: hidden;
}

.bb, .bm { letter-spacing: 5px; opacity: 0; }
.bb {
  font-size: 28px; font-weight: 800; color: #fff;
  text-shadow: 0 2px 12px rgba(0,0,0,.1);
  transform: translateX(-28px);
}
.bm {
  font-size: 28px; font-weight: 300;
  color: rgba(255,255,255,.75);
  transform: translateX(28px);
}

.bb.show { animation: _sl .6s cubic-bezier(.22,1,.36,1) forwards; }
.bm.show { animation: _sr .6s cubic-bezier(.22,1,.36,1) .1s forwards; }

@keyframes _sl {
  0%   { opacity: 0; transform: translateX(-28px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes _sr {
  0%   { opacity: 0; transform: translateX(28px); }
  100% { opacity: 1; transform: translateX(0); }
}

.bdot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(255,255,255,.4);
  transform: scale(0); opacity: 0;
}
.bdot.show {
  animation: _dp .35s cubic-bezier(.34,1.56,.64,1) .14s forwards;
}
@keyframes _dp {
  0%   { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* ══ TAGLINE ══ */
.tl {
  font-size: 11px; font-weight: 500;
  color: rgba(255,255,255,0);
  letter-spacing: 4px; text-transform: uppercase;
  z-index: 20; transform: translateY(8px);
}
.tl.show { animation: _tl .75s ease .18s forwards; }
@keyframes _tl {
  to { color: rgba(255,255,255,.48); transform: translateY(0); }
}

/* ══ SHIMMER ══ */
.shm {
  position: absolute; inset: 0; z-index: 25;
  pointer-events: none; overflow: hidden;
}
.shm::after {
  content: ''; position: absolute;
  top: -50%; left: -80%; width: 50%; height: 200%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255,255,255,.03) 35%,
    rgba(255,255,255,.1) 50%,
    rgba(255,255,255,.03) 65%,
    transparent
  );
  transform: rotate(25deg);
  animation: _sh .9s ease-in-out .12s both;
}
@keyframes _sh {
  0%   { translate: -50% 0; }
  100% { translate: 250% 0; }
}
</style>
