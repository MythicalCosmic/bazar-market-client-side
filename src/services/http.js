const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.bazarmarket.org/api'

const TOKEN_KEY = 'bazar-session'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(method, path, { body, skipAuth } = {}) {
  const url = `${BASE_URL}${path}`
  const headers = { 'Content-Type': 'application/json' }

  if (!skipAuth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const opts = { method, headers }
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, opts)
  } catch (e) {
    throw new ApiError('Network error', 0)
  }

  if (res.status === 401) {
    clearToken()
    throw new ApiError('Session expired', 401)
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new ApiError('Invalid response', res.status)
  }

  if (!json.success) {
    throw new ApiError(json.message || 'Request failed', res.status)
  }

  return json.data
}

export function get(path) {
  return request('GET', path)
}

export function post(path, body) {
  return request('POST', path, { body })
}

export function patch(path, body) {
  return request('PATCH', path, { body })
}

export function publicGet(path) {
  return request('GET', path, { skipAuth: true })
}

export function publicPost(path, body) {
  return request('POST', path, { body, skipAuth: true })
}
