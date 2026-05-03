<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from '../router/index.js'

const { navigate } = useRouter()
const stage = ref(0)
let tid = null

const fruits = [
  { emoji: '🍎', x: 22, d: 0.15, color: '#ef4444', rot: 200  },
  { emoji: '🍊', x: 76, d: 0.50, color: '#fb923c', rot: -180 },
  { emoji: '🍉', x: 44, d: 0.85, color: '#4ade80', rot: 260  },
  { emoji: '🍋', x: 83, d: 1.15, color: '#facc15', rot: -220 },
  { emoji: '🍓', x: 14, d: 1.40, color: '#f87171', rot: 200  },
  { emoji: '🥝', x: 58, d: 1.65, color: '#86efac', rot: -240 },
  { emoji: '🍇', x: 30, d: 1.90, color: '#c084fc', rot: 180  },
  { emoji: '🍌', x: 68, d: 2.10, color: '#fde047', rot: -200 },
]

// slice happens 0.5s after each fruit starts falling
const FALL = 0.5

onMounted(() => {
  setTimeout(() => stage.value = 1, 50)    // fruits begin
  setTimeout(() => stage.value = 2, 3300)  // flash + logo
  setTimeout(() => stage.value = 3, 3900)  // text
  setTimeout(() => stage.value = 4, 4400)  // tagline
  tid = setTimeout(() => {
    stage.value = 5
    setTimeout(() => navigate('home'), 650)
  }, 5500)
})

onUnmounted(() => { if (tid) clearTimeout(tid) })
</script>

<template>
  <div class="splash" :class="{ exit: stage >= 5 }">

    <!-- ── gradient mesh bg ── -->
    <div class="bg">
      <div class="bg-o b1"></div>
      <div class="bg-o b2"></div>
      <div class="bg-o b3"></div>
    </div>

    <!-- ── fruit arena ── -->
    <div v-if="stage >= 1" class="arena">
      <div v-for="f in fruits" :key="f.emoji" class="fp" :style="{ left: f.x + '%' }">

        <!-- fall container -->
        <div class="fall" :style="{
          animationDelay: f.d + 's',
          '--rot': f.rot + 'deg',
        }">

          <!-- whole fruit (pops at slice) -->
          <div class="whole" :style="{ animationDelay: (f.d + FALL) + 's' }">
            <span class="em">{{ f.emoji }}</span>
          </div>

          <!-- left half -->
          <div class="half hl" :style="{ animationDelay: (f.d + FALL) + 's' }">
            <span class="em">{{ f.emoji }}</span>
          </div>

          <!-- right half -->
          <div class="half hr" :style="{ animationDelay: (f.d + FALL) + 's' }">
            <span class="em">{{ f.emoji }}</span>
          </div>

          <!-- slash blade -->
          <div class="blade" :style="{
            animationDelay: (f.d + FALL - 0.04) + 's',
            '--sa': (f.rot > 0 ? 28 : -28) + 'deg',
          }"></div>

          <!-- juice burst -->
          <div v-for="j in 6" :key="j" class="jw"
            :style="{ transform: 'rotate(' + (j * 60 + 10) + 'deg)' }">
            <div class="jd" :style="{
              background: f.color,
              animationDelay: (f.d + FALL) + 's',
              width:  (3 + Math.random() * 5) + 'px',
              height: (3 + Math.random() * 5) + 'px',
            }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── center flash (after last fruit) ── -->
    <div v-if="stage >= 2" class="flash"></div>

    <!-- ── logo ── -->
    <div :class="['lw', { show: stage >= 2 }]">
      <div class="lg"></div>
      <div class="lp lp1"></div>
      <div class="lp lp2"></div>
      <div class="lb">
        <img src="/logo.png" alt="Bazar Market" class="li" />
      </div>
    </div>

    <!-- ── brand ── -->
    <div class="br">
      <span :class="['bb', { show: stage >= 3 }]">BAZAR</span>
      <span :class="['bd', { show: stage >= 3 }]"></span>
      <span :class="['bm', { show: stage >= 3 }]">MARKET</span>
    </div>

    <!-- ── tagline ── -->
    <p :class="['tg', { show: stage >= 4 }]">Fresh · Fast · Delivered</p>

    <!-- ── shimmer ── -->
    <div v-if="stage >= 4" class="shm"></div>
  </div>
