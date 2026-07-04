// Единая точка HTTP всего фронтенда. Страницы НИКОГДА не ходят в HTTP напрямую.
// В src/ только относительные пути — адрес бэкенда живёт в vite.config.js (proxy).

import axios from 'axios'
import { getToken, clearSession } from '../auth/tokenStorage'
import { parseApiError } from './parseApiError'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const { status, data } = err.response ?? {}
    // Разлогинивать ТОЛЬКО на lexik-401 (протухший/невалидный/отсутствующий JWT):
    // {"code":401,"message":"Expired JWT Token"|"Invalid JWT Token"|"JWT Token not found"}.
    // Три вида 401 с полем error НЕ разлогинивают — это живые пользователи (D-06):
    //   {"error":"Invalid credentials"}              — неверный пароль на логине
    //   {"error":"Forbidden: Admin access required"} — quirk: не-админ на /api/admin/*
    //   {"error":"Unauthorized"}                     — админ-ручки без токена
    const isLexikJwtError =
      status === 401 &&
      (data?.code === 401 || /JWT Token|Expired/i.test(data?.message ?? '')) &&
      !data?.error
    if (isLexikJwtError) {
      clearSession()
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(parseApiError(err))
  }
)
