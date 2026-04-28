import { ref, computed } from 'vue'

const items = ref(JSON.parse(localStorage.getItem('bazar-favorites') || '[]'))

function save() {
  localStorage.setItem('bazar-favorites', JSON.stringify(items.value))
}

export function useFavorites() {
  const favorites = computed(() => items.value)

  function isFavorite(productId) {
    return items.value.includes(productId)
  }

  function toggleFavorite(productId) {
    const idx = items.value.indexOf(productId)
    if (idx !== -1) {
      items.value.splice(idx, 1)
    } else {
      items.value.push(productId)
    }
    save()
  }

  const count = computed(() => items.value.length)

  return { favorites, isFavorite, toggleFavorite, count }
}
