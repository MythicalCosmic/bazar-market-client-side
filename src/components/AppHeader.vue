<script setup>
// src/components/AppHeader.vue
</script>

<template>
  <header
    class="bg-white px-4 pt-3 pb-3 sticky top-0 z-30"
    style="box-shadow: 0 2px 16px rgba(0,0,0,0.06)"
  >
    <!-- Location -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 cursor-pointer">
        <div class="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
          <svg class="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div>
          <p class="text-[10px] text-gray-400 font-semibold leading-none">Выбрано сейчас</p>
          <div class="flex items-center gap-0.5">
            <p class="text-sm font-black text-gray-800 leading-tight">Мустакиллик кчаси 52 уй</p>
            <svg class="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center bg-gray-100 rounded-xl px-3 py-2.5 gap-2">
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" stroke-width="2"/>
        <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        placeholder="Ищи что сув ун и тд"
        class="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 flex-1 font-semibold"
      />
    </div>
  </header>
</template>
