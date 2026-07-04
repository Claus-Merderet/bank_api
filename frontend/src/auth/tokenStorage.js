// Хранение сессии (JWT + user) в localStorage. Переживает F5 (locked decision D-05).
// Refresh-ручки на бэкенде нет — никакого refresh-кода, logout-on-expiry.
// token и user всегда пишутся/читаются/чистятся ПАРОЙ (атомарно).

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function readSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  const rawUser = localStorage.getItem(USER_KEY)
  if (!token || !rawUser) {
    return { token: null, user: null }
  }
  try {
    return { token, user: JSON.parse(rawUser) }
  } catch {
    // Битый JSON в auth_user — трактуем как отсутствие сессии и чистим пару
    clearSession()
    return { token: null, user: null }
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
