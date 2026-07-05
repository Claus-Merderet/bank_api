// Секция «Переводы» целиком (TRAN-01..04, CORE-03, ACCT-05; макет :272–383).
// Форма двух режимов через Radio (UIEL-02): own — Select «Счёт зачисления»,
// other — Input «ID счёта получателя»; переключение мгновенное, без анимации.
// Мутация transfer (RESEARCH §Pattern 4): баланс отправителя обновляет upsert
// внутри transfer(); баланс получателя добирается фоновым GET transactions ТОЛЬКО
// если счёт известен реестру, ошибка добора глотается .catch — у фонового
// обогащения нет своей формы ошибок (Pitfall 10). Мягкая валидация (CORE-03):
// запрос уходит всегда — числа через parseNum, пустые поля → null (живой
// multi-line 400 построчно с «▸»); submit disabled только при busy.
// Тексты ошибок бэкенда — ТОЛЬКО дословно через ErrorBlock, локальных литералов
// ошибок в JSX нет (Pitfall 6: симуляция макета врёт, истина — живой бэкенд).
// Сайдбар «Мои счета» — локальный подкомпонент (locked decision CONTEXT
// §«Новые компоненты»: НЕ в ui/), читает тот же реестр — балансы синхронны
// с карточками счетов. trFrom/trTo — инициализаторы из снапшота реестра
// (первый/второй известный): key={tab} в DashboardPage перемонтирует секцию,
// инициализаторы воспроизводят prefill макета (:869–880) при каждом входе на таб.

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTransactions, transfer } from '../../api/accounts'
import { accountsStore } from '../../api/accountsStore'
import { useAccounts } from '../../hooks/useAccounts'
import { useBusy } from '../../hooks/useBusy'
import { money, numFmt, parseNum } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ErrorBlock } from '../ui/ErrorBlock'
import { Input } from '../ui/Input'
import { Radio } from '../ui/Radio'
import { Select } from '../ui/Select'
import { useToast } from '../ui/ToastProvider'

// Лейбл панели (Shared Pattern, AdminPage :33–40): mono 11px 700, ls 2px, uppercase
const sectionLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: '#7d7d9c',
}

// Сайдбар «Мои счета» (макет :365–380) — локальный подкомпонент секции, НЕ в ui/.
// Читает known из того же реестра, что и форма/карточки — балансы живые без F5
function MyAccountsSidebar({ known }) {
  return (
    <Card style={{ flex: '1 1 260px', maxWidth: '340px', padding: '20px 22px' }}>
      <div style={{ ...sectionLabel, marginBottom: '14px' }}>Мои счета</div>
      {known.length === 0 && <div style={{ fontSize: '13px', color: '#62627e' }}>Известных счетов нет</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {known.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.07)',
            }}
          >
            {/* Pill «ID N» (:373): циановая схема Badge, паддинг макета 3px 8px */}
            <Badge
              color="var(--a2b)"
              bgMix={9}
              borderMix={30}
              style={{ padding: '3px 8px', letterSpacing: 'normal', flex: 'none' }}
            >
              ID {m.id}
            </Badge>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#9b9bb4' }}>
              {numFmt(m.number)}
            </div>
            <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap' }}>
              {money(m.balance)}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: '14px',
          fontSize: '11.5px',
          lineHeight: 1.6,
          color: '#62627e',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        для перевода другому пользователю нужен внутренний ID его счёта
      </div>
    </Card>
  )
}

