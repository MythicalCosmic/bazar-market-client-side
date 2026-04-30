import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  function show(message, type = 'error', duration = 3000) {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      const idx = toasts.value.findIndex(t => t.id === id)
      if (idx !== -1) toasts.value.splice(idx, 1)
    }, duration)
  }

  function error(message) { show(message, 'error') }
  function success(message) { show(message, 'success') }
  function info(message) { show(message, 'info') }

  return { toasts, show, error, success, info }
}
