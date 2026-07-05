// Утилиты форматирования макета SCAM BANK — перенос 1:1 (SCAM Bank.dc.html:831–842).
// Разряды и суффикс ₽ через NBSP (U+00A0), минус — U+2212 (не дефис); escape-последовательности
// как в исходнике макета — чтобы невидимые символы были видны в коде.
// В фазе 2 не используются — закладка для экранов денег фаз 3–4 (инвариант UI-SPEC «Деньги»).

export function money(n) {
  const neg = n < 0
  const a = Math.abs(n)
  const s = (Number.isInteger(a) ? String(a) : a.toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (neg ? '−' : '') + s + ' ₽'
}

export function signed(n) {
  return (n < 0 ? '−' : '+') + money(Math.abs(n))
}

// Номер счёта «317 0988»: первые 3 символа + NBSP + остаток (вариант макета, не regex)
export function numFmt(num) {
  return num.slice(0, 3) + ' ' + num.slice(3)
}

export function parseNum(s) {
  if (s == null || String(s).trim() === '') return NaN
  return Number(String(s).replace(',', '.'))
}
