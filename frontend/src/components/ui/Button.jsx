// Кнопка макета (D-05/D-06): 4 варианта — primary/secondary/danger/danger-ghost.
// Стили перенесены дословно из SCAM Bank.dc.html (:115, :151, :718–719, :734, :635).
// hover/active — через локальное состояние (style-hover макета → обработчики, Pitfall 6:
// сложные тени/градиенты/color-mix живут в инлайн-style, не в Tailwind-классах).
// Disabled-вид даёт глобальный стиль index.css (opacity .55 + saturate .6) — здесь
// только проброс атрибута. hoverColor — перекраска secondary на hover (нужен Topbar, план 03).

import { useState } from 'react'

const variants = {
  primary: {
    base: {
      border: 'none',
      borderRadius: '13px',
      padding: '15px 22px',
      fontWeight: 800,
      fontSize: '15px',
      letterSpacing: '.3px',
      color: '#070710',
      background: 'linear-gradient(135deg, var(--a1b), var(--a2b))',
      boxShadow: '0 12px 34px -8px color-mix(in srgb, var(--a1) 60%, transparent)',
      transition: 'transform .15s, filter .2s',
    },
    hover: { filter: 'brightness(1.12)', transform: 'translateY(-1px)' },
    active: { transform: 'translateY(0)' },
  },
  secondary: {
    base: {
      borderRadius: '11px',
      padding: '9px 15px',
      fontWeight: 700,
      fontSize: '13px',
      color: '#c9c9e2',
      background: 'rgba(255,255,255,.05)',
      border: '1px solid rgba(255,255,255,.12)',
      transition: 'all .2s',
    },
    // hover: дефолт — бордер .3 + текст #f2f2fa; hoverColor перекрашивает оба (Topbar)
    hover: null,
    active: null,
  },
  danger: {
    base: {
      border: 'none',
      borderRadius: '12px',
      padding: '12px 18px',
      fontWeight: 800,
      fontSize: '13.5px',
      color: '#14060b',
      background: 'linear-gradient(135deg, #fda4af, #fb7185)',
      boxShadow: '0 10px 30px -8px rgba(251,113,133,.5)',
      transition: 'transform .15s, filter .2s',
    },
    hover: { filter: 'brightness(1.1)' },
    active: { transform: 'translateY(0)' },
  },
  'danger-ghost': {
    base: {
      borderRadius: '10px',
      padding: '8px 13px',
      fontWeight: 700,
      fontSize: '12px',
      color: '#fb7185',
      background: 'rgba(251,113,133,.06)',
      border: '1px solid rgba(251,113,133,.3)',
      transition: 'all .2s',
    },
    hover: { background: 'rgba(251,113,133,.14)' },
    active: null,
  },
}

export function Button({ variant = 'primary', hoverColor, style, children, ...rest }) {
  const [hover, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const v = variants[variant] ?? variants.primary

  let hoverStyle = v.hover
  if (variant === 'secondary') {
    hoverStyle = hoverColor
      ? { borderColor: hoverColor, color: hoverColor }
      : { borderColor: 'rgba(255,255,255,.3)', color: '#f2f2fa' }
  }

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setActive(false)
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        cursor: 'pointer',
        ...v.base,
        ...(hover ? hoverStyle : null),
        ...(active ? v.active : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
