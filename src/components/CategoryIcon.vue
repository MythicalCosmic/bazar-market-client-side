<script setup>
defineProps({
  icon: { type: String, required: true },
  size: { type: String, default: '20' },
})
</script>

<template>
  <!-- Sparkles / New -->
  <svg v-if="icon === 'sparkles'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1z"/>
  </svg>

  <!-- Flame / Hot -->
  <svg v-else-if="icon === 'flame'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3.5-7.5C14 5 16.5 8 16.5 10.5c0 4.14-3.36 7.5-7.5 7.5A4.5 4.5 0 0 1 4.5 14c0-1 .5-2 1-3"/>
  </svg>

  <!-- Dairy / Milk -->
  <svg v-else-if="icon === 'dairy'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 2h8l2 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6l2-4z"/>
    <path d="M6 6h12"/>
    <path d="M9 12a3 3 0 0 0 6 0"/>
  </svg>

  <!-- Bread -->
  <svg v-else-if="icon === 'bread'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 8c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4 1.1 0 2 .9 2 2s-.9 2-2 2H5c-1.1 0-2-.9-2-2s.9-2 2-2z"/>
    <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>
  </svg>

  <!-- Candy / Sweets -->
  <svg v-else-if="icon === 'candy'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <path d="M7.5 7.5L4 4M16.5 7.5L20 4M7.5 16.5L4 20M16.5 16.5L20 20"/>
    <path d="M9 12h6"/>
  </svg>

  <!-- Apple / Fruits -->
  <svg v-else-if="icon === 'apple'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3c1-1 3-1.5 4 0"/>
    <path d="M17 8c2.5 2 3 5 2 8s-3 5-5 5c-1 0-1.5-.5-2-.5s-1 .5-2 .5c-2 0-4-2-5-5s-.5-6 2-8c1.5-1.2 3.5-1 4.5 0 1-1 3-1.2 4.5 0z"/>
  </svg>

  <!-- Cup / Drinks -->
  <svg v-else-if="icon === 'cup'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 3h14l-1.5 15a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 3z"/>
    <path d="M8 3v2M12 3v2M16 3v2"/>
    <path d="M7 10h10"/>
  </svg>

  <!-- Snack -->
  <svg v-else-if="icon === 'snack'" :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="5" width="16" height="14" rx="3"/>
    <path d="M4 9h16"/>
    <path d="M9 9v10M15 9v10"/>
  </svg>

  <!-- Fallback -->
  <svg v-else :width="size" :height="size" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
  </svg>
</template>
