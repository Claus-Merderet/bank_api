// Каркас кабинета SCAM BANK (UIEL-09, D-02): контейнер 1280 (макет :133–134),
// Topbar, табы локальным useState БЕЗ URL (D-02), секция активного таба с fadeUp .35s.
// Таб «Кредиты» — только при user.role === 'ROLE_CREDIT_SECRET' (строгое ===,
// Shared Pattern; скрытие таба — UX-гвард, enforcement на бэкенде, T-02-09).
// Наполнение секций (карточки, формы, таблицы) — граница фазы 3; визуал каркаса финальный.

import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Topbar } from '../components/layout/Topbar'
import { Tabs } from '../components/ui/Tabs'

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

  // Список табов зависит от роли (макет :1145–1148)
  const tabs = [
    { key: 'accounts', label: 'Счета' },
    { key: 'transfers', label: 'Переводы' },
    { key: 'history', label: 'История' },
  ]
  if (user?.role === 'ROLE_CREDIT_SECRET') {
    tabs.push({ key: 'credits', label: 'Кредиты' })
  }

  // Именованный обработчик: в фазе 3 дополнительно сбросит «Счёт создан успешно!»
  // при переключении таба (поведение макета :1153, D-02)
  const handleTabChange = (key) => {
    setTab(key)
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
        {/* key={tab} перезапускает fadeUp при каждом переключении (макет :164) */}
        <div key={tab} style={{ animation: 'fadeUp .35s ease' }}>
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
          {/* Контент секции — фаза 3 (CONTEXT §Phase Boundary): между заголовком и футером пусто */}
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
