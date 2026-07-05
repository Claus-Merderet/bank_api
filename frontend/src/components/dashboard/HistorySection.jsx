// Секция «История операций» (TRAN-05, UIEL-07, UIEL-05, ACCT-05; макет :385–441).
// Шапка: h2 + селект счёта справа (предвыбор histAcc — lifted state DashboardPage:
// кнопка «История» карточки открывает таб с уже выбранным счётом). Данные — react-query
// ['transactions', histAcc] с enabled (пустой селект — запрос не летит); queryFn =
// fetchTransactions сам делает upsert number/balance счёта в реестр (v5: onSuccess у
// query нет — side-effect в API-модуле) — визит в историю освежает карточки «Счетов».
// Порядок строк — КАК В ОТВЕТЕ бэкенда (новые сверху), пересортировки нет; type сырой,
// createdAt как есть, суммы signed() (Anti-Patterns RESEARCH). Ошибка запроса —
// ErrorBlock render-fallback без useEffect-синхронизации (паттерн AdminPage).

import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '../../api/accounts'
import { useAccounts } from '../../hooks/useAccounts'
import { money, signed } from '../../lib/format'
import { Card } from '../ui/Card'
import { ErrorBlock } from '../ui/ErrorBlock'
import { Select } from '../ui/Select'
import { Table } from '../ui/Table'

// Цвета точек типов операций (макет :1157); неизвестный тип — серый fallback
const typeColors = {
  deposit: '#34d399',
  transfer_in: 'var(--a2b)',
  transfer_out: '#fb7185',
  credit_issuance: 'var(--a1b)',
  credit_repayment: '#fbbf24',
}

// Контрагент по типу операции (макет :1158–1164, копирайт UI-SPEC дословно)
const counterparty = (t) => {
  if (t.type === 'deposit') return 'Пополнение счёта'
  if (t.type === 'transfer_out') return `На счёт ID ${t.toAccountId}`
  if (t.type === 'transfer_in') return `Со счёта ID ${t.fromAccountId}`
  if (t.type === 'credit_issuance') return 'Выдача кредита'
  return 'Погашение кредита'
}

// Базовая ячейка истории (макет :416–420): паддинг плотнее базового sb-table —
// инлайн-стили td выигрывают у класса (конвенция Table.jsx)
const td = { padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,.05)' }

// Центрированное empty-состояние панели (макет :427–438)
function PanelEmpty({ title, hint }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#62627e' }}>{hint}</div>
    </div>
  )
}

export function HistorySection({ histAcc, setHistAcc }) {
  const known = useAccounts()

  // enabled: при пустом histAcc запрос не летит → empty «Счёт не выбран»
  const txQuery = useQuery({
    queryKey: ['transactions', histAcc],
    queryFn: () => fetchTransactions(histAcc),
    enabled: !!histAcc,
  })

  // Порядок массива ответа сохраняется (новые сверху уже от бэкенда)
  const rows = txQuery.data?.transactions ?? []

  return (
    <div>
      {/* Шапка секции (:388–398): h2 + селект счёта справа */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', margin: '26px 0 18px' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 600,
            fontSize: 'clamp(18px,2.2vw,23px)',
            letterSpacing: '.5px',
          }}
        >
          <span
            style={{
              color: 'var(--a2b)',
              fontSize: '.68em',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              marginRight: '9px',
            }}
          >
            03/
          </span>
          История операций
        </h2>
        {/* Опции из реестра (UIEL-05): number сырой, money() — из format.js;
            паддинг селекта шапки — 11px по вертикали (макет :391, UI-SPEC Spacing) */}
        <div style={{ marginLeft: 'auto', minWidth: 'min(300px,100%)' }}>
          <Select
            value={histAcc}
            onChange={(e) => setHistAcc(e.target.value)}
            style={{ padding: '11px 36px 11px 14px' }}
          >
            <option value="">— выберите счёт —</option>
            {known.map((a) => (
              <option key={a.id} value={a.id}>{`ID ${a.id} · ${a.number} · ${money(a.balance)}`}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Ошибка запроса истории — дословно, render-fallback (паттерн AdminPage) */}
      <ErrorBlock error={txQuery.error} style={{ margin: '0 0 16px' }} />

      {/* Панель состояний (:400; условия макета :1235–1236 + isPending/isError живого
          бэкенда, которых не было в синхронной симуляции: при ошибке выше уже висит
          ErrorBlock — «Операций пока нет» не показываем (операции неизвестны, а не
          отсутствуют); в полёте запроса — «Загрузка…», а не ложный empty) */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {!histAcc ? (
          <PanelEmpty
            title="Счёт не выбран"
            hint="выберите счёт в списке выше — история запрашивается по одному счёту"
          />
        ) : txQuery.isError ? null : txQuery.isPending ? (
          <PanelEmpty title="Загрузка…" hint="запрашиваем историю счёта" />
        ) : rows.length === 0 ? (
          <PanelEmpty title="Операций пока нет" hint="пополните счёт или сделайте перевод" />
        ) : (
          <Table
            sticky
            minWidth="640px"
            columns={['Тип', { label: 'Сумма', align: 'right' }, 'Контрагент', 'Кредит', 'Дата']}
            style={{ maxHeight: '520px', overflowY: 'auto' }}
          >
            {rows.map((t) => (
              <tr key={t.transactionId}>
                {/* Тип: точка 7×7 с glow цветом типа + сырой type (:416, :1169) */}
                <td style={td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        flex: 'none',
                        background: typeColors[t.type] ?? '#9b9bb4',
                        boxShadow: `0 0 10px ${typeColors[t.type] ?? '#9b9bb4'}`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#c9c9e2',
                      }}
                    >
                      {t.type}
                    </span>
                  </span>
                </td>
                {/* Сумма: signed() со знаком (+ зелёный / − U+2212 красный), вправо (:417, :1170–1171) */}
                <td style={{ ...td, textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '13px',
                      color: t.amount < 0 ? '#fb7185' : '#34d399',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {signed(t.amount)}
                  </span>
                </td>
                {/* Контрагент: русский текст по type (:418, :1158–1164) */}
                <td style={{ ...td, fontSize: '13px', color: '#9b9bb4' }}>{counterparty(t)}</td>
                {/* Кредит: #creditId или «—» (:419, :1172) */}
                <td style={td}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#7d7d9c' }}>
                    {t.creditId != null ? `#${t.creditId}` : '—'}
                  </span>
                </td>
                {/* Дата: createdAt бэкенда как есть (:420) */}
                <td style={td}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: '#7d7d9c',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.createdAt}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
