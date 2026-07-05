// Реестр известных счетов (адаптация аномалии №1: API не отдаёт список счетов —
// приложение помнит только те, что видело в ответах ручек). Модуль-store вне React
// по паттерну busy.js, доставка в компоненты через useSyncExternalStore
// (src/hooks/useAccounts.js). Персист в localStorage под ключом sb.accounts.<username>:
// id пользователя фронту недоступен (ответ логина — {username, role}, в JWT-payload
// только username) — username и есть единственный реализуемый дискриминатор.
// Реестр переживает релогин (locked decision): reset() чистит ТОЛЬКО память,
// localStorage остаётся per-user.

let accounts = [] // стабильная ссылка — меняется ТОЛЬКО в hydrate/upsert/reset (Pitfall 1)
let currentKey = null // 'sb.accounts.<username>' | null
const listeners = new Set()
const notify = () => listeners.forEach((l) => l())
const persist = () => {
  if (!currentKey) return
  try {
    localStorage.setItem(currentKey, JSON.stringify(accounts))
  } catch {
    // quota/приватный режим — реестр продолжает жить в памяти
  }
}

export const accountsStore = {
  // Гидрация при входе/смене пользователя: битый JSON или не-массив → пустой реестр.
  // Вход недоверенный (тестировщики правят localStorage руками) — элементы с битой
  // формой отбрасываются поштучно, не роняя реестр: без фильтра запись вида [{"id":1}]
  // крашит рендер (numFmt(undefined) → TypeError) без ErrorBoundary в дереве
  hydrate(username) {
    currentKey = `sb.accounts.${username}`
    try {
      accounts = JSON.parse(localStorage.getItem(currentKey)) ?? []
    } catch {
      accounts = []
    }
    if (!Array.isArray(accounts)) accounts = []
    accounts = accounts.filter(
      (a) =>
        a &&
        typeof a === 'object' &&
        Number.isFinite(a.id) &&
        typeof a.number === 'string' &&
        Number.isFinite(a.balance)
    )
    notify()
  },
  // Единая точка обновления из ответов create/deposit/transfer/GET transactions.
  // partial {id, balance} из deposit/transfer НЕ содержит number — merge-семантика
  // {...a, ...partial} сохраняет старые поля (Pitfall 3). Всегда НОВЫЙ массив.
  upsertAccount(partial) {
    const i = accounts.findIndex((a) => a.id === partial.id)
    accounts = i === -1
      ? [...accounts, partial]
      : accounts.map((a, j) => (j === i ? { ...a, ...partial } : a))
    persist()
    notify()
  },
  has(id) {
    return accounts.some((a) => a.id === id)
  },
  // logout/смена юзера: память чистится, localStorage НЕ трогаем (реестр переживает релогин)
  reset() {
    accounts = []
    currentKey = null
    notify()
  },
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  getSnapshot() {
    return accounts // ТОЛЬКО текущая ссылка — без .map/.filter/localStorage (Pitfall 1)
  },
}
