// Гвард роутов (AUTH-03): без токена → /login; чужая роль → «своя» страница по роли.
// Guard — только UX; реальный enforcement — #[IsGranted] на каждой ручке бэкенда.
// Импорты роутинга — из пакета react-router (v8); legacy-пакет с суффиксом -dom не используется (D-01).

import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ allowedRoles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <Navigate to={user?.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard'} replace />
  return <Outlet />
}
