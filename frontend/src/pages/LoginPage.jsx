// Форма входа (AUTH-01, AUTH-04, CORE-04). Основа — Pattern 4 из 01-RESEARCH.
// Кнопка дизейблится на formState.isSubmitting — двойной сабмит исключён.
// Ошибки: 401 c raw.error === 'Invalid credentials' → «Неверный логин или пароль»;
// все остальные — message из parseApiError ДОСЛОВНО (тексты бэкенда не переписываем —
// полигон для тестировщиков). Рендер только текстом в JSX (React экранирует сам).
// Стилизация — функциональный минимум; финальная вёрстка по макетам — фаза 2 (D-08).

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { login } from '../api/auth'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()
  const [serverError, setServerError] = useState(null)
  const auth = useAuth()

  const onSubmit = async ({ username, password }) => {
    setServerError(null)
    try {
      const data = await login(username, password)
      auth.login(data.token, data.user) // сохранит сессию и уведёт по роли
    } catch (e) {
      // e — результат parseApiError: {status, message, raw}
      if (e.status === 401 && e.raw?.error === 'Invalid credentials') {
        setServerError('Неверный логин или пароль')
      } else {
        setServerError(e.message)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-72">
        <h1 className="text-xl font-semibold text-center">Вход</h1>
        <label className="flex flex-col gap-1">
          <span>Логин</span>
          <input type="text" className="border rounded px-2 py-1" {...register('username')} />
        </label>
        <label className="flex flex-col gap-1">
          <span>Пароль</span>
          <input type="password" className="border rounded px-2 py-1" {...register('password')} />
        </label>
        {serverError && <p className="text-red-600 whitespace-pre-line">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="border rounded px-3 py-1 disabled:opacity-50"
        >
          Войти
        </button>
      </form>
    </div>
  )
}
