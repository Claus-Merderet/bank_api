// Топбар макета (:136–153): sticky-контейнер, лого SB 38×38 + «SCAM BANK»,
// юзер-чип (аватар-буква на градиенте, имя, роль-Badge), кнопки «истечь токен» и «Выйти».
// «истечь токен» (D-11, честный клиентский сброс): auth.expireSession() — ОДИН navigate
// на /login со state { sessionExpired, username }; LoginPage читает этот state (макет :900).
// «Выйти» — просто auth.logout(), БЕЗ sessionExpired (макет :899).
// «истечь токен» — локальная кнопка с точными стилями макета: Button secondary не подходит,
// т.к. style-переопределения цвета/бордера перекрыли бы hover-перекраску (#fbbf24).

import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// Кнопка «истечь токен» (:150): mono 11px 600, hover — бордер и текст #fbbf24
function ExpireButton({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      title="Симулировать истечение JWT-токена"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        borderRadius: '11px',
        padding: '9px 13px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 600,
        color: hover ? '#fbbf24' : '#9b9bb4',
        background: 'rgba(255,255,255,.04)',
        border: `1px solid ${hover ? '#fbbf24' : 'rgba(255,255,255,.1)'}`,
        transition: 'all .2s',
      }}
    >
      истечь токен
    </button>
  )
}

export function Topbar() {
  const { user, logout, expireSession } = useAuth()

  return (
    <div
      style={{
        position: 'sticky',
        top: '12px',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap',
        padding: '12px 18px',
        borderRadius: '18px',
        background: 'rgba(9,9,18,.72)',
        border: '1px solid rgba(255,255,255,.09)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 18px 50px -22px rgba(0,0,0,.9)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--a1b), var(--a2b))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 800,
            fontSize: '13px',
            color: '#070710',
            boxShadow: '0 8px 24px -6px color-mix(in srgb, var(--a1) 60%, transparent)',
          }}
        >
          SB
        </div>
        <div
          style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '.8px',
            background: 'linear-gradient(95deg, var(--a1b), var(--a2b))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          SCAM BANK
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px 6px 6px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--a1), var(--a2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 800,
              fontSize: '12px',
              color: '#070710',
            }}
          >
            {(user?.username ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.2, color: '#f2f2fa' }}>{user?.username}</div>
            <Badge role={user?.role} style={{ marginTop: '3px' }}>
              {user?.role}
            </Badge>
          </div>
        </div>
        <ExpireButton onClick={expireSession} />
        <Button variant="secondary" hoverColor="#fb7185" onClick={logout}>
          Выйти
        </Button>
      </div>
    </div>
  )
}
