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
  <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 safe-bottom nav-glass">
    <div class="flex items-stretch">
      <button v-for="item in navItems" :key="item.id" @click="onNav(item.id)"
        class="flex-1 py-2 flex flex-col items-center gap-0.5 relative btn-press transition-all duration-200">

        <!-- Active indicator dot -->
        <div v-if="currentRoute === item.id" class="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"></div>

        <!-- Icons -->
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

        <span class="text-[9px] font-bold transition-colors" :class="currentRoute === item.id ? 'text-primary' : ''" :style="currentRoute !== item.id ? 'color: var(--text-tertiary)' : ''">
          {{ t(item.labelKey) }}
        </span>
      </button>
    </div>
  </nav>

  <!-- Cart FAB -->
  <Teleport to="#app">
    <button v-if="totalCount > 0 && !['cart','checkout'].includes(currentRoute)"
      @click="navigate('cart')"
      class="fixed bottom-20 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center z-50 btn-press pop"
      style="box-shadow: 0 4px 20px var(--primary-glow);">
      <svg width="22" height="22" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">{{ totalCount }}</span>
    </button>
  </Teleport>
</template>

<style scoped>
.nav-glass {
  background: rgba(var(--nav-bg), 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  --nav-bg: 255, 255, 255;
}
:root.dark .nav-glass, .dark .nav-glass { --nav-bg: 15, 15, 15; }
</style>
