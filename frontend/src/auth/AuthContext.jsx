// Состояние сессии {token, user} + login/logout + реакция на протухший токен.
// Инициализация state СИНХРОННАЯ из localStorage: useState(() => readSession()).
// НЕ переносить в useEffect — гварды сработают до восстановления сессии,
// и F5 выбросит залогиненного на /login (Pitfall 4, критерий фазы D-05).
// Сравнение ролей — строгое === со строками 'ROLE_ADMIN' / 'ROLE_USER' /
// 'ROLE_CREDIT_SECRET'; иерархию ролей знает только бэкенд.

import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { saveSession, readSession, clearSession } from './tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())
  const navigate = useNavigate()

  // Карта редиректов по ролям (locked decision D-07): ROLE_ADMIN → /admin, остальные → /dashboard
  const login = (token, user) => {
    saveSession(token, user)
    setSession({ token, user })
    navigate(user.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard')
  }

  // AUTH-02: выход чистит сессию (token + user атомарно) и ведёт на /login
  const logout = () => {
    clearSession()
    setSession({ token: null, user: null })
    navigate('/login')
  }

  useEffect(() => {
    // Интерцептор client.js диспатчит auth:expired на lexik-401 (протухший/невалидный JWT)
    // и сам чистит localStorage — здесь сбрасываем state и уводим на /login (D-06)
    const onExpired = () => {
      setSession({ token: null, user: null })
      navigate('/login')
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [navigate])

  return (
    <AuthContext.Provider value={{ token: session.token, user: session.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
