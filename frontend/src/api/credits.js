// Credit-ручки полигона (CRED-01..04): /api/credit/{request,repay,history}. HTTP только
// через api из client.js (граница слоёв фазы 1); ошибки летят parseApiError-объектами из
// интерцептора — никаких try/catch здесь. Форма модуля — как accounts.js. requestCredit
// делает upsert счёта ЗАЧИСЛЕНИЯ полями из тела ответа; repayCredit store НЕ трогает (ответ
// баланса не содержит — квирк живого контракта). Кредитные бизнес-ошибки приходят HTTP 404 —
// не судить об успехе по статусу, показывать message дословно (RESEARCH Live Contract).

import { api } from './client'
import { accountsStore } from './accountsStore'

// POST /api/credit/request {accountId, amount, termMonths} →
// 201 {id, amount, termMonths, balance, creditId}. КВИРК: data.id — это accountId счёта
// ЗАЧИСЛЕНИЯ (НЕ creditId!), data.balance — новый баланс ЭТОГО счёта, data.creditId — отдельно.
// Номер счёта в ответе не приходит — merge в store сохранит старый. Суммы слать ЧИСЛОМ.
export async function requestCredit({ accountId, amount, termMonths }) {
  const { data } = await api.post('/credit/request', { accountId, amount, termMonths })
  accountsStore.upsertAccount({ id: data.id, balance: data.balance })
  return data
}

// POST /api/credit/repay {creditId, accountId, amount} → 200 {creditId, amountDeposited}.
// КВИРК: ответ НЕ содержит ни баланса, ни accountId → store НЕ трогаем (upsert физически
// невозможен). Баланс дебетуемого счёта добирает вызывающая мутация (04-02) через
// fetchTransactions(accountId) — как получатель перевода в accounts.js (Pitfall 2).
export async function repayCredit({ creditId, accountId, amount }) {
  const { data } = await api.post('/credit/repay', { creditId, accountId, amount })
  return data
}

// GET /api/credit/history → 200 {userId, credits:[...]}. Долг хранится ОТРИЦАТЕЛЬНЫМ balance
// (-5000 = активный долг 5000; 0 = погашен). Новые сверху (creditId/createdAt desc) уже от
// бэкенда — НЕ пересортировывать. Возвращаем data.credits как есть.
export async function fetchCreditHistory() {
  const { data } = await api.get('/credit/history')
  return data.credits
}
