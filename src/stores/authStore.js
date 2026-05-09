import { ref, computed } from 'vue'
import {
  get, post, patch, publicPost,
  getToken, setToken, clearToken,
  getTokenExpiry, setTokenExpiry,
} from '../services/http.js'

const user = ref(null)
const token = ref(getToken())

// Cross-store reset hooks. Other stores subscribe via onLogout(...) so the
// auth layer doesn't need to know about them directly (avoids import cycles).
const logoutListeners = new Set()
export function onLogout(fn) {
  logoutListeners.add(fn)
  return () => logoutListeners.delete(fn)
}
function fireLogout() {
  for (const fn of logoutListeners) {
    try { fn() } catch {}
  }
}

function normalizePhone(phone) {
  return (phone || '').replace(/\s/g, '')
}

function defaultDevice() {
  return navigator.userAgent?.slice(0, 50) || 'web'
}

function setUserFromData(data) {
  if (!data) { user.value = null; return }
  user.value = {
    id: data.id,
    uuid: data.uuid,
    firstName: data.first_name,
    lastName: data.last_name || '',
    phone: data.phone,
    verified: data.is_phone_verified,
    language: data.language,
  }
}

function applySession(data) {
  if (data?.session_key) {
    setToken(data.session_key)
    token.value = data.session_key
  }
  if (data?.expires_at) setTokenExpiry(data.expires_at)
  if (data?.user) setUserFromData(data.user)
}

function doLogoutLocal() {
  token.value = null
  user.value = null
  clearToken()
  fireLogout()
}

async function applyPendingReferral() {
  const code = localStorage.getItem('bazar-pending-referral')
  if (!code) return
  try {
    await post('/referral/apply', { code })
    localStorage.removeItem('bazar-pending-referral')
  } catch (e) {
    // Drop on 4xx (invalid/already-applied), keep on 5xx/network so we can retry.
    if (e.status >= 400 && e.status < 500) {
      localStorage.removeItem('bazar-pending-referral')
    }
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isVerified = computed(() => !!user.value?.verified)
  const isAuthenticated = computed(() => isLoggedIn.value && isVerified.value)

  async function fetchProfile() {
    const data = await get('/auth/me')
    setUserFromData(data)
    return user.value
  }

  // ── Login (phone → OTP) ──
  async function requestLoginCode(phone) {
    try {
      const data = await publicPost('/auth/login', { phone: normalizePhone(phone) })
      return { success: true, expiresIn: data?.expires_in || 120 }
    } catch (e) {
      return { success: false, message: e.message, status: e.status, retryAfter: e.data?.retryAfter }
    }
  }

  async function verifyLogin(phone, code, device) {
    try {
      const data = await publicPost('/auth/login/verify', {
        phone: normalizePhone(phone),
        code,
        device: device || defaultDevice(),
      })
      applySession(data)
      applyPendingReferral()
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message, status: e.status }
    }
  }

  async function resendLoginCode(phone) {
    try {
      const data = await publicPost('/auth/login/resend', { phone: normalizePhone(phone) })
      return { success: true, expiresIn: data?.expires_in || 60 }
    } catch (e) {
      return { success: false, message: e.message, status: e.status, retryAfter: e.data?.retryAfter }
    }
  }

  // ── Register (phone + name → OTP) ──
  async function register(firstName, lastName, phone, language) {
    try {
      const stored = localStorage.getItem('bazar-locale')
      const lang = language || (['uz', 'ru'].includes(stored) ? stored : 'uz')
      const body = {
        phone: normalizePhone(phone),
        first_name: firstName,
        language: lang,
      }
      if (lastName) body.last_name = lastName
      const data = await publicPost('/auth/register', body)
      return { success: true, phone: data?.phone, expiresIn: data?.expires_in || 120 }
    } catch (e) {
      return { success: false, message: e.message, status: e.status }
    }
  }

  async function verifyRegistration(phone, code, device) {
    try {
      const data = await publicPost('/auth/register/verify', {
        phone: normalizePhone(phone),
        code,
        device: device || defaultDevice(),
      })
      applySession(data)
      applyPendingReferral()
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message, status: e.status }
    }
  }

  async function resendRegistrationCode(phone) {
    try {
      const data = await publicPost('/auth/register/resend', { phone: normalizePhone(phone) })
      return { success: true, expiresIn: data?.expires_in || 60 }
    } catch (e) {
      return { success: false, message: e.message, status: e.status, retryAfter: e.data?.retryAfter }
    }
  }

  // ── Profile (name + language) ──
  async function updateProfile(fields) {
    try {
      const body = {}
      if (fields.firstName !== undefined) body.first_name = fields.firstName
      if (fields.lastName !== undefined) body.last_name = fields.lastName
      if (fields.language !== undefined) body.language = fields.language
      const data = await patch('/auth/me/update', body)
      setUserFromData(data)
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  // ── Change phone (separate flow) ──
  async function requestPhoneChange(newPhone) {
    try {
      const data = await post('/auth/me/phone', { new_phone: normalizePhone(newPhone) })
      return { success: true, expiresIn: data?.expires_in || 120 }
    } catch (e) {
      return { success: false, message: e.message, status: e.status }
    }
  }

  async function verifyPhoneChange(code) {
    try {
      await post('/auth/me/phone/verify', { code })
      // Server invalidates *all* sessions including this one.
      doLogoutLocal()
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message, status: e.status }
    }
  }

  // ── Logout / delete ──
  async function logout() {
    try { await post('/auth/logout') } catch {}
    doLogoutLocal()
  }

  async function logoutAll() {
    try { await post('/auth/logout-all') } catch {}
    doLogoutLocal()
  }

  async function deleteAccount() {
    try {
      await post('/auth/me/delete')
    } catch (e) {
      return { success: false, message: e.message }
    }
    doLogoutLocal()
    return { success: true }
  }

  return {
    user, token,
    isLoggedIn, isVerified, isAuthenticated,
    fetchProfile,
    requestLoginCode, verifyLogin, resendLoginCode,
    register, verifyRegistration, resendRegistrationCode,
    updateProfile,
    requestPhoneChange, verifyPhoneChange,
    logout, logoutAll, deleteAccount,
  }
}

export async function initAuth() {
  if (!getToken()) return
  const exp = getTokenExpiry()
  if (exp && Date.now() > exp) {
    clearToken()
    return
  }
  const { fetchProfile } = useAuth()
  try {
    await fetchProfile()
  } catch (e) {
    // 401 already cleared the token via http.js. Other errors leave the
    // token in place — the next authenticated request will retry.
  }
}

// Reset local refs when http.js signals an expired session.
if (typeof window !== 'undefined') {
  window.addEventListener('bazar:auth-expired', () => {
    token.value = null
    user.value = null
    fireLogout()
  })
}
