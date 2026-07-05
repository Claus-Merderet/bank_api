// Админ-ручки полигона (D-04, ADMN-01..04). HTTP только через api из client.js
// (граница слоёв фазы 1); ошибки летят parseApiError-объектами из интерцептора —
// никаких try/catch здесь. Форма модуля — как auth.js.

import { api } from './client'

// GET /api/admin/users → [{id, username, role}, ...] — список всех пользователей.
export async function getUsers() {
  const { data } = await api.get('/admin/users')
  return data
}

// POST /api/admin/create → HTTP 200 (не 201!), тело содержит ХЭШ ПАРОЛЯ (Pitfall 8, T-02-13).
// Вызывающий код НЕ должен отображать и логировать тело ответа — в UI допустимы
// только username / role / id.
export async function createUser(body) {
  const { data } = await api.post('/admin/create', body)
  return data
}

// DELETE /api/admin/users/{id} → {message}. Попытка удалить себя → 400
// «Cannot delete your own account» — показывается дословно (философия полигона).
export async function deleteUser(id) {
  const { data } = await api.delete(`/admin/users/${id}`)
  return data
}

// DELETE /api/admin/users → {message, deleted_count} — удаляет всех, кроме текущего админа.
export async function deleteAllUsers() {
  const { data } = await api.delete('/admin/users')
  return data
}
