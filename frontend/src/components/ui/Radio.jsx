// Радиогруппа-карточки макета (UIEL-02, SCAM Bank.dc.html :282–296): обёртка
// role="radiogroup" + aria-label, каждая опция — <button type="button" role="radio"
// aria-checked> по WAI-ARIA APG (паттерн Checkbox.jsx — фокус и Space/Enter бесплатны).
// Checked: точка 11×11 с градиентом a1b→a2b и glow + абсолютная обводка карточки
// цвета a2b со свечением (inset -1px). Тексты опций компонент НЕ знает — приходят
// пропсами options: [{ value, title, caption }].

import { useState } from 'react'

export function Radio({ ariaLabel, value, onChange, options }) {
  // hover — значение опции под курсором (style-hover макета → обработчики)
  const [hover, setHover] = useState(null)

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}
    >
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(opt.value)}
            onMouseEnter={() => setHover(opt.value)}
            onMouseLeave={() => setHover(null)}
            style={{
              flex: '1 1 210px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '14px',
              padding: '14px 16px',
              background: hover === opt.value ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)',
              color: 'inherit',
              transition: 'all .2s',
            }}
          >
            {checked && (
              <span
                style={{
                  position: 'absolute',
                  inset: '-1px',
                  borderRadius: '14px',
                  border: '1.5px solid var(--a2b)',
                  boxShadow: '0 0 26px -6px color-mix(in srgb, var(--a2) 55%, transparent)',
                  pointerEvents: 'none',
                }}
              />
            )}
            <span
              style={{
                width: '19px',
                height: '19px',
                borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              {checked && (
                <span
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--a1b), var(--a2b))',
                    boxShadow: '0 0 10px var(--a2b)',
                  }}
                />
              )}
            </span>
            <span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: '14px' }}>{opt.title}</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#9b9bb4', marginTop: '2px' }}>
                {opt.caption}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