</template>

<style scoped>
/* ═════════════════════════════════
   Fruit-Slash Splash
   ═════════════════════════════════ */
.splash {
  width: 100%; min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  gap: 24px;
  background: linear-gradient(155deg, #6EE7B7 0%, #34D399 25%, #10B981 55%, #059669 100%);
}
.exit { animation: ex .65s cubic-bezier(.4,0,.2,1) forwards; }
@keyframes ex {
  to { opacity: 0; transform: scale(1.06); filter: blur(8px); }
}

/* ── BG MESH ── */
.bg { position: absolute; inset: 0; }
.bg-o { position: absolute; border-radius: 50%; }
.b1 { width: 360px; height: 360px; background: radial-gradient(circle,rgba(167,243,208,.4),transparent 65%); top: -18%; left: -22%; animation: bf 6s ease-in-out infinite alternate; }
.b2 { width: 300px; height: 300px; background: radial-gradient(circle,rgba(52,211,153,.35),transparent 65%); bottom: -12%; right: -18%; animation: bf 7s ease-in-out infinite alternate-reverse; }
.b3 { width: 220px; height: 220px; background: radial-gradient(circle,rgba(110,231,183,.3),transparent 65%); top: 38%; left: 55%; animation: bf 5s ease-in-out infinite alternate 1s; }
@keyframes bf { to { transform: translate(25px,-18px) scale(1.12); } }

/* ═══ FRUIT ARENA ═══ */
.arena { position: absolute; inset: 0; z-index: 10; pointer-events: none; }
.fp { position: absolute; top: 0; transform: translateX(-50%); }

/* ── FALL (gravity) ── */
.fall {
  position: relative; width: 56px; height: 56px;
  animation: fd .55s cubic-bezier(.45,0,1,.45) both;
}
@keyframes fd {
  0%   { transform: translateY(-90px) rotate(0deg); }
  100% { transform: translateY(38vh) rotate(var(--rot,200deg)); }
}

/* ── WHOLE FRUIT → POP ── */
.whole {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  animation: fp .22s ease-out both;
}
@keyframes fp {
  0%   { transform: scale(1);   opacity: 1; }
  35%  { transform: scale(1.35); opacity: .85; }
  100% { transform: scale(2);   opacity: 0; }
}

.em { font-size: 46px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,.15)); }

/* ── HALVES ── */
.half {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
}
.hl { clip-path: polygon(0 0, 52% 0, 48% 100%, 0 100%); animation: fl .55s ease-out both; }
.hr { clip-path: polygon(48% 0, 100% 0, 100% 100%, 52% 100%); animation: fr .55s ease-out both; }

@keyframes fl {
  0%   { opacity: 0; transform: translate(0,0) rotate(0); }
  6%   { opacity: 1; }
  100% { opacity: 0; transform: translate(-85px,110px) rotate(-50deg); }
}
@keyframes fr {
  0%   { opacity: 0; transform: translate(0,0) rotate(0); }
  6%   { opacity: 1; }
  100% { opacity: 0; transform: translate(85px,100px) rotate(50deg); }
}

/* ── BLADE SLASH ── */
.blade {
  position: absolute; top: 50%; left: 50%;
  width: 150px; height: 3px;
  margin: -1.5px 0 0 -75px;
  background: linear-gradient(90deg, transparent 5%, rgba(255,255,255,.85) 25%, #fff 50%, rgba(255,255,255,.85) 75%, transparent 95%);
  border-radius: 3px;
  box-shadow: 0 0 14px rgba(255,255,255,.7), 0 0 36px rgba(255,255,255,.25);
  opacity: 0;
  rotate: var(--sa, 25deg);
  animation: sl .28s ease-out both;
}
@keyframes sl {
  0%   { opacity: 0; scale: 0 1; }
  25%  { opacity: 1; }
  55%  { opacity: 1; scale: 1.05 1; }
  100% { opacity: 0; scale: 1.3 1; }
}

/* ── JUICE PARTICLES ── */
.jw {
  position: absolute; top: 50%; left: 50%;
  width: 0; height: 0;
}
.jd {
  border-radius: 50%; opacity: 0;
  box-shadow: 0 0 4px currentColor;
  animation: jf .52s ease-out both;
}
@keyframes jf {
  0%   { opacity: 0; transform: translateY(0) scale(1); }
  12%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-80px) scale(.15); }
}

