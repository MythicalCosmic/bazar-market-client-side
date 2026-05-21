<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  options: { type: Array, required: true },
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const underlineStyle = ref({})

function updateUnderline() {
  nextTick(() => {
    const container = containerRef.value
    if (!container) return
    const idx = props.options.findIndex((o) => o.value === props.modelValue)
    const btn = container.children[idx]
    if (!btn) return
    underlineStyle.value = {
      width: `${btn.offsetWidth}px`,
      transform: `translateX(${btn.offsetLeft}px)`,
    }
  })
}

onMounted(updateUnderline)
watch(() => props.modelValue, updateUnderline)
</script>

<template>
  <div class="relative">
    <div
      ref="containerRef"
      class="relative flex gap-1 pb-2 segmented-container"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        @click="emit('update:modelValue', opt.value)"
        class="relative z-10 flex-1 py-2 px-3 transition-colors duration-200 btn-press segmented-btn"
        :class="modelValue === opt.value ? 'segmented-btn-active' : ''"
      >
        {{ opt.label }}
      </button>

      <!-- Underline -->
      <div
        class="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
        style="background: var(--text-primary);"
        :style="underlineStyle"
      ></div>
    </div>
    <div class="hairline"></div>
  </div>
</template>

<style scoped>
.segmented-btn {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  background: transparent;
}
.segmented-btn-active {
  color: var(--text-primary);
}
</style>
