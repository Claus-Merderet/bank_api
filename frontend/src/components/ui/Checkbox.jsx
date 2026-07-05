// Кастомный чекбокс макета (D-05/D-06, RESEARCH Pattern 6 — WAI-ARIA APG):
// нативный <button type="button" role="checkbox" aria-checked> — фокус и Space/Enter
// бесплатны. Стили дословно из SCAM Bank.dc.html (:95–102): квадрат 19×19 (size —
// проп, 21 для модалки кредита фазы 4), checked — слой inset -1.5px с градиентом
// a1b→a2b и глифом ✓ #070710.

import { useState } from 'react'

export function Checkbox({ checked, onChange, label, size = 19, style }) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'none',
        border: 'none',
        padding: '2px',
        cursor: 'pointer',
        color: hover ? '#c9c9e2' : '#9b9bb4',
        fontSize: '13px',
        fontWeight: 600,
        ...style,
      }}
    >
      <span
        style={{
          width: size + 'px',
          height: size + 'px',
          borderRadius: '6px',
          border: '1.5px solid rgba(255,255,255,.25)',
          background: 'rgba(255,255,255,.04)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
          position: 'relative',
        }}
      >
        {checked && (
          <span
            style={{
              position: 'absolute',
              inset: '-1.5px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, var(--a1b), var(--a2b))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              color: '#070710',
              boxShadow: '0 2px 10px color-mix(in srgb, var(--a2) 45%, transparent)',
            }}
          >
            ✓
          </span>
        )}
      </span>
      {label}
    </button>
  )
}
