// Каркас кабинета SCAM BANK (UIEL-09, D-02): контейнер 1280 (макет :133–134),
// Topbar, табы локальным useState БЕЗ URL (D-02), секция активного таба с fadeUp .35s.
// Таб «Кредиты» — только при user.role === 'ROLE_CREDIT_SECRET' (строгое ===,
// Shared Pattern; скрытие таба — UX-гвард, enforcement на бэкенде, T-02-09).
// Фаза 3: lifted state межэкранной связки (depAcc/histAcc/accCreatedMsg — CONTEXT
// §«Межэкранная связка кабинета»), гидрация реестра счетов по user.username
// (Pitfall 4: cleanup reset при смене юзера), prefill селектов первым известным
// счётом (правила макета prefillFor :869–880). Секция «Счета» — AccountsSection,
// «Переводы» — TransfersSection; history — план 03-03, credits — фаза 4 (h2-заглушки).

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { accountsStore } from '../api/accountsStore'
import { Topbar } from '../components/layout/Topbar'
import { Tabs } from '../components/ui/Tabs'
import { AccountsSection } from '../components/dashboard/AccountsSection'
import { TransfersSection } from '../components/dashboard/TransfersSection'

// Заголовки секций макета: mono-префикс «NN/» цвета --a2b + Unbounded-заголовок (:166)
const sections = {
  accounts: { num: '01/', title: 'Счета' },
  transfers: { num: '02/', title: 'Переводы' },
  history: { num: '03/', title: 'История операций' },
  credits: { num: '04/', title: 'Кредиты' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('accounts')

  // Lifted state межэкранной связки (CONTEXT locked decision):
  // depAcc/histAcc — предвыбор счёта в селектах ('' — не выбран), accCreatedMsg —
  // «✓ Счёт создан успешно!» на 6000 мс (UIEL-03), таймер в ref (Pitfall 8)
  const [depAcc, setDepAcc] = useState('')
  const [histAcc, setHistAcc] = useState('')
  const [accCreatedMsg, setAccCreatedMsg] = useState(false)
  const msgTimerRef = useRef(null)

  // Гидрация реестра по пользователю + prefill (RESEARCH §Pattern 5):
  // hydrate идемпотентен (StrictMode-safe), cleanup чистит память при
  // logout/смене юзера — localStorage остаётся per-username
  useEffect(() => {
    if (!user?.username) return undefined
    accountsStore.hydrate(user.username)
    const known = accountsStore.getSnapshot()
    const first = known.length ? String(known[0].id) : ''
    setDepAcc(first)
    setHistAcc(first)
    return () => accountsStore.reset()
  }, [user?.username])

  // Таймер сообщения не должен стрелять после ухода со страницы
  useEffect(() => () => clearTimeout(msgTimerRef.current), [])

  // Список табов зависит от роли (макет :1145–1148)
  const tabs = [
    { key: 'accounts', label: 'Счета' },
    { key: 'transfers', label: 'Переводы' },
    { key: 'history', label: 'История' },
  ]
  if (user?.role === 'ROLE_CREDIT_SECRET') {
    tabs.push({ key: 'credits', label: 'Кредиты' })
  }

  // Переключение таба гасит «✓ Счёт создан успешно!» синхронно (макет :1153)
  const handleTabChange = (key) => {
    setTab(key)
    setAccCreatedMsg(false)
  }

  // Постусловия создания счёта (макет :918–925): показать сообщение на 6000 мс
  // (clearTimeout перед новым показом — Pitfall 8: два быстрых создания), при
  // создании ПЕРВОГО счёта (wasEmpty) прописать его id в селекты-предвыборы (:921)
  const handleCreated = (data, wasEmpty) => {
    clearTimeout(msgTimerRef.current)
    setAccCreatedMsg(true)
    msgTimerRef.current = setTimeout(() => setAccCreatedMsg(false), 6000)
    if (wasEmpty) {
      setDepAcc(String(data.id))
      setHistAcc(String(data.id))
    }
  }

  // «История» с карточки счёта: предвыбор + переход на таб (макет :1140)
  const handleGoHistory = (id) => {
    setHistAcc(String(id))
    setTab('history')
  }

  const section = sections[tab]

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'clip' }}>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(14px,2.5vw,26px) clamp(14px,3vw,36px) 70px',
        }}
      >
        <Topbar />
        <Tabs tabs={tabs} active={tab} onChange={handleTabChange} />
        {/* key={tab} перезапускает fadeUp при каждом переключении (макет :164).
            Перемонтирование секций сбрасывает их локальные поля форм (суммы, addId) —
            принятое отклонение от макета (Pitfall 9, решение планировщика №1):
            prefill селектов восстанавливается инициализаторами секций. */}
        <div key={tab} style={{ animation: 'fadeUp .35s ease' }}>
          {tab === 'accounts' ? (
            <AccountsSection
              depAcc={depAcc}
              setDepAcc={setDepAcc}
              accCreatedMsg={accCreatedMsg}
              onCreated={handleCreated}
              onGoHistory={handleGoHistory}
            />
          ) : tab === 'transfers' ? (
            /* Секция читает реестр сама (useAccounts) — пропсы не нужны */
            <TransfersSection />
          ) : (
            /* h2-заглушка ещё не реализованных табов (history — план 03-03,
               credits — фаза 4); наполнение секций придёт со своими шапками */
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
                  {section.num}
                </span>
                {section.title}
              </h2>
            </div>
          )}
          {/* Футер под секциями (макет :269) */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '44px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10.5px',
              letterSpacing: '.5px',
              color: '#3f3f56',
            }}
          >
            {/* NBSP после названия — escape-последовательностью \u00A0, конвенция 02-01 (макет :269) */}
            SCAM BANK{'\u00A0'}
            <br />
            <br />
          </div>
        </div>
      </div>
    </div>
  )
}
