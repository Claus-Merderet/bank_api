// Подписка React-компонентов на реестр известных счетов (accountsStore):
// карточки, опции селектов, сайдбар «Мои счета», плитка «N из 2» читают один снапшот.
// Аналог useBusy — тот же паттерн useSyncExternalStore.

import { useSyncExternalStore } from 'react'
import { accountsStore } from '../api/accountsStore'

export function useAccounts() {
  return useSyncExternalStore(accountsStore.subscribe, accountsStore.getSnapshot)
}
