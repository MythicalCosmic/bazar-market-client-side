import { ref } from 'vue'

// Routes: splash | home | categories | cart | checkout | profile
export const currentRoute = ref('splash')

export function useRouter() {
  function navigate(route) {
    currentRoute.value = route
    window.scrollTo(0, 0)
  }
  return { currentRoute, navigate }
}
