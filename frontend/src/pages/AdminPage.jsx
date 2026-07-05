// Админка целиком (ADMN-01..04, D-02, D-04, D-12): каркас как у DashboardPage
// (контейнер 1280 + Topbar), единственный таб «Пользователи» (D-02),
// заголовок «01/ Управление пользователями» + подпись (:550–553), две панели (:555–637):
// форма создания с правилами у полей (ADMN-03, мягкая валидация D-12 — контролируемые
// useState-инпуты, запрос слать всегда, react-hook-form НЕ используется) и таблица
// пользователей на react-query (useQuery ['admin','users'], объектный синтаксис v5).
// Ошибки: errAdminCreate (форма) и errAdmin (панель) — по одному блоку на форму,
// новая операция перезаписывает свою; ошибка запроса списка показывается в той же
// панели (fallback на usersQuery.error). Тексты бэкенда — дословно (ErrorBlock).

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../api/admin'
import { useBusy } from '../hooks/useBusy'
import { Topbar } from '../components/layout/Topbar'
import { Tabs } from '../components/ui/Tabs'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { ErrorBlock } from '../components/ui/ErrorBlock'

// Лейбл секции панели (:558, :595): mono 11px 700, ls 2px, uppercase
const sectionLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: '#7d7d9c',
}

export default function AdminPage() {
  const busy = useBusy()

  // Контролируемые поля формы (D-12): значения уходят на бэкенд КАК ЕСТЬ
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('ROLE_USER')

  // Словарь ошибок: один блок на форму (Shared Pattern)
  const [errAdminCreate, setErrAdminCreate] = useState(null)
  const [errAdmin, setErrAdmin] = useState(null)

  // Список пользователей (D-04): объектный синтаксис v5 (Pitfall 4)
  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: getUsers })
  const users = usersQuery.data ?? []

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
        <Tabs tabs={[{ key: 'users', label: 'Пользователи' }]} active="users" onChange={() => {}} />

        <div style={{ animation: 'fadeUp .35s ease' }}>
          {/* Заголовок «01/ Управление пользователями» + подпись (:550–553) */}
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
              Управление пользователями
            </h2>
            <div style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#62627e' }}>
              банковские операции админу запрещены
            </div>
          </div>

          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Панель формы «Новый пользователь» (:557–591) */}
            <Card style={{ flex: '1 1 340px', maxWidth: '440px' }}>
              <div style={{ ...sectionLabel, marginBottom: '16px' }}>Новый пользователь</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Input
                  label="Логин"
                  placeholder="user1"
                  hint="латиница и цифры, 3–15 символов, без спецсимволов"
                  compact
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  label="Пароль"
                  placeholder="User1Pass!"
                  hint="минимум 8 символов · 1 заглавная · 1 строчная · 1 цифра · 1 спецсимвол"
                  compact
                  mono
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Select label="Роль" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="ROLE_USER">ROLE_USER — обычный пользователь</option>
                  <option value="ROLE_ADMIN">ROLE_ADMIN — администратор</option>
                  <option value="ROLE_CREDIT_SECRET">ROLE_CREDIT_SECRET — кредитный</option>
                </Select>
                <Button
                  type="button"
                  disabled={busy}
                  style={{ borderRadius: '12px', padding: '13px 24px', fontSize: '14px' }}
                >
                  Создать пользователя
                </Button>
              </div>
              <ErrorBlock error={errAdminCreate} />
            </Card>

            {/* Панель таблицы «Пользователи» (:593–636): без внутреннего padding */}
            <Card style={{ flex: '2 1 460px', padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 22px 0' }}>
                <div style={sectionLabel}>Пользователи</div>
                {/* Pill-счётчик (:596): проценты фона/бордера 8%/30% */}
                <Badge
                  color="var(--a2b)"
                  bgMix={8}
                  borderMix={30}
                  style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: 'normal', padding: '3px 10px' }}
                >
                  {users.length} записей
                </Badge>
              </div>

              {/* errAdmin: ошибки мутаций панели, fallback — ошибка запроса списка */}
              <div style={{ margin: '0 22px' }}>
                <ErrorBlock error={errAdmin ?? usersQuery.error} />
              </div>

              <Table
                columns={['ID', 'Логин', 'Роль', { label: '', align: 'right' }]}
                style={{ marginTop: '6px' }}
              >
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', color: '#7d7d9c' }}>
                      {u.id}
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '13.5px' }}>{u.username}</td>
                    <td>
                      <Badge role={u.role}>{u.role}</Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        type="button"
                        variant="danger-ghost"
                        disabled={busy}
                        style={{ padding: '7px 14px', fontSize: '12.5px' }}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>

              {/* Футер панели (:633–636): dashed top-border */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  padding: '16px 22px',
                  borderTop: '1px dashed rgba(255,255,255,.09)',
                  marginTop: '4px',
                }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#565672' }}>
                  сброс полигона · удаляет всех, кроме вас
                </div>
                <Button
                  type="button"
                  variant="danger-ghost"
                  disabled={busy}
                  style={{ marginLeft: 'auto', padding: '8px 14px', fontSize: '12.5px' }}
                >
                  Удалить всех пользователей
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
