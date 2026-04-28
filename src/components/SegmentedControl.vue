<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  options: { type: Array, required: true },
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const pillStyle = ref({})

function updatePill() {
  nextTick(() => {
    const container = containerRef.value
    if (!container) return
    const idx = props.options.findIndex((o) => o.value === props.modelValue)
    const btn = container.children[idx + 1]
    if (!btn) return
    pillStyle.value = {
      width: `${btn.offsetWidth}px`,
      transform: `translateX(${btn.offsetLeft}px)`,
    }
  })
}

onMounted(updatePill)
watch(() => props.modelValue, updatePill)
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex rounded-xl p-1 gap-0.5"
    style="background: var(--surface-secondary)"
  >
    <!-- Sliding pill -->
    <div
      class="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out"
      style="background: var(--surface); box-shadow: 0 1px 4px var(--shadow)"
      :style="pillStyle"
    ></div>

    <!-- Buttons -->
    <button
      v-for="opt in options"
      :key="opt.value"
      @click="emit('update:modelValue', opt.value)"
      class="relative z-10 flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors duration-200 btn-press"
      :style="{ color: modelValue === opt.value ? 'var(--text-primary)' : 'var(--text-tertiary)' }"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
