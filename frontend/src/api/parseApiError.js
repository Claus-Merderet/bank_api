// Единый разбор ошибок API (CORE-02) → {status, message, raw}.
// Живые форматы бэкенда (истина — 01-CURL-LOG.md, прогон 2026-07-04):
//   1.  {"error": "msg"}                    — бизнес-ошибки и валидация
//       (валидация MapRequestPayload склеивается бэкендом через \n: "msg1\nmsg2";
//        problem+json с violations[] в живых ответах НЕ существует — ветка оставлена
//        защитной, первой по приоритету плана)
//   1b. {"error": "Internal server error", "message": "<текст исключения>"} — 500
//   2.  {"code": 401, "message": "Expired JWT Token" | "Invalid JWT Token" |
//        "JWT Token not found"}             — lexik-401 (ЕДИНСТВЕННЫЙ сигнал logout)
//   3.  problem+json {"detail": "..."} без violations — на случай дефолтного Symfony
//   4.  HTML-страница ~159 КБ (кредитный 403 "Forbidden: ROLE_CREDIT access required")
//       — не JSON вообще: ни одна ветка не срабатывает, остаётся HTTP-статус.
// Оригинальный текст бэкенда НЕ переписывать и НЕ переводить — полигон для тестировщиков.

export function parseApiError(err) {
  const status = err.response?.status ?? 0
  const data = err.response?.data
  let message
  if (Array.isArray(data?.violations) && data.violations.length) {
    message = data.violations
      .map((v) => (v.propertyPath ? `${v.propertyPath}: ${v.title}` : v.title))
      .join('\n')
  } else if (data?.error) {
    // 500 приходит с парой error+message — приложить утечку через двоеточие
    message = data.message ? `${data.error}: ${data.message}` : data.error
  } else if (data?.message) {
    message = data.message // lexik {"code":401,"message":...}
  } else if (data?.detail) {
    message = data.detail // problem+json без violations
  } else {
    message = status ? `Ошибка ${status}` : 'Ошибка сети'
  }
  return { status, message, raw: data }
}
