// Account-ручки полигона (ACCT-01..05, TRAN-01..05). HTTP только через api из client.js
// (граница слоёв фазы 1); ошибки летят parseApiError-объектами из интерцептора —
// никаких try/catch здесь. Форма модуля — как admin.js. Каждая функция после запроса
// делает accountsStore.upsertAccount(...) полями ТОЛЬКО из тела ответа (квирк
// int-каста «1.5» → счёт 1: ввод юзера ≠ то, что вернулось) — side-effect вместо
// onSuccess у useQuery (удалён в react-query v5).

import { api } from './client'
import { accountsStore } from './accountsStore'

// POST /api/account/create → 201 {id, number, balance:0}; тело запроса не требуется.
// 409 при 2/2: «User already has maximum number of accounts(2)».
export async function createAccount() {
  const { data } = await api.post('/account/create')
  accountsStore.upsertAccount({ id: data.id, number: data.number, balance: data.balance })
  return data
}

// POST /api/account/deposit {accountId, amount} → 200 {id, balance} — БЕЗ number,
// upsert частичный (merge в store сохраняет номер). Суммы слать ЧИСЛОМ или null:
// строка даёт 400 «This value should be of type float|null.» (Pitfall 5).
export async function deposit(accountId, amount) {
  const { data } = await api.post('/account/deposit', { accountId, amount })
  accountsStore.upsertAccount({ id: data.id, balance: data.balance })
  return data
}

// POST /api/account/transfer {fromAccountId, toAccountId, amount} →
// 200 {fromAccountId, toAccountId, fromAccountIdBalance} — баланса ПОЛУЧАТЕЛЯ нет,
// добор — отдельным fetchTransactions в мутации (план 03-02).
export async function transfer(fromAccountId, toAccountId, amount) {
  const { data } = await api.post('/account/transfer', { fromAccountId, toAccountId, amount })
  accountsStore.upsertAccount({ id: data.fromAccountId, balance: data.fromAccountIdBalance })
  return data
}

// GET /api/account/transactions/{id} → 200 {id, number, balance, transactions[]}.
// Тройное назначение: queryFn истории + «проба владения» для «Добавить по ID»
// (404 «Account N not found or does not belong to userId M» — чужой и несуществующий
// неотличимы) + добор баланса получателя после перевода.
// encodeURIComponent: сырой ввод юзера остаётся ОДНИМ сегментом пути (мягкая валидация
// шлёт как есть; 'abc' → живой 500-HTML полигона — это ок, но '1/../x' путь не переписывает).
export async function fetchTransactions(id) {
  const { data } = await api.get(`/account/transactions/${encodeURIComponent(String(id).trim())}`)
  accountsStore.upsertAccount({ id: data.id, number: data.number, balance: data.balance })
  return data
}
