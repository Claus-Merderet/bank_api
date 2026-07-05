// Ряд табов макета (:155–160, tabStyle :1112–1117, hover :1152).
// Контролируемый компонент: tabs [{key, label}], active (key), onChange(key) —
// состояние активного таба хранит владелец (D-02: useState, без URL).
// Локальный hover — только презентация (style-hover макета → обработчики, как в Button).

import { useState } from 'react'

const base = {
  padding: '11px 20px',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: "'Manrope', sans-serif",
  letterSpacing: '.2px',
  transition: 'all .2s',
}

function tabStyle(active, hover) {
  if (active) {
    return {
      ...base,
      background: 'linear-gradient(135deg, var(--a1b), var(--a2b))',
      color: '#0a0a14',
      border: '1px solid transparent',
      boxShadow: '0 8px 26px -6px color-mix(in srgb, var(--a1) 55%, transparent)',
      ...(hover ? { filter: 'brightness(1.08)' } : null),
    }
  }
  return {
    ...base,
    background: hover ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)',
    color: hover ? '#f2f2fa' : '#9b9bb4',
    border: '1px solid rgba(255,255,255,.09)',
    boxShadow: 'none',
  }
}

export function Tabs({ tabs, active, onChange }) {
  const [hoverKey, setHoverKey] = useState(null)
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '20px 0 6px' }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          onMouseEnter={() => setHoverKey(t.key)}
          onMouseLeave={() => setHoverKey(null)}
          style={tabStyle(t.key === active, t.key === hoverKey)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
