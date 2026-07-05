// Единый источник busy для прогресс-бара и disabled кнопок (D-03).
// Счётчик активных HTTP-запросов: инкремент в request-интерцепторе,
// декремент в ОБЕИХ ветках response (успех и ошибка). Внешний store вне React —
// доставка в компоненты через useSyncExternalStore (src/hooks/useBusy.js).

let count = 0
const listeners = new Set()

export const busy = {
  increment() {
    count++
    listeners.forEach((l) => l())
  },
  decrement() {
    count = Math.max(0, count - 1) // защита от рассинхрона: не уходим в минус
    listeners.forEach((l) => l())
  },
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  getSnapshot() {
    return count > 0
  },
}
