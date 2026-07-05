// Секция «Кредиты» целиком (CRED-01/03/04, UIEL-04; макет :445–544, статус-pill :1177–1183).
// Полный вертикальный срез: оформление через CreditModal + погашение одной кнопкой на живом
// бэкенде. Опирается на RESEARCH §Pattern 2 (query ['credits'] + производный активный),
// §Pattern 3 (repay без баланса → backfill fetchTransactions), §Pattern 4 (prefill погашения
// ТОЛЬКО эффектом по active?.creditId, не в теле рендера и не в onSuccess request).
// Квирки живого контракта: успех определяется резолвом промиса, НЕ HTTP-статусом (кредитные
// бизнес-ошибки летят 404 — показываем дословно через ErrorBlock); долг хранится ОТРИЦАТЕЛЬНЫМ
// balance, показываем положительным money(-balance); ответ repay баланса не содержит →
// дебетуемый счёт добираем фоновым fetchTransactions с guard accountsStore.has. Тосты берут
// данные ТОЛЬКО из тела ответа (Pitfall 3), не из полей формы. Тексты ошибок бэкенда —
// только через ErrorBlock, локальных литералов в JSX нет.

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requestCredit, repayCredit, fetchCreditHistory } from '../../api/credits'
import { fetchTransactions } from '../../api/accounts'
import { accountsStore } from '../../api/accountsStore'
import { useAccounts } from '../../hooks/useAccounts'
import { useBusy } from '../../hooks/useBusy'
import { money, parseNum } from '../../lib/format'
import { CreditModal } from './CreditModal'
import { Card } from '../ui/Card'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ErrorBlock } from '../ui/ErrorBlock'
import { Table } from '../ui/Table'
import { useToast } from '../ui/ToastProvider'

// Лейбл панели (Shared Pattern, TransfersSection :35–42): mono 11px 700, ls 2px, uppercase
const sectionLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: '#7d7d9c',
}

// Базовая ячейка таблицы истории кредитов (макет :528–533)
const td = { padding: '13px 22px', borderBottom: '1px solid rgba(255,255,255,.05)' }

