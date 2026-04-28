import { ref, computed } from 'vue'

const user = ref(JSON.parse(localStorage.getItem('bazar-user') || 'null'))

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value?.verified)

  function setUser(data) {
    user.value = data
    localStorage.setItem('bazar-user', JSON.stringify(data))
  }

  function getUser() {
    return user.value
  }

  function updateProfile(firstName, lastName) {
    if (user.value) {
      user.value.firstName = firstName
      user.value.lastName = lastName
      localStorage.setItem('bazar-user', JSON.stringify(user.value))
    }
  }

  async function sendCode(phone) {
    // Fake API: in production, backend sends SMS
    await new Promise((r) => setTimeout(r, 500))
    return { success: true }
  }

  async function verifyCode(phone, code) {
    // Fake API: accept any 6-digit code
    await new Promise((r) => setTimeout(r, 500))
    if (code.length === 6) {
      return { success: true }
    }
    return { success: false, error: 'Invalid code' }
  }

  function register(firstName, lastName, phone) {
    const data = { firstName, lastName, phone, verified: true }
    setUser(data)
    return data
  }

  function logout() {
    user.value = null
    localStorage.removeItem('bazar-user')
  }

  return {
    user,
    isAuthenticated,
    getUser,
    setUser,
    updateProfile,
    sendCode,
    verifyCode,
    register,
    logout,
  }
}
