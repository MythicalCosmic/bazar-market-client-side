<script setup>
// Access gate: the storefront is a Telegram Mini App and is meant to run only
// inside Telegram's WebView. Outside it (a normal browser hitting
// bazarmarket.org) we show a branded "open in Telegram" screen instead of the
// app. This is a UX/abuse guard, not a substitute for server-side auth — the
// API still enforces phone-OTP sessions on every protected call.
import { useI18n } from '../i18n/index.js'

const BOT_URL = 'https://t.me/BazarMarketRobot'
const { t } = useI18n()

function openBot() {
  window.location.href = BOT_URL
}
</script>

<template>
  <div class="gate">
    <div class="gate-bg">
      <div class="gate-o a"></div>
      <div class="gate-o b"></div>
    </div>

    <div class="gate-card">
      <div class="gate-logo">
        <img src="/logo.png" alt="Bazar Market" />
      </div>

      <h1 class="gate-title">{{ t('gate.title') }}</h1>
      <p class="gate-sub">{{ t('gate.subtitle') }}</p>

      <button class="gate-btn btn-press" @click="openBot">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.9 4.3 18.6 19.8c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.35-.1-.55-.6-.2L4.8 13.3l-4.8-1.5C-.9 11.5-1 11 .3 10.4L20.5 2.6c.9-.35 1.7.2 1.4 1.7Z"/>
        </svg>
        {{ t('gate.open_button') }}
      </button>

      <p class="gate-hint">{{ t('gate.hint') }}</p>
    </div>
  </div>
</template>

<style scoped>
.gate {
  position: fixed; inset: 0; z-index: 300;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #6EE7B7 0%, #10B981 45%, #047857 100%);
  overflow: hidden;
}
.gate-bg { position: absolute; inset: 0; pointer-events: none; }
.gate-o { position: absolute; border-radius: 50%; filter: blur(4px); }
.gate-o.a { width: 320px; height: 320px; top: -14%; left: -22%;
  background: radial-gradient(circle, rgba(167,243,208,.35), transparent 65%);
  animation: gfloat 9s ease-in-out infinite alternate; }
.gate-o.b { width: 260px; height: 260px; bottom: -12%; right: -16%;
  background: radial-gradient(circle, rgba(52,211,153,.28), transparent 65%);
  animation: gfloat 11s ease-in-out infinite alternate-reverse; }
@keyframes gfloat { to { transform: translate(20px,-16px) scale(1.1); } }

.gate-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 340px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 34px 26px 28px;
  border-radius: 28px;
  background: rgba(255,255,255,.14);
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  border: 1.5px solid rgba(255,255,255,.2);
  box-shadow: 0 20px 60px rgba(0,0,0,.18);
  animation: gin .6s cubic-bezier(.22,1,.36,1) both;
}
@keyframes gin { from { opacity: 0; transform: translateY(24px) scale(.96); } }

.gate-logo {
  width: 84px; height: 84px; border-radius: 24px;
  background: rgba(255,255,255,.95);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,.14);
  margin-bottom: 20px;
}
.gate-logo img { width: 54px; height: 54px; object-fit: contain; }

.gate-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: .3px; }
.gate-sub {
  margin-top: 8px; font-size: 14px; line-height: 1.5;
  color: rgba(255,255,255,.85); font-weight: 500;
}
.gate-btn {
  margin-top: 22px; width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  padding: 14px 20px; border: none; border-radius: 16px;
  background: #fff; color: #047857;
  font-size: 15px; font-weight: 700; font-family: inherit;
  box-shadow: 0 8px 22px rgba(0,0,0,.16);
}
.gate-hint {
  margin-top: 14px; font-size: 12px; color: rgba(255,255,255,.7);
  font-weight: 500;
}
</style>
