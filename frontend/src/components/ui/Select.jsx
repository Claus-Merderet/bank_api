// Селект макета (D-05/D-06, SCAM Bank.dc.html :572–576): лейбл и hint как у Input,
// нативный <select> с appearance:none и точным data-URI шевроном (svg 12×8, stroke #9b9bb4 —
// RESEARCH Code Examples). Тёмные option даёт глобальный стиль index.css
// (select option { background:#12121f }). Контролируемый: value + onChange, children — option.

import { useState } from 'react'

const chevron =
  "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22%3E%3Cpath d=%22M1 1l5 5 5-5%22 stroke=%22%239b9bb4%22 stroke-width=%222%22 fill=%22none%22 stroke-linecap=%22round%22/%3E%3C/svg%3E')"

export function Select({ label, hint, style, onFocus, onBlur, children, ...rest }) {
  const [focus, setFocus] = useState(false)

  return (
    <div>
      {label && (
        <label
          style={{
            display: 'block',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color: '#7d7d9c',
            margin: '0 0 8px 2px',
          }}
        >
          {label}
        </label>
      )}
      <select
        onFocus={(e) => {
          setFocus(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocus(false)
          onBlur?.(e)
        }}
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.11)',
          borderRadius: '12px',
          padding: '12px 36px 12px 14px',
          color: '#f2f2fa',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: chevron,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 13px center',
          transition: 'border-color .2s, box-shadow .2s',
          ...(focus
            ? {
                borderColor: 'var(--a2b)',
                boxShadow: '0 0 0 3px color-mix(in srgb, var(--a2) 22%, transparent)',
              }
            : null),
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      {hint && (
        <div
          style={{
            margin: '7px 2px 0',
            fontSize: '11.5px',
            color: '#62627e',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  )
}
