// Таблица макета (D-05/D-06, SCAM Bank.dc.html :610–631): обёртка overflow-x,
// th mono-uppercase 10px #565672, разделители строк .05, hover строк .03.
// columns — массив заголовков: строка или {label, align}; children — строки <tr> tbody
// (дискреция: children-вариант, не data+render — потребители сами владеют разметкой td).
// hover и базовые td-стили — CSS-класс sb-table (children произвольны, обработчики
// не навесить); инлайн-стили td у потребителя выигрывают у класса. Внешних бордеров нет.
// Sticky-вариант истории (макет :402–411): опциональный проп sticky прижимает th
// (position sticky, top 0, фон #0b0b18, padding 14px 18px — обёртку с max-height даёт
// потребитель через style); minWidth — минимальная ширина таблицы. Дефолты прежние —
// существующие потребители (AdminPage) не затронуты.

const tableCss =
  '.sb-table td { padding: 12px 22px; border-bottom: 1px solid rgba(255,255,255,.05); }' +
  '.sb-table tbody tr { transition: background .15s; }' +
  '.sb-table tbody tr:hover { background: rgba(255,255,255,.03); }'

function thStyle(align) {
  return {
    textAlign: align,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1.8px',
    textTransform: 'uppercase',
    color: '#565672',
    padding: '12px 22px',
    borderBottom: '1px solid rgba(255,255,255,.08)',
  }
}

// Добавка к thStyle при sticky (типографика th прежняя, паддинг плотнее — макет :406)
const stickyTh = {
  position: 'sticky',
  top: 0,
  background: '#0b0b18',
  padding: '14px 18px',
}

export function Table({ columns, sticky = false, minWidth = '520px', style, children }) {
  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <style>{tableCss}</style>
      <table className="sb-table" style={{ width: '100%', minWidth, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => {
              const c = typeof col === 'string' ? { label: col } : col
              return (
                <th key={i} style={{ ...thStyle(c.align ?? 'left'), ...(sticky ? stickyTh : null) }}>
                  {c.label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
