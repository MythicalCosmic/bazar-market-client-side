<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../i18n/index.js'
import { useAddresses } from '../stores/addressStore.js'
import { useRouter } from '../router/index.js'

const { t } = useI18n()
const { addresses } = useAddresses()
const { navigate } = useRouter()

const showDropdown = ref(false)

const currentAddress = computed(() => {
  const def = addresses.value.find(a => a.isDefault)
  return def ? def.address : 'Marhamat shahri'
})

const currentLabel = computed(() => {
  const def = addresses.value.find(a => a.isDefault)
  return def ? def.label : t('header.current_location')
})

function selectAddress(addr) {
  const { setDefault } = useAddresses()
  setDefault(addr.id)
  showDropdown.value = false
}

function goToAddresses() {
  showDropdown.value = false
  navigate('addresses')
}

function openSearch() {
  navigate('search')
}

const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
const issueNo = String(new Date().getDay() + 1).padStart(2, '0')
</script>

<template>
  <header class="px-5 pt-3 pb-3 sticky top-0 z-30 header-glass">
    <!-- Editorial masthead row -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="eyebrow-sm">{{ today }}</span>
        <span class="w-3 h-px" style="background: var(--text-tertiary)"></span>
        <span class="num-label text-[11px]">Vol. {{ issueNo }}</span>
      </div>
      <div class="serif text-[15px]" style="color: var(--text-primary); font-weight: 500;">
        <span class="serif-italic" style="color: var(--terracotta)">{{ t('brand.bazar') }}</span>&nbsp;{{ t('brand.market') }}
      </div>
    </div>

    <!-- Hairline -->
    <div class="hairline mb-3"></div>

    <!-- Location & search -->
    <div class="flex items-center gap-3">
      <!-- Location -->
      <button
        @click="showDropdown = !showDropdown"
        class="flex items-center gap-2 btn-press flex-shrink-0"
        :aria-label="currentLabel"
      >
        <svg width="14" height="14" style="color: var(--terracotta)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <div class="text-left">
          <p class="eyebrow-sm" style="font-size: 8.5px;">{{ currentLabel }}</p>
          <p class="text-[13px] font-medium leading-tight truncate max-w-[120px]" style="color: var(--text-primary)">{{ currentAddress }}</p>
        </div>
        <svg width="10" height="10" :style="{ color: 'var(--text-tertiary)', transform: showDropdown ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>

      <!-- Vertical hairline -->
      <div class="w-px h-7" style="background: var(--hairline)"></div>

      <!-- Search trigger -->
      <button type="button" @click="openSearch" class="search-trigger btn-press flex-1" :aria-label="t('header.search_placeholder')">
        <svg width="16" height="16" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
        </svg>
        <span class="serif-italic text-[13.5px]" style="color: var(--text-tertiary)">{{ t('ed.search_market') }}</span>
      </button>
    </div>

    <!-- Address dropdown -->
    <Transition name="slide-up">
      <div v-if="showDropdown" class="mt-3 overflow-hidden dropdown-card">
        <div v-if="addresses.length">
          <div v-for="(addr, idx) in addresses" :key="addr.id" @click="selectAddress(addr)"
            class="flex items-center gap-3 px-4 py-3.5 btn-press" :class="idx !== 0 ? 'border-t' : ''" :style="{ borderColor: 'var(--hairline)' }">
            <span class="num-label text-[12px] flex-shrink-0">0{{ idx + 1 }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-medium" style="color: var(--text-primary)">{{ addr.label }}</p>
              <p class="text-[11px] truncate" style="color: var(--text-tertiary)">{{ addr.address }}</p>
            </div>
            <svg v-if="addr.isDefault" width="14" height="14" style="color: var(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
        <button @click="goToAddresses" class="w-full flex items-center gap-3 px-4 py-3.5 btn-press" :class="addresses.length ? 'border-t' : ''" :style="{ borderColor: 'var(--hairline)' }">
          <span class="text-[14px] font-light" style="color: var(--primary)">+</span>
          <span class="eyebrow text-[10px]" style="color: var(--primary)">{{ t('addresses.add_new') }}</span>
        </button>
      </div>
    </Transition>
  </header>

  <Teleport to="#app">
    <div v-if="showDropdown" class="fixed inset-0 z-20" @click="showDropdown = false"></div>
  </Teleport>
</template>

<style scoped>
.header-glass {
  background: rgba(250, 247, 241, 0.86);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-bottom: 1px solid var(--hairline);
}
:root.dark .header-glass, .dark .header-glass {
  background: rgba(14, 20, 17, 0.86);
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
}

.dropdown-card {
  background: var(--surface);
  border-radius: 14px;
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow);
}
</style>