/* ═══ CENTER FLASH ═══ */
.flash {
  position: absolute; top: 50%; left: 50%;
  width: 280px; height: 280px;
  margin: -140px 0 0 -140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.5), transparent 60%);
  z-index: 15;
  animation: cf .6s ease-out both;
}
@keyframes cf {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(3.5); opacity: 0; }
}

/* ═══ LOGO ═══ */
.lw {
  position: relative; z-index: 20;
  opacity: 0; transform: scale(0);
}
.lw.show { animation: li .85s cubic-bezier(.34,1.56,.64,1) forwards; }
@keyframes li {
  0%   { opacity: 0; transform: scale(0) rotate(-18deg); }
  45%  { opacity: 1; transform: scale(1.12) rotate(3deg); }
  70%  { transform: scale(.95) rotate(-1.5deg); }
  85%  { transform: scale(1.03) rotate(.5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}

.lg {
  position: absolute; inset: -45px; border-radius: 50%;
  background: radial-gradient(circle, rgba(167,243,208,.5), transparent 60%);
  animation: gp 2.5s ease-in-out infinite; z-index: -1;
}
@keyframes gp {
  0%,100% { transform: scale(.85); opacity: .35; }
  50%     { transform: scale(1.25); opacity: .7; }
}

.lp {
  position: absolute; inset: -10px; border-radius: 34px;
  border: 1.5px solid rgba(255,255,255,.18); z-index: -1;
}
.lp1 { animation: pe 2s ease-out .6s infinite; }
.lp2 { animation: pe 2s ease-out 1.2s infinite; }
@keyframes pe {
  0%   { transform: scale(1); opacity: .45; }
  100% { transform: scale(1.9); opacity: 0; }
}

.lb {
  width: 120px; height: 120px; border-radius: 32px;
  background: rgba(255,255,255,.15);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1.5px solid rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 32px rgba(0,0,0,.12), inset 0 -1px 0 rgba(255,255,255,.1);
}
.li { width: 76px; height: 76px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,.12)); }

/* ═══ BRAND TEXT ═══ */
.br { display: flex; align-items: center; gap: 14px; z-index: 20; overflow: hidden; }

.bb, .bm {
  letter-spacing: 6px;
  transform: translateY(110%); opacity: 0;
}
.bb { font-size: 30px; font-weight: 800; color: #fff; text-shadow: 0 2px 16px rgba(0,0,0,.12); }
.bm { font-size: 30px; font-weight: 300; color: rgba(255,255,255,.78); }

.bb.show { animation: tu .65s cubic-bezier(.22,1,.36,1) forwards; }
.bm.show { animation: tu .65s cubic-bezier(.22,1,.36,1) .12s forwards; }
@keyframes tu {
  0%   { transform: translateY(110%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.bd {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,.4);
  transform: scale(0); opacity: 0;
}
.bd.show { animation: dp .35s cubic-bezier(.34,1.56,.64,1) .18s forwards; }
@keyframes dp {
  0%   { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* ═══ TAGLINE ═══ */
.tg {
  font-size: 11px; font-weight: 500;
  color: rgba(255,255,255,0); letter-spacing: 5px;
  text-transform: uppercase; z-index: 20;
  transform: translateY(8px);
}
.tg.show { animation: tf .8s ease forwards; }
@keyframes tf {
  to { color: rgba(255,255,255,.45); transform: translateY(0); }
}

/* ═══ SHIMMER ═══ */
.shm {
  position: absolute; inset: 0; z-index: 25;
  pointer-events: none; overflow: hidden;
}
.shm::after {
  content: ''; position: absolute;
  top: -50%; left: -80%; width: 60%; height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.04) 35%, rgba(255,255,255,.12) 50%, rgba(255,255,255,.04) 65%, transparent);
  transform: rotate(25deg);
  animation: ss 1s ease-in-out .15s both;
}
@keyframes ss {
  0%   { translate: -50% 0; }
  100% { translate: 250% 0; }
}
</style>
