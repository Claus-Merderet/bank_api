// Карта маршрутов фазы 1: /login (public), /dashboard (любой залогиненный),
// /admin (только ROLE_ADMIN), корень и wildcard — редирект по роли (D-07).

import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

// Корневой редиректор: гость → /login, ROLE_ADMIN → /admin, остальные → /dashboard
function RoleRedirect() {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
