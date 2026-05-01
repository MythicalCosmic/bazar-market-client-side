<script setup>
defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
})
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" v-bind="$attrs" />
</template>
