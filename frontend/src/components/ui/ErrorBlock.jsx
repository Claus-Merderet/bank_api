// Блок ошибки макета (D-05/D-06): вход — объект parseApiError {status, message} или
// null (→ рендер null). Чип «HTTP <status>» показывается по константе httpChips
// (config.js, D-08); message разбивается по \n, каждая строка с префиксом «▸ »
// (mapErr макета :1119–1122, вёрстка :104–113). Рендер ТОЛЬКО текстовыми нодами JSX —
// тексты бэкенда произвольны (инвариант T-01-07), React экранирует сам.

import { httpChips } from '../../config'

export function ErrorBlock({ error }) {
  if (!error) return null

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '13px 15px',
        borderRadius: '12px',
        background: 'rgba(244,63,94,.09)',
        border: '1px solid rgba(244,63,94,.32)',
        animation: 'fadeUp .25s ease',
      }}
    >
      {httpChips && (
        <div
          style={{
            display: 'inline-block',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'rgba(244,63,94,.16)',
            color: '#fb7185',
            marginBottom: '7px',
          }}
        >
          HTTP {error.status}
        </div>
      )}
      {String(error.message)
        .split('\n')
        .map((ln, i) => (
          <div
            key={i}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12.5px',
              color: '#fda4af',
              lineHeight: 1.75,
            }}
          >
            ▸ {ln}
          </div>
        ))}
    </div>
  )
}
