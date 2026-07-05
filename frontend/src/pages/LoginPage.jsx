// Экран входа SCAM BANK — вёрстка 1:1 по макету (SCAM Bank.dc.html:63–130) ПОВЕРХ
// логики фазы 1 (D-09): auth.login(), isSubmitting и ветка 401 Invalid credentials →
// «Неверный логин или пароль» сохранены; остальные ошибки бэкенда — дословно через
// ErrorBlock. react-hook-form живёт ТОЛЬКО здесь (D-12); мягкая валидация — пустые
// поля уходят на бэкенд по-настоящему. sessionExpired приходит через router state
// (Pattern 7): жёлтый алерт, username предзаполнен, пароль пуст, F5 сбрасывает флаг.
// Демо-чипы ТОЛЬКО автозаполняют поля (setValue) — форму не отправляют (§4.2
// DESIGN-INTAKE): несуществующий юзер при реальной отправке получит живой 401.
// Рендер ошибок — только текстом в JSX (React экранирует сам, T-01-07).

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router'
import { login } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { useBusy } from '../hooks/useBusy'
import { useToast } from '../components/ui/ToastProvider'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Checkbox } from '../components/ui/Checkbox'
import { ErrorBlock } from '../components/ui/ErrorBlock'
import { Card } from '../components/ui/Card'

// Демо-доступы полигона (макет :118–123, :896–898): только автозаполнение полей
const demoChips = [
  {
    u: 'admin',
    p: '123456',
    label: 'admin · 123456',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,.07)',
    bgHover: 'rgba(251,191,36,.14)',
    border: '1px solid rgba(251,191,36,.28)',
  },
  {
    u: 'user1',
    p: 'User1Pass!',
    label: 'user1',
    color: 'var(--a2b)',
    bg: 'color-mix(in srgb, var(--a2) 8%, transparent)',
    bgHover: 'color-mix(in srgb, var(--a2) 15%, transparent)',
    border: '1px solid color-mix(in srgb, var(--a2) 32%, transparent)',
  },
  {
    u: 'credit1',
    p: 'Credit1Pass!',
    label: 'credit1',
    color: 'var(--a1b)',
    bg: 'color-mix(in srgb, var(--a1) 10%, transparent)',
    bgHover: 'color-mix(in srgb, var(--a1) 18%, transparent)',
    border: '1px solid color-mix(in srgb, var(--a1) 35%, transparent)',
  },
]

function DemoChip({ chip, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        borderRadius: '10px',
        padding: '8px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11.5px',
        fontWeight: 600,
        color: chip.color,
        background: hover ? chip.bgHover : chip.bg,
        border: chip.border,
        transition: 'all .2s',
      }}
    >
      {chip.label}
    </button>
  )
}

export default function LoginPage() {
  const location = useLocation()
  // Флаг и username фиксируются при ПЕРВОМ рендере, а history-state очищается:
  // React Router кладёт location.state в window.history.state.usr, который браузер
  // сохраняет при перезагрузке вкладки — без очистки алерт пережил бы F5 вопреки
  // поведению макета (Pattern 7: state живёт в памяти и умирает при перезагрузке)
  const [expiredState] = useState(() => ({
    sessionExpired: Boolean(location.state?.sessionExpired),
    username: location.state?.username ?? '',
  }))
  useEffect(() => {
    if (location.state?.sessionExpired) {
      window.history.replaceState({ ...window.history.state, usr: null }, '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const sessionExpired = expiredState.sessionExpired
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    // username сохраняется при возврате по sessionExpired, пароль всегда пуст (макет :900)
    defaultValues: { username: expiredState.username, password: '' },
  })
  const [serverError, setServerError] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const auth = useAuth()
  const busy = useBusy()
  const toast = useToast()

  const onSubmit = async ({ username, password }) => {
    setServerError(null)
    // try сужен до HTTP-вызова: клиентские исключения после успешного ответа
    // (auth.login, toast) не должны маскироваться под «ошибки бэкенда» в ErrorBlock
    let data
    try {
      data = await login(username, password)
    } catch (e) {
      // e — результат parseApiError: {status, message, raw}
      if (e.status === 401 && e.raw?.error === 'Invalid credentials') {
        setServerError({ status: e.status, message: 'Неверный логин или пароль' })
      } else {
        setServerError({ status: e.status, message: e.message })
      }
      return
    }
    auth.login(data.token, data.user) // сохранит сессию и уведёт по роли
    // Тост входа (макет :892) — данные из живого ответа бэкенда
    toast('success', 'Вход выполнен', `${data.user.username} · ${data.user.role}`)
  }

  // Чип заполняет оба поля и сбрасывает ошибку — форму НЕ отправляет (макет :896–898)
  const fillDemo = (chip) => {
    setValue('username', chip.u)
    setValue('password', chip.p)
    setServerError(null)
  }

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px,4vw,40px)',
      }}
    >
      <div style={{ width: 'min(460px, 100%)' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, var(--a1b), var(--a2b))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 800,
              fontSize: '19px',
              color: '#070710',
              boxShadow:
                '0 14px 44px -8px color-mix(in srgb, var(--a1) 65%, transparent), 0 0 0 1px rgba(255,255,255,.12) inset',
            }}
          >
            SB
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(24px,5vw,32px)',
                letterSpacing: '1px',
                background: 'linear-gradient(95deg, var(--a1b) 10%, var(--a2b) 90%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              SCAM BANK
            </div>
          </div>
        </div>

        {sessionExpired && (
          <div
            style={{
              marginBottom: '16px',
              padding: '13px 15px',
              borderRadius: '14px',
              background: 'rgba(251,191,36,.08)',
              border: '1px solid rgba(251,191,36,.35)',
              animation: 'fadeUp .3s ease',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#fbbf24' }}>
              Сессия истекла — войдите заново
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11.5px',
                color: '#c9a44c',
                marginTop: '5px',
                overflowWrap: 'anywhere',
              }}
            >
              {'{"code":401,"message":"Expired JWT Token"}'}
            </div>
          </div>
        )}

        <Card
          radius={24}
          style={{
            padding: 'clamp(20px,4vw,30px)',
            boxShadow: '0 30px 80px -30px rgba(0,0,0,.8)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: '20px' }}>
              <Input
                label="Логин"
                placeholder="username"
                autoComplete="username"
                {...register('username')}
              />
            </div>

            <Input
              label="Пароль"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              mono
              {...register('password')}
            />

            <Checkbox
              checked={showPw}
              onChange={() => setShowPw((v) => !v)}
              label="Показать пароль"
              style={{ marginTop: '14px' }}
            />

            <ErrorBlock error={serverError} />

            <Button
              type="submit"
              disabled={isSubmitting || busy}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Войти в банк
            </Button>

            <div
              style={{
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '1px dashed rgba(255,255,255,.1)',
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#565672',
                  marginBottom: '10px',
                }}
              >
                Демо-доступы полигона
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {demoChips.map((chip) => (
                  <DemoChip key={chip.u} chip={chip} onClick={() => fillDemo(chip)} />
                ))}
              </div>
            </div>
          </form>
        </Card>

        <div
          style={{
            textAlign: 'center',
            marginTop: '18px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10.5px',
            letterSpacing: '.5px',
            color: '#565672',
          }}
        >
          учебный API-полигон · ошибки бэкенда показываются дословно
        </div>
      </div>
    </div>
  )
}
