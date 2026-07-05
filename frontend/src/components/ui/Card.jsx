// Стеклянная панель макета (D-05/D-06): фон rgba(255,255,255,.03), бордер .09,
// blur 18px (при radius 24 — логин-вариант, blur 20px), padding clamp(18px,3vw,26px).
// Стили из SCAM Bank.dc.html (:83 логин, :557/:593 панели админки); тень логина
// 0 30px 80px -30px rgba(0,0,0,.8) прокидывается через style.

export function Card({ radius = 22, style, children }) {
  const blur = radius === 24 ? 'blur(20px)' : 'blur(18px)'

  return (
    <div
      style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.09)',
        borderRadius: radius + 'px',
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        padding: 'clamp(18px,3vw,26px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
