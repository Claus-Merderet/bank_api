// Единая точка HTTP всего фронтенда. Страницы НИКОГДА не ходят в HTTP напрямую.
// В src/ только относительные пути — адрес бэкенда живёт в vite.config.js (proxy).
// busy-счётчик (D-03): инкремент на каждый запрос, декремент при ЛЮБОМ исходе ответа —
// полигон живёт ошибками, незакрытый busy повесил бы прогресс-бар навсегда.

import axios from 'axios'
import { getToken, clearSession } from '../auth/tokenStorage'
import { parseApiError } from './parseApiError'
import { busy } from './busy'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  busy.increment()
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    busy.decrement()
    return res
  },
  (err) => {
    busy.decrement()
    const { status, data } = err.response ?? {}
    // Разлогинивать ТОЛЬКО на lexik-401 (протухший/невалидный/отсутствующий JWT):
    // {"code":401,"message":"Expired JWT Token"|"Invalid JWT Token"|"JWT Token not found"}.
    // Три вида 401 с полем error НЕ разлогинивают (D-06):
    //   {"error":"Invalid credentials"}              — живой пользователь: неверный пароль на логине
    //   {"error":"Forbidden: Admin access required"} — живой пользователь: quirk, не-админ на /api/admin/*
    //   {"error":"Unauthorized"}                     — запрос к админ-ручке БЕЗ токена (не «живой
    //     пользователь»; no-op: ошибку показывает UI, гварды без токена сюда не пускают)
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
