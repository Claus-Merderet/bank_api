// Роль-чип и произвольный pill макета (chipStyle :1102–1110, pill-счётчик :596).
// Проп role — цвет из карты ролей (ROLE_ADMIN #fbbf24 / ROLE_USER --a2b /
// ROLE_CREDIT_SECRET --a1b, прочие #9b9bb4), либо проп color для произвольных pill
// (счётчик «N записей» плана 04, лимит-бейджи фазы 3). Текст — children.
// bgMix/borderMix — проценты color-mix фона/бордера (у счётчика-pill макета 8%/30%).

const roleColors = {
  ROLE_ADMIN: '#fbbf24',
  ROLE_USER: 'var(--a2b)',
  ROLE_CREDIT_SECRET: 'var(--a1b)',
}

export function Badge({ role, color, bgMix = 10, borderMix = 38, style, children }) {
  const c = color ?? roleColors[role] ?? '#9b9bb4'
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '.8px',
        padding: '3px 9px',
        borderRadius: '999px',
        color: c,
        whiteSpace: 'nowrap',
        background: `color-mix(in srgb, ${c} ${bgMix}%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} ${borderMix}%, transparent)`,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
