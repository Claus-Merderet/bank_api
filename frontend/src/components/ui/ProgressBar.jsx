// Верхний прогресс-бар «запрос в полёте» (D-03): виден только пока useBusy() — true,
// собственного состояния нет. Стили — дословно из макета (SCAM Bank.dc.html:58–60).

import { useBusy } from '../../hooks/useBusy'

export function ProgressBar() {
  const isBusy = useBusy()
  if (!isBusy) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 400,
        overflow: 'hidden',
        background: 'rgba(255,255,255,.05)',
      }}
    >
      <div
        style={{
          width: '38%',
          height: '100%',
          background: 'linear-gradient(90deg, var(--a1b), var(--a2b))',
          borderRadius: '3px',
          animation: 'slide 1s ease-in-out infinite',
          boxShadow: '0 0 14px var(--a2b)',
        }}
      />
    </div>
  )
}
