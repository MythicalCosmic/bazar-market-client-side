import { ref } from 'vue'
import { useAuth } from '../stores/authStore.js'

export const currentRoute = ref('splash')
export const routeParams = ref({})

const routeOrder = [
  'splash', 'home', 'search', 'categories', 'favorites', 'cart', 'checkout', 'orders',
  'profile', 'settings', 'support', 'payment-methods', 'login', 'register',
  'addresses', 'coupons', 'rewards', 'product',
]

// Routes that require an active session. The router auth-gates them; views
// can rely on the user being logged in when they mount.
const protectedRoutes = new Set([
  'checkout', 'orders', 'profile', 'addresses', 'favorites',
  'settings', 'payment-methods', 'coupons', 'rewards',
])

const history = []
const HISTORY_MAX = 30
export const transitionName = ref('fade')

export function useRouter() {
  function navigate(route, params = {}, opts = {}) {
    if (!opts._isBack && protectedRoutes.has(route)) {
      const { isLoggedIn } = useAuth()
      if (!isLoggedIn.value) {
        // Remember where the user wanted to go so we can resume after login.
        const intended = { ...params, _intendedRoute: route }
        currentRoute.value = 'login'
        routeParams.value = intended
        transitionName.value = 'fade'
        return
      }
    }

    const fromIdx = routeOrder.indexOf(currentRoute.value)
    const toIdx = routeOrder.indexOf(route)
    if (route === 'home' && currentRoute.value === 'splash') transitionName.value = 'fade'
    else if (toIdx > fromIdx) transitionName.value = 'slide-left'
    else if (toIdx < fromIdx) transitionName.value = 'slide-right'
    else transitionName.value = 'fade'

    if (!opts._isBack) {
      history.push({ route: currentRoute.value, params: routeParams.value })
      if (history.length > HISTORY_MAX) history.shift()
    }
    currentRoute.value = route
    routeParams.value = params
    window.scrollTo(0, 0)
  }

  function goBack() {
    const prev = history.pop()
    if (prev) navigate(prev.route, prev.params || {}, { _isBack: true })
    else navigate('home', {}, { _isBack: true })
  }

  return { currentRoute, routeParams, transitionName, navigate, goBack }
}
