import { ref } from 'vue'
import { searchProducts, getProducts } from '../services/api.js'

const HISTORY_KEY = 'bazar-search-history'
const HISTORY_MAX = 8

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter(s => typeof s === 'string' && s.trim()).slice(0, HISTORY_MAX)
  } catch {
    return []
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)))
  } catch {}
}

const history = ref(loadHistory())

function addToHistory(query) {
  const q = String(query || '').trim()
  if (!q) return
  const lower = q.toLowerCase()
  const filtered = history.value.filter(h => h.toLowerCase() !== lower)
  filtered.unshift(q)
  history.value = filtered.slice(0, HISTORY_MAX)
  saveHistory(history.value)
}

function removeFromHistory(query) {
  const lower = String(query || '').toLowerCase()
  history.value = history.value.filter(h => h.toLowerCase() !== lower)
  saveHistory(history.value)
}

function clearHistory() {
  history.value = []
  saveHistory(history.value)
}

// ── Fuzzy matching ──

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[`'‘’ʻʼ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  const al = a.length
  const bl = b.length
  if (!al) return bl
  if (!bl) return al
  if (Math.abs(al - bl) > 5) return Math.abs(al - bl)
  let prev = new Array(bl + 1)
  let curr = new Array(bl + 1)
  for (let j = 0; j <= bl; j++) prev[j] = j
  for (let i = 1; i <= al; i++) {
    curr[0] = i
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    const tmp = prev
    prev = curr
    curr = tmp
  }
  return prev[bl]
}

function scoreName(name, queryFull, queryTokens) {
  if (!name) return 0
  if (name === queryFull) return 1000
  if (name.startsWith(queryFull)) return 400
  if (name.includes(queryFull)) return 250

  const words = name.split(/[\s\-_/]+/).filter(Boolean)
  let score = 0
  for (const qt of queryTokens) {
    if (!qt) continue
    let best = 0
    for (const w of words) {
      if (w === qt) { best = Math.max(best, 60); continue }
      if (w.startsWith(qt)) { best = Math.max(best, 45); continue }
      if (w.includes(qt)) { best = Math.max(best, 30); continue }
      if (qt.length >= 3) {
        const tol = Math.max(1, Math.floor(Math.max(qt.length, w.length) / 4))
        const d = levenshtein(qt, w)
        if (d <= tol) {
          best = Math.max(best, 25 - d * 5)
        }
      }
    }
    score += best
  }
  if (queryTokens.length >= 2) {
    const allCovered = queryTokens.every(qt => name.includes(qt))
    if (allCovered) score += 40
  }
  return score
}

function scoreProduct(product, queryFull, queryTokens) {
  const candidates = [
    product.name?.uz,
    product.name?.ru,
    product.categoryName,
  ].filter(Boolean).map(normalize)
  let best = 0
  for (const c of candidates) {
    const s = scoreName(c, queryFull, queryTokens)
    if (s > best) best = s
  }
  return best
}

function mergeUnique(...lists) {
  const seen = new Set()
  const out = []
  for (const list of lists) {
    for (const item of list) {
      if (!item || seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
    }
  }
  return out
}

async function runSearch(query) {
  const raw = String(query || '').trim()
  if (!raw) return []
  const norm = normalize(raw)
  const tokens = norm.split(' ').filter(Boolean)
  const firstWord = tokens[0] || norm
  const prefix = firstWord.slice(0, Math.min(3, firstWord.length))

  let primary = []
  try {
    primary = await searchProducts(raw)
  } catch {
    primary = []
  }

  let secondary = []
  if (primary.length < 5 && prefix.length >= 2) {
    try {
      const res = await getProducts({ q: prefix, per_page: 30 })
      secondary = res.items || []
    } catch {}
  }

  const merged = mergeUnique(primary, secondary)
  const scored = merged
    .map(p => ({ p, s: scoreProduct(p, norm, tokens) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.p)

  // If everything got filtered (e.g., backend returned exact matches we didn't score),
  // fall back to the primary list so the user still sees something.
  return scored.length ? scored : primary
}

export function useSearchStore() {
  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    runSearch,
  }
}
