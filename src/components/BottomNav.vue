<script setup>
import { useCartStore } from '../stores/cartStore.js'
import { currentRoute, useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useTelegram } from '../composables/useTelegram.js'
import { computed } from 'vue'
import { useFormat } from '../composables/useFormat.js'

const { totalCount, subtotal } = useCartStore()
const { navigate } = useRouter()
const { t } = useI18n()
const { haptic } = useTelegram()
const { formatPrice } = useFormat()

const navItems = [
  { id: 'home',       labelKey: 'nav.short.home',       icon: 'home'  },
  { id: 'categories', labelKey: 'nav.short.categories', icon: 'grid'  },
  { id: 'favorites',  labelKey: 'nav.short.favorites',  icon: 'heart' },
  { id: 'orders',     labelKey: 'nav.short.orders',     icon: 'receipt' },
  { id: 'profile',    labelKey: 'nav.short.profile',    icon: 'user'  },
]

function onNav(id) { haptic('selection'); navigate(id) }

const isCartVisible = computed(() => totalCount.value > 0 && !['cart','checkout'].includes(currentRoute.value))
</script>

<template>
  <!-- Floating Editorial Cart Bar (slides up when cart has items) -->
  <Teleport to="#app">
    <Transition name="slide-up">
      <button v-if="isCartVisible"
        @click="navigate('cart')"
        class="cart-bar btn-press">
        <div class="flex items-center gap-3 flex-1">
          <div class="cart-bar-icon">
            <span class="text-[12px] font-bold tabular" style="color: var(--cream)">{{ totalCount }}</span>
          </div>
          <div class="text-left">
            <p class="eyebrow-sm" style="color: var(--text-tertiary)">{{ t('ed.your_basket_pre') }} {{ t('ed.basket_italic') }}</p>
            <p class="serif text-[15px] tabular leading-tight" style="color: var(--text-primary); font-weight: 500;">{{ formatPrice(subtotal) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5" style="color: var(--terracotta)">
          <span class="eyebrow-sm" style="color: var(--terracotta)">{{ t('cart.checkout') }}</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </button>
    </Transition>
  </Teleport>

  <!-- Floating Editorial Navigation -->
  <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-3 z-40 safe-bottom pointer-events-none">
    <nav class="pointer-events-auto nav-island">
      <div class="flex items-stretch">
        <button v-for="item in navItems" :key="item.id" @click="onNav(item.id)"
          class="flex-1 py-3 flex flex-col items-center gap-1 relative btn-press">

          <!-- Active indicator (top hairline) -->
          <div v-if="currentRoute === item.id" class="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px]" style="background: var(--primary); border-radius: 0 0 2px 2px"></div>

          <!-- Icons -->
          <div class="relative">
            <template v-if="item.icon === 'home'">
              <svg width="20" height="20" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :style="{ color: currentRoute === item.id ? 'var(--primary)' : 'var(--text-tertiary)' }" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'grid'">
              <svg width="20" height="20" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :style="{ color: currentRoute === item.id ? 'var(--primary)' : 'var(--text-tertiary)' }" viewBox="0 0 24 24" stroke-width="1.6">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'heart'">
              <svg width="20" height="20" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :style="{ color: currentRoute === item.id ? 'var(--terracotta)' : 'var(--text-tertiary)' }" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'receipt'">
              <svg width="20" height="20" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :style="{ color: currentRoute === item.id ? 'var(--primary)' : 'var(--text-tertiary)' }" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke-linecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'user'">
              <svg width="20" height="20" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :style="{ color: currentRoute === item.id ? 'var(--primary)' : 'var(--text-tertiary)' }" viewBox="0 0 24 24" stroke-width="1.6">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-linecap="round"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </template>
          </div>

          <span class="nav-label"
            :class="currentRoute === item.id ? 'nav-label-active' : ''">
            {{ t(item.labelKey) }}
          </span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.nav-island {
  background: rgba(250, 247, 241, 0.92);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-radius: 18px;
  border: 1px solid var(--hairline);
  box-shadow:
    0 2px 8px rgba(26, 38, 32, 0.04),
    0 12px 32px rgba(26, 38, 32, 0.10),
    0 -1px 0 rgba(255, 255, 255, 0.6) inset;
}

:root.dark .nav-island, .dark .nav-island {
  background: rgba(20, 30, 24, 0.92);
  border: 1px solid rgba(245, 239, 227, 0.06);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 12px 32px rgba(0, 0, 0, 0.45),
    0 -1px 0 rgba(245, 239, 227, 0.04) inset;
}

.nav-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.nav-label-active {
  color: var(--text-primary);
}

.cart-bar {
  position: fixed;
  z-index: 50;
  bottom: 86px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 448px;
  display: flex;
  align-items: center;
  padding: 12px 16px 12px 12px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 4px;
  box-shadow: var(--shadow-lg);
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.2s ease;
}
.cart-bar:active {
  border-color: var(--terracotta);
}

.cart-bar-icon {
  width: 42px;
  height: 42px;
  border-radius: 2px;
  background: var(--terracotta);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
