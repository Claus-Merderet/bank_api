// Состояние сессии {token, user} + login/logout + реакция на протухший токен.
// Инициализация state СИНХРОННАЯ из localStorage: useState(() => readSession()).
// НЕ переносить в useEffect — гварды сработают до восстановления сессии,
// и F5 выбросит залогиненного на /login (Pitfall 4, критерий фазы D-05).
// Сравнение ролей — строгое === со строками 'ROLE_ADMIN' / 'ROLE_USER' /
// 'ROLE_CREDIT_SECRET'; иерархию ролей знает только бэкенд.

import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { saveSession, readSession, clearSession } from './tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())
  const navigate = useNavigate()
  // AuthProvider внутри QueryClientProvider (main.jsx) — кэш react-query чистится
  // в каждой точке выхода: данные, полученные под одним токеном, не должны
  // отрисовываться следующей сессии (авторизационная граница)
  const queryClient = useQueryClient()

  // Карта редиректов по ролям (locked decision D-07): ROLE_ADMIN → /admin, остальные → /dashboard
  const login = (token, user) => {
    saveSession(token, user)
    setSession({ token, user })
    navigate(user.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard')
  }

  // AUTH-02: выход чистит сессию (token + user атомарно), кэш запросов и ведёт на /login
  const logout = () => {
    clearSession()
    queryClient.removeQueries()
    setSession({ token: null, user: null })
    navigate('/login')
  }

  // D-11: «истечь токен» — честный клиентский сброс ОДНИМ navigate (единственная
  // запись /login в history, «Назад» не застревает на логине без state);
  // username уходит в state — LoginPage предзаполнит поле, пароль всегда пуст
  const expireSession = () => {
    const username = session.user?.username
    clearSession()
    queryClient.removeQueries()
    setSession({ token: null, user: null })
    navigate('/login', { state: { sessionExpired: true, username } })
  }

  useEffect(() => {
    // Интерцептор client.js диспатчит auth:expired на lexik-401 (протухший/невалидный JWT)
    // и сам чистит localStorage — здесь сбрасываем state и уводим на /login (D-06)
    // с sessionExpired-алертом; username берётся из актуальной сессии через зависимость
    // эффекта (без stale closure), LoginPage предзаполнит им поле логина (D-11)
    const username = session.user?.username
    const onExpired = () => {
      queryClient.removeQueries()
      setSession({ token: null, user: null })
      navigate('/login', { state: { sessionExpired: true, username } })
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [navigate, session.user, queryClient])

  return (
    <AuthContext.Provider value={{ token: session.token, user: session.user, login, logout, expireSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
