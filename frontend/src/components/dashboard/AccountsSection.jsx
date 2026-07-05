// Секция «Счета» целиком (ACCT-01..05, UIEL-03, UIEL-05, UIEL-06, CORE-03; макет :162–270).
// Шапка с h2 живёт здесь (решение планировщика №2: строка шапки макета содержит
// h2 + «✓ Счёт создан успешно!» + контролы «Добавить по ID» одним flex-рядом :165–173,
// а state addId/errAcc — секционный). Реестр счетов читается из accountsStore
// (один снапшот для карточек, плитки «N из 2» и опций селекта). Плитка при 2 счетах —
// отдельный div с cursor:not-allowed, НЕ disabled-кнопка (UIEL-06, макет :226–232).
// Мягкая валидация (CORE-03): пустые/невалидные значения уходят на бэкенд как
// null/число, никаких локальных проверок лимитов/формата; единственный ранний
// return — повтор известного ID (success-тост без запроса, макет :938).
// Ошибки раздельные: errAcc (создание + добавление по ID), errDep (депозит) —
// тексты бэкенда дословно через ErrorBlock, включая HTML-квирки полигона.

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAccount, deposit, fetchTransactions } from '../../api/accounts'
import { accountsStore } from '../../api/accountsStore'
import { useAccounts } from '../../hooks/useAccounts'
import { useBusy } from '../../hooks/useBusy'
import { money, parseNum } from '../../lib/format'
import { AccountCard } from '../ui/AccountCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ErrorBlock } from '../ui/ErrorBlock'
import { Input } from '../ui/Input'
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

