// Таблица макета (D-05/D-06, SCAM Bank.dc.html :610–631): обёртка overflow-x,
// th mono-uppercase 10px #565672, разделители строк .05, hover строк .03.
// columns — массив заголовков: строка или {label, align}; children — строки <tr> tbody
// (дискреция: children-вариант, не data+render — потребители сами владеют разметкой td).
// hover и базовые td-стили — CSS-класс sb-table (children произвольны, обработчики
// не навесить); инлайн-стили td у потребителя выигрывают у класса. Внешних бордеров нет.

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

export function Table({ columns, style, children }) {
  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <style>{tableCss}</style>
      <table className="sb-table" style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => {
              const c = typeof col === 'string' ? { label: col } : col
              return (
                <th key={i} style={thStyle(c.align ?? 'left')}>
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
