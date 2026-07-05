// Презентационная модалка «Оформление кредита» (D-05/D-06, SCAM Bank.dc.html :646–708;
// UI-элементы UIEL-01 чекбокс-гейт, UIEL-08 модалка). Композиция готового ui/Modal (width 560,
// фиолетовый glow-дефолт совпадает с макетом). БЕЗ query/mutation/бизнес-логики: всё состояние
// формы живёт В СЕКЦИИ (04-02, чтобы requestMut читал поля) — модалка только рендерит и вызывает
// сеттеры/onSubmit. Мягкая валидация: клиентских проверок сумм/срока нет — кнопку гейтит ТОЛЬКО
// чекбокс согласия (creditBtnDisabled вычисляется в секции). Ошибки — только через ErrorBlock от
// бэкенда (RESEARCH Live Contract: кредитные бизнес-ошибки приходят HTTP 404, показываем дословно).

import { Modal } from '../ui/Modal'
import { Checkbox } from '../ui/Checkbox'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ErrorBlock } from '../ui/ErrorBlock'
import { money } from '../../lib/format'

// Контракт пропсов ЗАФИКСИРОВАН — секция 04-02 обязана его соблюсти.
export function CreditModal({
  onClose,
  onSubmit,
  crAmount,
  setCrAmount,
  crTerm,
  setCrTerm,
  crAcc,
  setCrAcc,
  crConsent,
  setCrConsent,
  creditBtnDisabled,
  errCr,
  known,
}) {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Отмена
      </Button>
      <Button onClick={onSubmit} disabled={creditBtnDisabled}>
        Оформить кредит
      </Button>
    </>
  )

  return (
    <Modal title="Оформление кредита" onClose={onClose} width={560} footer={footer}>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <Input
          label="Сумма"
          placeholder="5000 – 15000"
          mono
          inputMode="decimal"
          value={crAmount}
          onChange={(e) => setCrAmount(e.target.value)}
          style={{ flex: '1 1 180px' }}
        />
        <Input
          label="Срок, мес"
          placeholder="1 – 60"
          mono
          inputMode="numeric"
          value={crTerm}
          onChange={(e) => setCrTerm(e.target.value)}
          style={{ flex: '1 1 150px' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Select label="Счёт зачисления" value={crAcc} onChange={(e) => setCrAcc(e.target.value)}>
          <option value="">— выберите счёт —</option>
          {known.map((a) => (
            <option key={a.id} value={a.id}>{`ID ${a.id} · ${a.number} · ${money(a.balance)}`}</option>
          ))}
        </Select>
      </div>

      <div
        style={{
          borderRadius: '14px',
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.08)',
          padding: '14px 16px',
          marginBottom: '16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11.5px',
          color: '#9b9bb4',
          lineHeight: 1.9,
        }}
      >
        ▸ сумма 5000–15000 ₽, срок 1–60 месяцев
        <br />
        ▸ один активный кредит на пользователя
        <br />
        ▸ зачисление на выбранный счёт сразу
        <br />
        ▸ погашение один раз, строго точной суммой долга
      </div>

      <div style={{ marginBottom: '18px' }}>
        <Checkbox
          size={21}
          checked={crConsent}
          onChange={() => setCrConsent((v) => !v)}
          label="Я согласен с условиями кредитования и подтверждаю оформление"
        />
      </div>

      <ErrorBlock error={errCr} style={{ margin: '0 0 16px' }} />
    </Modal>
  )
}
