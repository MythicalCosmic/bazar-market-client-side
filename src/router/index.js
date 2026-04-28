import { ref } from 'vue'

export const currentRoute = ref('splash')
export const routeParams = ref({})

const routeOrder = ['splash', 'home', 'categories', 'favorites', 'cart', 'checkout', 'orders', 'profile', 'settings', 'support', 'payment-methods', 'register', 'addresses', 'coupons']

let previousRoute = 'splash'
export const transitionName = ref('fade')

export function useRouter() {
  function navigate(route, params = {}) {
    const fromIdx = routeOrder.indexOf(currentRoute.value)
    const toIdx = routeOrder.indexOf(route)

    if (route === 'home' && currentRoute.value === 'splash') {
      transitionName.value = 'fade'
    } else if (toIdx > fromIdx) {
      transitionName.value = 'slide-left'
    } else if (toIdx < fromIdx) {
      transitionName.value = 'slide-right'
    } else {
      transitionName.value = 'fade'
    }

    previousRoute = currentRoute.value
    currentRoute.value = route
    routeParams.value = params
    window.scrollTo(0, 0)
  }

  function goBack() {
    navigate(previousRoute || 'home')
  }

  return { currentRoute, routeParams, transitionName, navigate, goBack }
}
