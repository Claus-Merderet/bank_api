// Неоновый фон всех экранов (D-06): три fixed-блоба + сетка 44px — дословно из макета
// (SCAM Bank.dc.html:51–54). Все элементы pointer-events:none; play-state блобов — var(--fxplay).
// При bgFx=false из config.js блобы не рендерятся (сетка остаётся); дефолт — true.

import { bgFx } from '../../config'

export function Background() {
  return (
    <>
      {bgFx && (
        <>
          <div
            style={{
              position: 'fixed',
              left: '-14vw',
              top: '-20vh',
              width: '58vw',
              height: '58vw',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 35%, color-mix(in srgb, var(--a1) 50%, transparent), transparent 68%)',
              filter: 'blur(70px)',
              opacity: 0.55,
              pointerEvents: 'none',
              animation: 'blob 26s ease-in-out infinite',
              animationPlayState: 'var(--fxplay)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              right: '-16vw',
              top: '6vh',
              width: '52vw',
              height: '52vw',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 60% 40%, color-mix(in srgb, var(--a2) 42%, transparent), transparent 66%)',
              filter: 'blur(80px)',
              opacity: 0.5,
              pointerEvents: 'none',
              animation: 'blob 30s ease-in-out infinite',
              animationDelay: '-9s',
              animationPlayState: 'var(--fxplay)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              left: '22vw',
              bottom: '-34vh',
              width: '60vw',
              height: '60vw',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--a1) 30%, transparent), color-mix(in srgb, var(--a2) 18%, transparent) 45%, transparent 70%)',
              filter: 'blur(90px)',
              opacity: 0.4,
              pointerEvents: 'none',
              animation: 'blob 34s ease-in-out infinite',
              animationDelay: '-17s',
              animationPlayState: 'var(--fxplay)',
            }}
          />
        </>
      )}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 30%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