export function AccountsSection({ depAcc, setDepAcc, accCreatedMsg, onCreated, onGoHistory }) {
  const known = useAccounts()
  const busy = useBusy()
  const push = useToast()
  const queryClient = useQueryClient()

  // Контролируемые поля (мягкая валидация: значения уходят на бэкенд как есть)
  const [addId, setAddId] = useState('')
  const [depAmount, setDepAmount] = useState('')

  // Словарь ошибок: errAcc — создание счёта + «Добавить по ID», errDep — депозит
  const [errAcc, setErrAcc] = useState(null)
  const [errDep, setErrDep] = useState(null)

  // hover активной плитки «Открыть счёт» (:220 style-hover)
  const [tileHover, setTileHover] = useState(false)

  // Якорь панели депозита для плавного скролла по «Пополнить» с карточки
  const depFormRef = useRef(null)

  // Создание счёта (ACCT-02): wasEmpty захватывается в обработчике ДО мутации и
  // едет через variables — постусловие макета :921 (первый счёт прописывается в селекты)
  const createMut = useMutation({
    mutationFn: () => createAccount(),
    onSuccess: (data, wasEmpty) => {
      // upsert в реестр уже сделан внутри createAccount()
      onCreated(data, wasEmpty)
    },
    onError: (e) => setErrAcc(e),
  })

  const handleCreate = () => {
    setErrAcc(null)
    createMut.mutate(known.length === 0)
  }

  // «+ Добавить по ID» — проба владения через GET transactions (RESEARCH §Pattern 6).
  // Данные тоста — ТОЛЬКО из тела ответа (квирк int-каста «1.5» → счёт 1: ввод
  // юзера ≠ возврат). Ошибки — errAcc дословно: 404 «Account N not found or does
  // not belong to userId M»; мусорный ввод даёт HTML-квирки полигона («Ошибка 500»/
  // «Ошибка 404» от parseApiError) — ничего не чиним и не валидируем локально (Pitfall 7)
  const addMut = useMutation({
    mutationFn: () => fetchTransactions(addId),
    onSuccess: (data) => {
      setAddId('')
      push('success', 'Счёт добавлен', `ID ${data.id} · номер ${data.number} · баланс ${data.balance}`)
    },
    onError: (e) => setErrAcc(e),
  })

  const handleAdd = () => {
    setErrAcc(null) // до ранней ветки — как clearErr('acc') в макете (:938): новая операция формы перезаписывает свою ошибку
    // Повтор уже известного — success-тост из ЗАПИСИ РЕЕСТРА, запрос не летит (макет :938)
    const rec = known.find((a) => a.id === Number(addId))
    if (accountsStore.has(Number(addId)) && rec) {
      push('success', 'Счёт уже добавлен', `ID ${rec.id} · номер ${rec.number}`)
      setAddId('')
      return
    }
    addMut.mutate()
  }

  // Депозит (ACCT-04/05): суммы ЧИСЛОМ или null (строка даёт чужой 400 про float —
  // Pitfall 5); null-поля дают живой multi-line 400 построчно с «▸». В тосте id из
  // тела ответа и vars.amount — фактически отправленное число. Баланс карточки
  // обновляется сам (upsert внутри deposit()); история в кэше устарела — инвалидация
  const depositMut = useMutation({
    mutationFn: ({ accountId, amount }) => deposit(accountId, amount),
    onSuccess: (data, vars) => {
      push('success', 'Депозит зачислен', `+${vars.amount} на счёт ID ${data.id}`)
      setDepAmount('')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (e) => setErrDep(e),
  })

  // Мягкая валидация (CORE-03): никаких ранних return по значению полей — mutate всегда
  const handleDeposit = (e) => {
    e.preventDefault()
    setErrDep(null)
    const accountId = depAcc === '' ? null : Number(depAcc)
    const parsed = parseNum(depAmount)
    const amount = Number.isNaN(parsed) ? null : parsed
    depositMut.mutate({ accountId, amount })
  }

  return (
    <div>
      {/* Шапка секции (:165–173): h2 + условный «✓ Счёт создан успешно!» */}
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
            01/
          </span>
          Счета
        </h2>
        {accCreatedMsg && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#34d399',
              textShadow: '0 0 18px rgba(52,211,153,.6)',
              animation: 'fadeUp .3s ease',
            }}
          >
            ✓ Счёт создан успешно!
          </div>
        )}
        {/* «+ Добавить по ID» (:170–173): инпут 104px + secondary-кнопка, hover циан */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            mono
            placeholder="ID счёта"
            inputMode="numeric"
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            style={{ width: '104px', borderRadius: '11px', padding: '9px 12px', fontSize: '12.5px', fontWeight: 400 }}
          />
          <Button
            type="button"
            variant="secondary"
            hoverColor="var(--a2b)"
            disabled={busy}
            onClick={handleAdd}
            style={{ borderRadius: '11px', padding: '9px 14px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
          >
            + Добавить по ID
          </Button>
        </div>
      </div>

      {/* errAcc: создание + добавление по ID (:176–185, margin 0 0 16px) */}
      <ErrorBlock error={errAcc} style={{ margin: '0 0 16px' }} />

      {/* Empty «Счета неизвестны» (:187–193): габариты макета крупнее базового EmptyState */}
      {known.length === 0 && (
        <div
          style={{
            border: '1.5px dashed rgba(255,255,255,.14)',
            borderRadius: '22px',
            background: 'rgba(255,255,255,.015)',
            padding: 'clamp(28px,5vw,48px)',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 16px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '20px',
              color: '#565672',
            }}
          >
            ◇
          </div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: '17px', marginBottom: '8px' }}>
            Счета неизвестны
          </div>
          <div style={{ fontSize: '13.5px', color: '#9b9bb4', maxWidth: '460px', margin: '0 auto 4px' }}>
            API не отдаёт список счетов — приложение помнит только известные ему. Откройте новый счёт или добавьте
            существующий по внутреннему ID.
          </div>
        </div>
      )}

      {/* Грид карточек + плитка создания (:195–233); порядок карточек = порядок реестра */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px,100%), 1fr))',
          gap: '18px',
          marginBottom: '26px',
        }}
      >
        {known.map((a, i) => (
          <AccountCard
            key={a.id}
            account={a}
            index={i}
            onDeposit={() => {
              setDepAcc(String(a.id))
              depFormRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
            onHistory={() => onGoHistory(a.id)}
          />
        ))}

        {known.length < 2 ? (
          // Активная плитка «Открыть счёт» (:220–224)
          <button
            type="button"
            disabled={busy}
            onClick={handleCreate}
            onMouseEnter={() => setTileHover(true)}
            onMouseLeave={() => setTileHover(false)}
            style={{
              border: `1.5px dashed ${tileHover ? 'var(--a2b)' : 'rgba(255,255,255,.18)'}`,
              borderRadius: '22px',
              background: tileHover ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)',
              minHeight: '196px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all .25s',
              color: 'inherit',
            }}
          >
            <span
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--a1b), var(--a2b))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                color: '#070710',
                boxShadow: '0 10px 30px -8px color-mix(in srgb, var(--a1) 60%, transparent)',
              }}
            >
              +
            </span>
            <span style={{ fontWeight: 800, fontSize: '15px' }}>Открыть счёт</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#62627e' }}>
              {known.length} из 2 открыто
            </span>
          </button>
        ) : (
          // Плитка-дизейбл 2/2 (:227–231): отдельный div, НЕ disabled-кнопка (UIEL-06)
          <div
            style={{
              border: '1.5px dashed rgba(255,255,255,.1)',
              borderRadius: '22px',
              background: 'rgba(255,255,255,.012)',
              minHeight: '196px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'not-allowed',
            }}
          >
            <span
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '15px',
                fontWeight: 700,
                color: '#565672',
              }}
            >
              2/2
            </span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#565672' }}>Открыть счёт</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#4a4a62' }}>
              максимум 2 счёта на пользователя
            </span>
          </div>
        )}
      </div>

      {/* Панель «Пополнение счёта» (:235–268): div-обёртка — якорь скролла с карточки */}
      <div ref={depFormRef}>
        <Card style={{ maxWidth: '720px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div style={sectionLabel}>Пополнение счёта</div>
            {/* Лимит-подсказка (:238) — pill, НЕ блокировка отправки (CORE-03) */}
            <Badge
              color="var(--a2b)"
              bgMix={8}
              borderMix={30}
              style={{
                marginLeft: 'auto',
                fontSize: '10.5px',
                fontWeight: 600,
                letterSpacing: 'normal',
                padding: '4px 10px',
              }}
            >
              лимит 1000–9000 ₽ за раз
            </Badge>
          </div>
          <form onSubmit={handleDeposit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px' }}>
              {/* Опции из реестра (UIEL-05): number сырой, money() — из format.js */}
              <Select
                label="Счёт"
                value={depAcc}
                onChange={(e) => setDepAcc(e.target.value)}
                style={{ fontSize: '13.5px' }}
              >
                <option value="">— выберите счёт —</option>
                {known.map((a) => (
                  <option key={a.id} value={a.id}>{`ID ${a.id} · ${a.number} · ${money(a.balance)}`}</option>
                ))}
              </Select>
            </div>
            <div style={{ flex: '1 1 170px' }}>
              <Input
                label="Сумма"
                compact
                mono
                placeholder="1000 – 9000"
                inputMode="decimal"
                value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              style={{
                flex: '0 0 auto',
                borderRadius: '12px',
                padding: '13px 24px',
                fontSize: '14px',
                boxShadow: '0 10px 30px -8px color-mix(in srgb, var(--a1) 55%, transparent)',
              }}
            >
              Пополнить
            </Button>
          </form>
          {/* errDep (:258–267): дефолтный margin-top 16 ErrorBlock */}
          <ErrorBlock error={errDep} />
        </Card>
      </div>
    </div>
  )
}