// Статус-pill строки истории (макет :1181–1183): активный красный / погашенный зелёный
function statusPillStyle(color) {
  return {
    display: 'inline-block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10.5px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '999px',
    color,
    background: `color-mix(in srgb, ${color} 8%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
    whiteSpace: 'nowrap',
  }
}

export function CreditsSection() {
  const known = useAccounts()
  const busy = useBusy()
  const push = useToast()
  const queryClient = useQueryClient()

  // История кредитов (RESEARCH §Pattern 2): долг отрицательным balance, новые сверху уже
  // от бэкенда. Активный кредит производный — лимит 1 → максимум один с balance < 0 (CRED-03)
  const creditsQuery = useQuery({ queryKey: ['credits'], queryFn: fetchCreditHistory })
  const credits = creditsQuery.data ?? []
  const active = credits.find((c) => c.balance < 0) ?? null

  // Поля формы оформления живут В СЕКЦИИ (контракт CreditModal): модалка их только читает/пишет
  const [modalOpen, setModalOpen] = useState(false)
  const [crAmount, setCrAmount] = useState('')
  const [crTerm, setCrTerm] = useState('')
  const [crAcc, setCrAcc] = useState('')
  const [crConsent, setCrConsent] = useState(false)
  const [errCr, setErrCr] = useState(null)
  // Поля блока погашения
  const [repayAcc, setRepayAcc] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const [errRepay, setErrRepay] = useState(null)

  // Открытие модалки (locked decision): сброс ошибки и согласия, гейт кнопки — только чекбокс
  const openModal = () => {
    setErrCr(null)
    setCrConsent(false)
    setModalOpen(true)
  }
  const creditBtnDisabled = !crConsent || busy // UIEL-01 гейт

  // Мутация оформления (аналог transferMut): мягкая валидация — суммы числом|null (Pitfall 5),
  // клиентских проверок нет. Тост — ТОЛЬКО из тела ответа (Pitfall 3). ВАЖНО (Open Question
  // resolution): onSuccess НЕ трогает repayAmount/repayAcc — prefill делает эффект по creditId
  const requestMut = useMutation({
    mutationFn: () =>
      requestCredit({
        accountId: crAcc === '' ? null : Number(crAcc),
        amount: Number.isNaN(parseNum(crAmount)) ? null : parseNum(crAmount),
        termMonths: Number.isNaN(parseNum(crTerm)) ? null : parseNum(crTerm),
      }),
    onSuccess: (data) => {
      push('success', 'Кредит оформлен', `creditId ${data.creditId} · +${data.amount} на счёт ID ${data.id}`)
      setModalOpen(false)
      setCrConsent(false)
      setCrAmount('')
      setCrTerm('')
      queryClient.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => setErrCr(e),
  })

  // Prefill погашения — ТОЛЬКО эффектом по active?.creditId (RESEARCH §Pattern 4, Pitfall 4):
  // единый источник без «моргания», долг положительным. Поля остаются редактируемыми (§4.5)
  useEffect(() => {
    if (active) {
      setRepayAcc(String(active.accountId))
      setRepayAmount(String(-active.balance))
    }
  }, [active?.creditId])

  // Мутация погашения + backfill (RESEARCH §Pattern 3, Pitfall 2): ответ repay баланса не даёт,
  // дебетуемый счёт добираем фоновым fetchTransactions с guard has(); ошибку добора глотаем
  const repayMut = useMutation({
    mutationFn: async () => {
      // Фиксируем счёт списания В МОМЕНТ mutate() (аналог TransfersSection): именно этот счёт
      // реально дебетуется на бэкенде, и именно его добираем в onSuccess — а не текущее значение
      // repayAcc из замыкания, которое пользователь мог сменить в полёте запроса (WR-01).
      const acc = repayAcc === '' ? null : Number(repayAcc)
      const data = await repayCredit({
        creditId: active?.creditId,
        accountId: acc,
        amount: Number.isNaN(parseNum(repayAmount)) ? null : parseNum(repayAmount),
      })
      return { data, acc }
    },
    onSuccess: ({ data, acc }) => {
      push('success', 'Кредит погашён', `creditId ${data.creditId} · amountDeposited: ${data.amountDeposited}`)
      if (acc != null && accountsStore.has(acc)) fetchTransactions(acc).catch(() => {})
      setErrRepay(null)
      queryClient.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => setErrRepay(e),
  })

  return (
    <div style={{ animation: 'fadeUp .35s ease' }}>
      {/* Шапка секции (макет :446–449): h2 «04/ Кредиты» + кнопка «Оформить кредит» справа */}
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
            04/
          </span>
          Кредиты
        </h2>
        <Button
          onClick={openModal}
          style={{ marginLeft: 'auto', borderRadius: '12px', padding: '12px 22px', fontSize: '14px' }}
        >
          Оформить кредит
        </Button>
      </div>

      {/* Активный кредит (макет :452–500) ИЛИ empty «Нет активного кредита» (:504–507) */}
      {active ? (
        <div
          style={{
            position: 'relative',
            borderRadius: '24px',
            padding: '1.5px',
            background: 'linear-gradient(135deg, var(--a1), var(--a2))',
            boxShadow: '0 24px 70px -28px color-mix(in srgb, var(--a1) 65%, transparent)',
            marginBottom: '24px',
          }}
        >
          <div style={{ borderRadius: '22.5px', background: '#0b0b18', padding: 'clamp(20px,3vw,28px)' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Левая колонка: pill + долг + мета */}
              <div style={{ flex: '1 1 240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      color: '#fb7185',
                      background: 'rgba(251,113,133,.1)',
                      border: '1px solid rgba(251,113,133,.35)',
                    }}
                  >
                    Активный кредит
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#565672' }}>
                    creditId {active.creditId}
                  </span>
                </div>
                <div style={{ ...sectionLabel, fontSize: '10px', color: '#7d7d9c', marginBottom: '4px' }}>Долг</div>
                <div
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(26px,3.4vw,36px)',
                    background: 'linear-gradient(95deg, #fb7185, var(--a1b))',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {money(-active.balance)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '14px',
                    flexWrap: 'wrap',
                    marginTop: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11.5px',
                    color: '#9b9bb4',
                  }}
                >
                  <span>счёт: ID {active.accountId}</span>
                  <span>срок: {active.termMonths} мес</span>
                  <span>оформлен: {active.createdAt}</span>
                </div>
              </div>

              {/* Правая колонка: блок погашения (макет :468–497) */}
              <div
                style={{
                  flex: '1 1 300px',
                  background: 'rgba(255,255,255,.03)',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: '16px',
                  padding: '18px',
                }}
              >
                <div style={{ ...sectionLabel, marginBottom: '14px' }}>Погашение</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Select label="Счёт списания" value={repayAcc} disabled={busy} onChange={(e) => setRepayAcc(e.target.value)}>
                    <option value="">— выберите счёт —</option>
                    {known.map((a) => (
                      <option key={a.id} value={a.id}>{`ID ${a.id} · ${a.number} · ${money(a.balance)}`}</option>
                    ))}
                  </Select>
                  <Input
                    label="Сумма погашения"
                    mono
                    inputMode="decimal"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    hint="строго точной суммой долга, частичное погашение невозможно"
                  />
                  <Button
                    disabled={busy}
                    onClick={() => repayMut.mutate()}
                    style={{ alignSelf: 'flex-start', borderRadius: '11px', padding: '12px 20px', fontSize: '13.5px' }}
                  >
                    Погасить целиком
                  </Button>
                </div>
                <ErrorBlock error={errRepay} style={{ margin: '14px 0 0' }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            border: '1.5px dashed rgba(255,255,255,.14)',
            borderRadius: '22px',
            background: 'rgba(255,255,255,.015)',
            padding: 'clamp(24px,4vw,40px)',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: '16px', marginBottom: '6px' }}
          >
            Нет активного кредита
          </div>
          <div style={{ fontSize: '13.5px', color: '#9b9bb4' }}>
            доступен один активный кредит: 5000–15000 ₽ на 1–60 месяцев
          </div>
        </div>
      )}

      {/* Ошибка запроса истории — дословно, render-fallback (паттерн HistorySection :110) */}
      <ErrorBlock error={creditsQuery.error} style={{ margin: '0 0 16px' }} />

      {/* История кредитов (макет :510–543): всегда видима, таблица ИЛИ empty */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ ...sectionLabel, padding: '18px 22px 0' }}>История кредитов</div>
        {credits.length === 0 ? (
          <div style={{ padding: '36px 24px', textAlign: 'center', fontSize: '13px', color: '#62627e' }}>
            кредитов ещё не было
          </div>
        ) : (
          <Table
            columns={['№', { label: 'Сумма', align: 'right' }, 'Срок', 'Счёт', 'Статус', 'Оформлен']}
            minWidth="640px"
            style={{ marginTop: '6px' }}
          >
            {credits.map((c) => (
              <tr key={c.creditId}>
                <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', color: '#9b9bb4' }}>
                  #{c.creditId}
                </td>
                <td
                  style={{
                    ...td,
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {money(c.amount)}
                </td>
                <td style={{ ...td, fontSize: '13px', color: '#9b9bb4' }}>{c.termMonths} мес</td>
                <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', color: '#9b9bb4' }}>
                  ID {c.accountId}
                </td>
                <td style={td}>
                  {c.balance < 0 ? (
                    <span style={statusPillStyle('#fb7185')}>Активен · долг {money(-c.balance)}</span>
                  ) : (
                    <span style={statusPillStyle('#34d399')}>Погашен</span>
                  )}
                </td>
                <td style={td}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: '#7d7d9c',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.createdAt}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Модалка оформления — полный контракт пропсов CreditModal (04-01) */}
      {modalOpen && (
        <CreditModal
          onClose={() => setModalOpen(false)}
          onSubmit={() => requestMut.mutate()}
          crAmount={crAmount}
          setCrAmount={setCrAmount}
          crTerm={crTerm}
          setCrTerm={setCrTerm}
          crAcc={crAcc}
          setCrAcc={setCrAcc}
          crConsent={crConsent}
          setCrConsent={setCrConsent}
          creditBtnDisabled={creditBtnDisabled}
          errCr={errCr}
          known={known}
        />
      )}
    </div>
  )
}
