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
</script>

<template>
  <header
    class="px-4 pt-3 pb-3 sticky top-0 z-30"
    style="background: var(--surface); box-shadow: 0 2px 16px var(--shadow)"
  >
    <!-- Location -->
    <div class="flex items-center justify-between mb-3 relative">
      <div class="flex items-center gap-2 cursor-pointer btn-press" @click="showDropdown = !showDropdown">
        <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--primary-light)">
          <svg class="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-semibold leading-none" style="color: var(--text-tertiary)">{{ currentLabel }}</p>
          <div class="flex items-center gap-0.5">
            <p class="text-sm font-black leading-tight truncate" style="color: var(--text-primary)">{{ currentAddress }}</p>
            <svg class="w-3.5 h-3.5 flex-shrink-0 transition-transform" :style="{ color: 'var(--text-secondary)', transform: showDropdown ? 'rotate(180deg)' : '' }" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Address dropdown -->
    <Transition name="slide-up">
      <div v-if="showDropdown" class="mb-3 rounded-2xl overflow-hidden" style="background: var(--surface-secondary); box-shadow: 0 4px 20px var(--shadow-lg)">
        <!-- Saved addresses -->
        <div v-if="addresses.length">
          <div
            v-for="addr in addresses"
            :key="addr.id"
            @click="selectAddress(addr)"
            class="flex items-center gap-3 px-4 py-3 btn-press border-b"
            :style="{ borderColor: 'var(--border)' }"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :style="{ background: addr.isDefault ? 'var(--primary-light)' : 'var(--surface)' }">
              <svg class="w-4 h-4" :class="addr.isDefault ? 'text-primary' : ''" :style="!addr.isDefault ? 'color: var(--text-tertiary)' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/>
                <circle cx="12" cy="10" r="3" stroke-width="2"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black" style="color: var(--text-primary)">{{ addr.label }}</p>
              <p class="text-[10px] font-semibold truncate" style="color: var(--text-tertiary)">{{ addr.address }}</p>
            </div>
            <svg v-if="addr.isDefault" class="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Add new / manage -->
        <button @click="goToAddresses" class="w-full flex items-center gap-3 px-4 py-3 btn-press">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="text-xs font-black text-primary">{{ t('addresses.add_new') }}</span>
        </button>
      </div>
    </Transition>

    <!-- Search -->
    <div class="flex items-center rounded-xl px-3 py-2.5 gap-2" style="background: var(--surface-secondary)">
      <svg class="w-4 h-4 flex-shrink-0" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" stroke-width="2"/>
        <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        :placeholder="t('header.search_placeholder')"
        class="bg-transparent outline-none text-sm font-semibold flex-1"
        style="color: var(--text-primary)"
      />
    </div>
  </header>

  <!-- Backdrop -->
  <Teleport to="#app">
    <div v-if="showDropdown" class="fixed inset-0 z-20" @click="showDropdown = false"></div>
  </Teleport>
</template>
