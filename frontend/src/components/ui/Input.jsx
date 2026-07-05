// Инпут макета (D-05/D-06): лейбл mono-uppercase, поле со стеклянным фоном,
// focus-ринг цвета a2b, hint под полем. Стили дословно из SCAM Bank.dc.html
// (:85–93 логин; :560–569 админ-форма — вариант compact: radius 12, padding 12px 14px).
// mono — числовые/парольные поля (JetBrains Mono 13.5px). Работает и с react-hook-form
// (спред register: name/onChange/onBlur/ref уходят на нативный input), и контролируемо
// (value + onChange). style-focus макета → onFocus/onBlur-обработчики.

import { useState } from 'react'

export function Input({ label, hint, mono = false, compact = false, style, onFocus, onBlur, ...rest }) {
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
      <input
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
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.11)',
          borderRadius: compact ? '12px' : '13px',
          padding: compact ? '12px 14px' : '13px 15px',
          color: '#f2f2fa',
          fontSize: mono ? '13.5px' : compact ? '14px' : '14.5px',
          fontWeight: 600,
          outline: 'none',
          transition: 'border-color .2s, box-shadow .2s',
          ...(mono ? { fontFamily: "'JetBrains Mono', monospace" } : null),
          ...(focus
            ? {
                borderColor: 'var(--a2b)',
                boxShadow: '0 0 0 3px color-mix(in srgb, var(--a2) 22%, transparent)',
              }
            : null),
          ...style,
        }}
        {...rest}
      />
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
