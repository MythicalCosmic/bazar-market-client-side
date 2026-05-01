<script setup>
import { ref, watch } from 'vue'
import { fetchImage } from '../services/api.js'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
})

const resolved = ref(null)

async function resolve(url) {
  if (!url) { resolved.value = null; return }
  resolved.value = await fetchImage(url)
}

watch(() => props.src, (val) => resolve(val), { immediate: true })
</script>

<template>
  <img v-if="resolved" :src="resolved" :alt="alt" v-bind="$attrs" />
</template>
