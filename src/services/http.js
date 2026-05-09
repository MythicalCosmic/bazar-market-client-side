const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.bazarmarket.org/api'

const TOKEN_KEY = 'bazar-session'
const EXPIRY_KEY = 'bazar-session-expires'
const REQUEST_TIMEOUT = 30000

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

export function getTokenExpiry() {
  const v = localStorage.getItem(EXPIRY_KEY)
  if (!v) return null
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}

export function setTokenExpiry(expiresAt) {
  if (expiresAt) localStorage.setItem(EXPIRY_KEY, expiresAt)
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function dispatchAuthExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bazar:auth-expired'))
  }
}

async function request(method, path, { body, skipAuth, timeout = REQUEST_TIMEOUT } = {}) {
  const url = `${BASE_URL}${path}`
  const headers = { 'Content-Type': 'application/json' }

  if (!skipAuth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), timeout)

  const opts = { method, headers, signal: ctrl.signal }
  if (body !== undefined && method !== 'GET') {
    opts.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, opts)
  } catch (e) {
    clearTimeout(tid)
    if (e.name === 'AbortError') throw new ApiError('Request timed out', 0)
    throw new ApiError('Network error', 0)
  }
  clearTimeout(tid)

  if (res.status === 401) {
    clearToken()
    dispatchAuthExpired()
    throw new ApiError('Session expired', 401)
  }

  // Honour Retry-After on 429
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10) || 0
    let json = null
    try { json = await res.json() } catch {}
    throw new ApiError(json?.message || 'Too many requests', 429, { retryAfter, ...(json || {}) })
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status)
    return null
  }

  if (!res.ok || (json && json.success === false)) {
    const msg = json?.message || `Request failed (${res.status})`
    throw new ApiError(msg, res.status, json)
  }

  if (json && Object.prototype.hasOwnProperty.call(json, 'data')) {
    return json.data
  }
  return json
}

export function get(path, opts) {
  return request('GET', path, opts)
}

export function post(path, body, opts) {
  return request('POST', path, { ...opts, body: body ?? {} })
}

export function patch(path, body, opts) {
  return request('PATCH', path, { ...opts, body: body ?? {} })
}

export function publicGet(path, opts) {
  return request('GET', path, { ...opts, skipAuth: true })
}

export function publicPost(path, body, opts) {
  return request('POST', path, { ...opts, body: body ?? {}, skipAuth: true })
}
