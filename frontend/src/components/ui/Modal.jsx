// Модалка макета (D-05/D-06, SCAM Bank.dc.html :646–654 кредит, :710–738 удаления).
// Оверлей fixed z-120 + blur 10 БЕЗ клика-закрытия (анти-паттерн RESEARCH: макет
// закрывается ТОЛЬКО крестиком и «Отмена»). Карточка popIn .35s. danger — красноватые
// бордер/glow/заголовок (модалка сброса :727–731); проп glow — точечная подмена свечения
// (делет-модалка :713: белый бордер + красный glow — danger не ставится).
// width: 440 дефолт, 460 сброс, 560 кредит (фаза 4). footer — кнопки действий.

import { useState } from 'react'

export function Modal({ title, onClose, danger = false, width = 440, glow, footer, children }) {
  const [closeHover, setCloseHover] = useState(false)

  const glowShadow =
    glow ??
    (danger
      ? '0 0 90px -40px rgba(251,113,133,.6)'
      : '0 0 80px -30px color-mix(in srgb, var(--a1) 40%, transparent)')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(4,4,10,.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
      }}
    >
      <div
        style={{
          width: `min(${width}px, 100%)`,
          background: '#0d0d1a',
          border: danger ? '1px solid rgba(251,113,133,.25)' : '1px solid rgba(255,255,255,.11)',
          borderRadius: '24px',
          padding: 'clamp(20px,4vw,28px)',
          boxShadow: `0 40px 120px -30px rgba(0,0,0,.9), ${glowShadow}`,
          animation: 'popIn .35s cubic-bezier(.2,.9,.3,1.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 600,
              fontSize: '17px',
              ...(danger ? { color: '#fb7185' } : null),
            }}
          >
            {title}
          </div>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              marginLeft: 'auto',
              cursor: 'pointer',
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.1)',
              color: '#9b9bb4',
              fontSize: '15px',
              fontWeight: 700,
              transition: 'all .2s',
              ...(closeHover ? { color: '#fb7185', borderColor: '#fb7185' } : null),
            }}
          >
            ✕
          </button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {footer}
        </div>
      </div>
    </div>
  )
}
