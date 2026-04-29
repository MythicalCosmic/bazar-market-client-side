import { ref, computed } from 'vue'
import { get, post, patch, publicPost, getToken, setToken, clearToken } from '../services/http.js'

const user = ref(null)
const token = ref(getToken())

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isVerified = computed(() => !!user.value?.verified)
  const isAuthenticated = computed(() => isLoggedIn.value && isVerified.value)

  async function fetchProfile() {
    try {
      const data = await get('/auth/me')
      user.value = {
        id: data.id,
        uuid: data.uuid,
        firstName: data.first_name,
        lastName: data.last_name || '',
        phone: data.phone,
        verified: data.is_phone_verified,
        language: data.language,
      }
      return user.value
    } catch (e) {
      if (e.status === 401) {
        token.value = null
        user.value = null
        clearToken()
      }
      throw e
    }
  }

  async function login(phone, password, device) {
    try {
      const data = await publicPost('/auth/login', {
        phone: phone.replace(/\s/g, ''),
        password,
        device: device || navigator.userAgent?.slice(0, 50),
      })
      setToken(data.session_key)
      token.value = data.session_key
      user.value = {
        id: data.user.id,
        uuid: data.user.uuid,
        firstName: data.user.first_name,
        lastName: data.user.last_name || '',
        phone: data.user.phone,
        verified: data.user.is_phone_verified,
        language: data.user.language,
      }
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  async function register(firstName, lastName, phone, password) {
    try {
      const data = await publicPost('/auth/register', {
        phone: phone.replace(/\s/g, ''),
        first_name: firstName,
        last_name: lastName,
        password,
        language: ['uz', 'ru'].includes(localStorage.getItem('bazar-locale')) ? localStorage.getItem('bazar-locale') : 'uz',
      })
      setToken(data.session_key)
      token.value = data.session_key
      user.value = {
        id: data.user.id,
        uuid: data.user.uuid,
        firstName: data.user.first_name,
        lastName: data.user.last_name || '',
        phone: data.user.phone,
        verified: data.user.is_phone_verified,
        language: data.user.language,
      }
      return { success: true, verificationSent: data.verification_sent }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  async function verifyCode(code) {
    try {
      await post('/auth/verify', { code })
      if (user.value) user.value.verified = true
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  async function sendCode() {
    try {
      const data = await post('/auth/resend-code')
      return { success: true, expiresIn: data.expires_in }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  async function updateProfile(fields) {
    try {
      const body = {}
      if (fields.firstName !== undefined) body.first_name = fields.firstName
      if (fields.lastName !== undefined) body.last_name = fields.lastName
      if (fields.language !== undefined) body.language = fields.language
      const data = await patch('/auth/me/update', body)
      user.value = {
        ...user.value,
        firstName: data.first_name,
        lastName: data.last_name || '',
        phone: data.phone,
        language: data.language,
      }
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  async function logout() {
    try {
      await post('/auth/logout')
    } catch {}
    token.value = null
    user.value = null
    clearToken()
  }

  function getUser() {
    return user.value
  }

  return {
    user,
    token,
    isLoggedIn,
    isVerified,
    isAuthenticated,
    getUser,
    fetchProfile,
    login,
    register,
    verifyCode,
    sendCode,
    updateProfile,
    logout,
  }
}

export async function initAuth() {
  const t = getToken()
  if (!t) return
  const { fetchProfile } = useAuth()
  try {
    await fetchProfile()
  } catch {
    clearToken()
  }
}
