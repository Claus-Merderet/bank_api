// Заглушка админки (наполнение — фаза 2). Показывает текущего пользователя
// и кнопку «Выйти» (AUTH-02).

import { useAuth } from '../auth/AuthContext'

export default function AdminPage() {
  const { user, logout } = useAuth()
  return (
    <div className="p-6 flex flex-col items-start gap-4">
      <h1 className="text-xl font-semibold">Админка</h1>
      <p>
        Вы вошли как {user?.username} ({user?.role})
      </p>
      <button type="button" onClick={logout} className="border rounded px-3 py-1">
        Выйти
      </button>
    </div>
  )
}
