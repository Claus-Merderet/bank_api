// Пустое состояние (D-05/D-06, макет :427–438): dashed-контейнер, заголовок Unbounded,
// подтекст. Потребителей в фазе 2 НЕТ — компонент из закрытого списка базовых компонентов
// фазы (CONTEXT §Phase Boundary), первые потребители — экраны фаз 3–4
// («Операций пока нет», «Счета неизвестны» и др.).

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div
      style={{
        border: '1.5px dashed rgba(255,255,255,.14)',
        borderRadius: '22px',
        background: 'rgba(255,255,255,.015)',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      {icon && <div style={{ fontSize: '22px', marginBottom: '10px', color: '#62627e' }}>{icon}</div>}
      <div
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 600,
          fontSize: '15px',
          marginBottom: '6px',
        }}
      >
        {title}
      </div>
      {subtitle && <div style={{ fontSize: '13px', color: '#62627e' }}>{subtitle}</div>}
    </div>
  )
}
