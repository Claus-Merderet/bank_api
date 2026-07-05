// Админка целиком (ADMN-01..04, D-02, D-04, D-12): каркас как у DashboardPage
// (контейнер 1280 + Topbar), единственный таб «Пользователи» (D-02),
// заголовок «01/ Управление пользователями» + подпись (:550–553), две панели (:555–637):
// форма создания с правилами у полей (ADMN-03, мягкая валидация D-12 — контролируемые
// useState-инпуты, запрос слать всегда, react-hook-form НЕ используется) и таблица
// пользователей на react-query (useQuery ['admin','users'], объектный синтаксис v5).
// Мутации create/deleteOne/deleteAll инвалидируют ['admin','users'] в onSuccess (D-04);
// модалки подтверждения закрываются ДО результата (поведение макета :1078); клик по
// оверлею НЕ закрывает. Тело ответа /admin/create содержит хэш пароля — НЕ рендерится
// и НЕ логируется (Pitfall 8, T-02-13): в тосте только username/role/id.
// Ошибки: errAdminCreate (форма) и errAdmin (панель) — по одному блоку на форму,
// новая операция перезаписывает свою; ошибка запроса списка показывается в той же
// панели (fallback на usersQuery.error). Тексты бэкенда — дословно (ErrorBlock).

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteAllUsers, deleteUser, getUsers } from '../api/admin'
import { useAuth } from '../auth/AuthContext'
import { useBusy } from '../hooks/useBusy'
import { Topbar } from '../components/layout/Topbar'
import { Tabs } from '../components/ui/Tabs'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { ErrorBlock } from '../components/ui/ErrorBlock'
import { useToast } from '../components/ui/ToastProvider'

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
  const push = useToast()
  const queryClient = useQueryClient()
  const { user: me } = useAuth()

  // Контролируемые поля формы (D-12): значения уходят на бэкенд КАК ЕСТЬ
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('ROLE_USER')

  // Словарь ошибок: один блок на форму (Shared Pattern)
  const [errAdminCreate, setErrAdminCreate] = useState(null)
  const [errAdmin, setErrAdmin] = useState(null)

  // Модалки: null | {type:'delUser', user} | {type:'delAll'}
  const [modal, setModal] = useState(null)

  // Список пользователей (D-04): объектный синтаксис v5 (Pitfall 4)
  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: getUsers })
  const users = usersQuery.data ?? []

  // Счётчик модалки «Сбросить полигон?» — без текущего админа (макет :1252:
  // delAllCount фильтрует me по id); в user из AuthContext нет id (login
  // возвращает {username, role}), поэтому фильтр по username
  const delAllCount = users.filter((u) => u.username !== me?.username).length

  // Создание (ADMN-02): тело ответа содержит хэш пароля — в тост идут только
  // username/role из отправленной формы и id из ответа (Pitfall 8)
  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setUsername('')
      setPassword('')
      setRole('ROLE_USER')
      push('success', 'Пользователь создан', `${vars.username} · ${vars.role} · id ${data.id}`)
    },
    onError: (e) => setErrAdminCreate(e),
  })

  // Удаление одного (ADMN-04): ошибка «Cannot delete your own account» — дословно в errAdmin
  const delMut = useMutation({
    mutationFn: (u) => deleteUser(u.id),
    onSuccess: (data, u) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      push('success', 'Пользователь удалён', `${u.username} · id ${u.id} · счета и история остались в базе`)
    },
    onError: (e) => setErrAdmin(e),
  })

  // Сброс полигона: deleted_count строго из тела живого ответа (DESIGN-INTAKE §4)
  const delAllMut = useMutation({
    mutationFn: deleteAllUsers,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      push('success', 'Полигон сброшен', `deleted_count: ${data.deleted_count}`)
    },
    onError: (e) => setErrAdmin(e),
  })

  // Мягкая валидация (D-12): никаких локальных проверок формата — даже пустые
  // поля уходят на бэкенд, полигон отвечает живыми ошибками
  const handleCreate = (e) => {
    e.preventDefault()
    setErrAdminCreate(null)
    createMut.mutate({ username, password, role })
  }

  // Подтверждения: модалка закрывается СРАЗУ, до результата (поведение макета :1078)
  const confirmDelUser = () => {
    const u = modal.user
    setModal(null)
    setErrAdmin(null)
    delMut.mutate(u)
  }

  const confirmDelAll = () => {
    setModal(null)
    setErrAdmin(null)
    delAllMut.mutate()
  }

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
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                  type="submit"
                  disabled={busy}
                  style={{ borderRadius: '12px', padding: '13px 24px', fontSize: '14px' }}
                >
                  Создать пользователя
                </Button>
              </form>
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
                        onClick={() => setModal({ type: 'delUser', user: u })}
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
                  onClick={() => setModal({ type: 'delAll' })}
                >
                  Удалить всех пользователей
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Модалка удаления пользователя (:710–723): белый бордер + красный glow */}
      {modal?.type === 'delUser' && (
        <Modal
          title="Удалить пользователя?"
          onClose={() => setModal(null)}
          glow="0 0 80px -40px rgba(251,113,133,.5)"
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                style={{ borderRadius: '12px', padding: '11px 18px', fontSize: '13.5px' }}
                onClick={() => setModal(null)}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                style={{ padding: '11px 22px' }}
                onClick={confirmDelUser}
              >
                Удалить
              </Button>
            </>
          }
        >
          <div style={{ fontSize: '14px', color: '#c9c9e2', marginBottom: '8px' }}>
            Пользователь{' '}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#fb7185' }}>
              {modal.user.username} (id {modal.user.id})
            </span>{' '}
            будет удалён.
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: '#62627e',
              marginBottom: '20px',
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.7,
            }}
          >
            удаление «мягкое»: счета, история и кредиты останутся в базе
          </div>
        </Modal>
      )}

      {/* Модалка сброса полигона (:725–738): danger — красноватые бордер/glow/заголовок */}
      {modal?.type === 'delAll' && (
        <Modal
          title="Сбросить полигон?"
          onClose={() => setModal(null)}
          danger
          width={460}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                style={{ borderRadius: '12px', padding: '11px 18px', fontSize: '13.5px' }}
                onClick={() => setModal(null)}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                style={{ padding: '11px 22px' }}
                onClick={confirmDelAll}
              >
                Удалить всех
              </Button>
            </>
          }
        >
          <div style={{ fontSize: '14px', color: '#c9c9e2', marginBottom: '8px' }}>
            Будут удалены{' '}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{delAllCount}</span> — все
            пользователи, кроме вас. Операция массовая и необратимая.
          </div>
          <div style={{ fontSize: '12.5px', color: '#62627e', marginBottom: '20px', fontFamily: "'JetBrains Mono', monospace" }}>
            DELETE /api/admin/users
          </div>
        </Modal>
      )}
    </div>
  )
}
