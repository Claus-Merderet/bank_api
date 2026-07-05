// Карточка-«банковская карта» счёта (ACCT-01, UIEL-контракт UI-SPEC фазы 3).
// Кодового аналога нет — разметка и стили дословно из макета SCAM Bank.dc.html
// :196–216, градиенты cardStyle :1131–1138: чередование card-even/card-odd по
// индексу карточки в списке. Кнопки «Пополнить»/«История» дёргают колбэки
// предвыбора (onDeposit/onHistory) — семантика макета :1139–1140.

import { useState } from 'react'
import { money, numFmt } from '../../lib/format'

// Кнопка на карте (:212–213): стеклянная тёмная, hover затемняет фон
function CardButton({ onClick, children }) {
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
        fontSize: '12px',
        fontWeight: 700,
        color: '#fff',
        background: hover ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.28)',
        border: '1px solid rgba(255,255,255,.25)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        transition: 'all .2s',
      }}
    >
      {children}
    </button>
  )
}

export function AccountCard({ account, index, onDeposit, onHistory }) {
  return (
    <div
      style={{
        background:
          index % 2 === 0
            ? 'linear-gradient(135deg, color-mix(in srgb, var(--a1) 60%, #0b0b18) 0%, color-mix(in srgb, var(--a2) 52%, #0b0b18) 100%)'
            : 'linear-gradient(135deg, color-mix(in srgb, var(--a2) 48%, #0b0b18) 0%, color-mix(in srgb, var(--a1) 66%, #140a22) 100%)',
        border: '1px solid rgba(255,255,255,.14)',
        borderRadius: '22px',
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '196px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px -24px color-mix(in srgb, var(--a1) 50%, transparent)',
      }}
    >
      {/* Декоративные круги (:198–199) */}
      <div
        style={{
          position: 'absolute',
          right: '-70px',
          top: '-70px',
          width: '210px',
          height: '210px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,.07)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-30px',
          bottom: '-90px',
          width: '190px',
          height: '190px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,.16)',
          pointerEvents: 'none',
        }}
      />
      {/* Шапка карты: чип + pill «ID N» + логотип (:200–204) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <div
          style={{
            width: '36px',
            height: '26px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, rgba(255,255,255,.4), rgba(255,255,255,.12))',
            border: '1px solid rgba(255,255,255,.35)',
          }}
        />
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            padding: '3px 9px',
            borderRadius: '999px',
            background: 'rgba(0,0,0,.28)',
            color: 'rgba(255,255,255,.85)',
            border: '1px solid rgba(255,255,255,.18)',
          }}
        >
          ID {account.id}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontFamily: "'Unbounded', sans-serif",
            fontSize: '9.5px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,.65)',
          }}
        >
          SCAM BANK
        </div>
      </div>
      {/* Номер счёта «317 0988» (:205) */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(17px,1.8vw,20px)',
          fontWeight: 600,
          letterSpacing: '4px',
          color: 'rgba(255,255,255,.92)',
          margin: '22px 0 auto',
          position: 'relative',
          textShadow: '0 1px 6px rgba(0,0,0,.4)',
        }}
      >
        {numFmt(account.number)}
      </div>
      {/* Низ: баланс слева, кнопки справа (:206–214) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          flexWrap: 'wrap',
          position: 'relative',
          marginTop: '18px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.55)',
              marginBottom: '4px',
            }}
          >
            БАЛАНС
          </div>
          <div
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(20px,2.2vw,26px)',
              color: '#fff',
              textShadow: '0 2px 16px rgba(0,0,0,.35)',
            }}
          >
            {money(account.balance)}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <CardButton onClick={onDeposit}>Пополнить</CardButton>
          <CardButton onClick={onHistory}>История</CardButton>
        </div>
      </div>
    </div>
  )
}
