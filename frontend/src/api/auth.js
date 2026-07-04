import { api } from './client'

// POST /api/auth/token/login → {token, user: {username, role}}.
// role приходит ОДНОЙ строкой в ответе — декодировать JWT на клиенте не нужно.
export async function login(username, password) {
  const { data } = await api.post('/auth/token/login', { username, password })
  return data
}
