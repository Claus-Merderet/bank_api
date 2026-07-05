// Подписка React-компонентов на busy-store (D-03): true, пока хотя бы один запрос в полёте.
// Питает ProgressBar и disabled submit-кнопок из одного источника.

import { useSyncExternalStore } from 'react'
import { busy } from '../api/busy'

export function useBusy() {
  return useSyncExternalStore(busy.subscribe, busy.getSnapshot)
}
