// Секция «Счета» (ACCT-01..03, UIEL-03, UIEL-06; макет :162–270).
// Шапка с h2 живёт здесь (решение планировщика №2: строка шапки макета содержит
// h2 + «✓ Счёт создан успешно!» + контролы «Добавить по ID» одним flex-рядом :165–173,
// а state addId/errAcc — секционный). Реестр счетов читается из accountsStore
// (один снапшот для карточек, плитки «N из 2» и опций селекта). Плитка при 2 счетах —
// отдельный div с cursor:not-allowed, НЕ disabled-кнопка (UIEL-06, макет :226–232).
// Формы «Пополнение счёта» и «+ Добавить по ID» — Task 3 плана 03-01.

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createAccount } from '../../api/accounts'
import { useAccounts } from '../../hooks/useAccounts'
import { useBusy } from '../../hooks/useBusy'
import { AccountCard } from '../ui/AccountCard'
import { ErrorBlock } from '../ui/ErrorBlock'

export function AccountsSection({ depAcc, setDepAcc, accCreatedMsg, onCreated, onGoHistory }) {
  const known = useAccounts()
  const busy = useBusy()

  // Словарь ошибок: errAcc — создание счёта + «Добавить по ID» (Shared Pattern)
  const [errAcc, setErrAcc] = useState(null)

  // hover активной плитки «Открыть счёт» (:220 style-hover)
  const [tileHover, setTileHover] = useState(false)

  // Якорь формы депозита для плавного скролла по «Пополнить» с карточки (Task 3)
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
    </div>
  )
}
