<script setup>
import { useCartStore } from '../stores/cartStore.js'
import { currentRoute, useRouter } from '../router/index.js'
import { useI18n } from '../i18n/index.js'
import { useTelegram } from '../composables/useTelegram.js'

const { totalCount } = useCartStore()
const { navigate } = useRouter()
const { t } = useI18n()
const { haptic } = useTelegram()

const navItems = [
  { id: 'home',       labelKey: 'nav.home',       icon: 'home'  },
  { id: 'categories', labelKey: 'nav.categories', icon: 'grid'  },
  { id: 'favorites',  labelKey: 'nav.favorites',  icon: 'heart' },
  { id: 'orders',     labelKey: 'nav.orders',     icon: 'receipt' },
  { id: 'profile',    labelKey: 'nav.profile',    icon: 'user'  },
]

function onNav(id) { haptic('selection'); navigate(id) }
</script>

<template>
  <!-- Floating Island Navigation -->
  <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-3 z-40 safe-bottom pointer-events-none">
    <nav class="pointer-events-auto nav-island">
      <div class="flex items-stretch">
        <button v-for="item in navItems" :key="item.id" @click="onNav(item.id)"
          class="flex-1 py-2.5 flex flex-col items-center gap-1 relative btn-press">

          <!-- Icons -->
          <div class="relative">
            <!-- Active glow -->
            <div v-if="currentRoute === item.id" class="absolute inset-0 rounded-full" style="background: var(--primary); opacity: 0.12; filter: blur(8px); transform: scale(2);"></div>

            <template v-if="item.icon === 'home'">
              <svg width="22" height="22" :fill="currentRoute === item.id ? 'currentColor' : 'none'" :stroke="currentRoute === item.id ? 'none' : 'currentColor'"
                :class="currentRoute === item.id ? 'text-primary' : ''" :style="currentRoute !== item.id ? 'color: var(--text-tertiary)' : ''" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" :stroke-width="currentRoute === item.id ? 0 : 1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'grid'">
              <svg width="22" height="22" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :class="currentRoute === item.id ? 'text-primary' : ''" :style="currentRoute !== item.id ? 'color: var(--text-tertiary)' : ''" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="2" :stroke-width="currentRoute === item.id ? 0 : 1.8"/>
                <rect x="14" y="3" width="7" height="7" rx="2" :stroke-width="currentRoute === item.id ? 0 : 1.8"/>
                <rect x="3" y="14" width="7" height="7" rx="2" :stroke-width="currentRoute === item.id ? 0 : 1.8"/>
                <rect x="14" y="14" width="7" height="7" rx="2" :stroke-width="currentRoute === item.id ? 0 : 1.8"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'heart'">
              <svg width="22" height="22" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :class="currentRoute === item.id ? 'text-primary' : ''" :style="currentRoute !== item.id ? 'color: var(--text-tertiary)' : ''" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" :stroke-width="currentRoute === item.id ? 0 : 1.8"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'receipt'">
              <svg width="22" height="22" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :class="currentRoute === item.id ? 'text-primary' : ''" :style="currentRoute !== item.id ? 'color: var(--text-tertiary)' : ''" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" :stroke-width="currentRoute === item.id ? 0 : 1.8" stroke-linecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" :stroke-width="currentRoute === item.id ? 0 : 1.8"/>
              </svg>
            </template>
            <template v-else-if="item.icon === 'user'">
              <svg width="22" height="22" :fill="currentRoute === item.id ? 'currentColor' : 'none'" stroke="currentColor"
                :class="currentRoute === item.id ? 'text-primary' : ''" :style="currentRoute !== item.id ? 'color: var(--text-tertiary)' : ''" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" :stroke-width="currentRoute === item.id ? 0 : 1.8" stroke-linecap="round"/>
                <circle cx="12" cy="7" r="4" :stroke-width="currentRoute === item.id ? 0 : 1.8"/>
              </svg>
            </template>
          </div>

          <span class="text-[10px] transition-all duration-200"
            :class="currentRoute === item.id ? 'text-primary font-semibold' : 'font-medium'"
            :style="currentRoute !== item.id ? 'color: var(--text-tertiary)' : ''">
            {{ t(item.labelKey) }}
          </span>
        </button>
      </div>
    </nav>
  </div>

  <!-- Cart FAB -->
  <Teleport to="#app">
    <button v-if="totalCount > 0 && !['cart','checkout'].includes(currentRoute)"
      @click="navigate('cart')"
      class="fixed z-50 btn-press pop cart-fab"
      style="bottom: 80px; right: 20px;">
      <svg width="20" height="20" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="cart-fab-badge">{{ totalCount }}</span>
    </button>
  </Teleport>
</template>

<style scoped>
.nav-island {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.03),
    0 8px 24px rgba(140, 120, 90, 0.08),
    0 -1px 0 rgba(255, 255, 255, 0.8) inset;
}

:root.dark .nav-island, .dark .nav-island {
  background: rgba(28, 25, 23, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 -1px 0 rgba(255, 255, 255, 0.04) inset;
}

.cart-fab {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #059669, #047857);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.35), 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cart-fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--bg-app);
}
</style>