export function TransfersSection() {
  const known = useAccounts()
  const busy = useBusy()
  const push = useToast()
  const queryClient = useQueryClient()

  // Режим перевода: own — между своими (дефолт макета), other — по ID счёта
  const [trMode, setTrMode] = useState('own')
  // Prefill из снапшота реестра (RESEARCH §Pattern 5): списание — первый известный,
  // зачисление — второй, если есть (макет prefillFor: second || first)
  const [trFrom, setTrFrom] = useState(() => {
    const k = accountsStore.getSnapshot()
    return k.length ? String(k[0].id) : ''
  })
  const [trTo, setTrTo] = useState(() => {
    const k = accountsStore.getSnapshot()
    return k.length ? String((k[1] ?? k[0]).id) : ''
  })
  const [trToId, setTrToId] = useState('')
  const [trAmount, setTrAmount] = useState('')
  const [errTr, setErrTr] = useState(null)

  // Мутация transfer (RESEARCH §Pattern 4): тост — только из тела ответа
  // (fromAccountIdBalance — остаток отправителя); баланс отправителя уже в реестре
  // (upsert внутри transfer()); добор баланса получателя — фоном, ошибки глотаются
  const transferMut = useMutation({
    mutationFn: ({ from, to, amount }) => transfer(from, to, amount),
    onSuccess: (data) => {
      push(
        'success',
        'Перевод выполнен',
        `ID ${data.fromAccountId} → ID ${data.toAccountId} · остаток: ${data.fromAccountIdBalance}`,
      )
      setTrAmount('')
      if (accountsStore.has(data.toAccountId)) fetchTransactions(data.toAccountId).catch(() => {})
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (e) => setErrTr(e),
  })

  // Мягкая валидация (CORE-03): mutate ВСЕГДА — числа через parseNum,
  // пустое → null (живой multi-line 400 построчно)
  const handleTransfer = (e) => {
    e.preventDefault()
    setErrTr(null)
    const from = trFrom === '' ? null : Number(trFrom)
    const to =
      trMode === 'own'
        ? trTo === ''
          ? null
          : Number(trTo)
        : trToId.trim() === ''
          ? null
          : Number(trToId)
    const parsed = parseNum(trAmount)
    const amount = Number.isNaN(parsed) ? null : parsed
    transferMut.mutate({ from, to, amount })
  }

  return (
    <div>
      {/* Шапка секции (:275–277) */}
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
            02/
          </span>
          Переводы
        </h2>
      </div>

      {/* Двухпанельный лэйаут (:279): форма + сайдбар */}
      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Card style={{ flex: '1 1 480px' }}>
          {/* Радиогруппа «Тип перевода» (UIEL-02): переключение мгновенно меняет
              поле получателя select ↔ input, без анимации */}
          <Radio
            ariaLabel="Тип перевода"
            value={trMode}
            onChange={setTrMode}
            options={[
              { value: 'own', title: 'Между своими', caption: 'оба счёта — ваши' },
              { value: 'other', title: 'Другому пользователю', caption: 'получатель — по ID счёта' },
            ]}
          />

          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select
              label="Счёт списания"
              value={trFrom}
              onChange={(e) => setTrFrom(e.target.value)}
              style={{ fontSize: '13.5px' }}
            >
              <option value="">— выберите счёт —</option>
              {known.map((a) => (
                <option key={a.id} value={a.id}>{`ID ${a.id} · ${a.number} · ${money(a.balance)}`}</option>
              ))}
            </Select>

            {trMode === 'own' ? (
              <Select
                label="Счёт зачисления"
                value={trTo}
                onChange={(e) => setTrTo(e.target.value)}
                style={{ fontSize: '13.5px' }}
              >
                <option value="">— выберите счёт —</option>
                {known.map((a) => (
                  <option key={a.id} value={a.id}>{`ID ${a.id} · ${a.number} · ${money(a.balance)}`}</option>
                ))}
              </Select>
            ) : (
              <Input
                label="ID счёта получателя"
                compact
                mono
                placeholder="например, 2"
                inputMode="numeric"
                value={trToId}
                onChange={(e) => setTrToId(e.target.value)}
                hint="внутренний ID счёта, не 7-значный номер карты"
              />
            )}

            <Input
              label="Сумма"
              compact
              mono
              placeholder="500 – 10000"
              inputMode="decimal"
              value={trAmount}
              onChange={(e) => setTrAmount(e.target.value)}
              hint="лимит 500–10000 ₽ за раз"
            />

            <Button
              type="submit"
              disabled={busy}
              style={{
                alignSelf: 'flex-start',
                borderRadius: '12px',
                padding: '13px 28px',
                fontSize: '14px',
                boxShadow: '0 10px 30px -8px color-mix(in srgb, var(--a1) 55%, transparent)',
              }}
            >
              Перевести
            </Button>
          </form>

          {/* errTr (:353–362): дефолтный margin-top 16 ErrorBlock, тексты дословно */}
          <ErrorBlock error={errTr} />
        </Card>

        <MyAccountsSidebar known={known} />
      </div>
    </div>
  )
}
