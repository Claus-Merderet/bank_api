// Тост-система макета (D-03, D-06): push(kind, title, msg) добавляет тост В КОНЕЦ массива
// и планирует автоудаление по id через 5200 мс прямо в push (не в эффекте — StrictMode-safe:
// двойной маунт dev-режима не создаёт дублей таймеров). Стили карточки — дословно из макета
// (SCAM Bank.dc.html:741, 1192–1207). useToast держим рядом с провайдером (дискреция).

import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

function Toast({ kind, title, msg }) {
  const c = kind === 'error' ? '#fb7185' : '#34d399'
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        pointerEvents: 'auto',
        padding: '13px 15px',
        borderRadius: '15px',
        background: 'rgba(13,13,26,.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid color-mix(in srgb, ' + c + ' 40%, transparent)',
        boxShadow: '0 18px 50px -14px rgba(0,0,0,.8), 0 0 40px -18px ' + c,
        animation: 'toastIn .35s cubic-bezier(.2,.9,.3,1.2)',
      }}
    >
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '9px',
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 800,
          color: '#070710',
          background: c,
          boxShadow: '0 0 18px ' + c,
        }}
      >
        {kind === 'error' ? '✕' : '✓'}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#f2f2fa' }}>{title}</div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11.5px',
            color: '#9b9bb4',
            marginTop: '3px',
            lineHeight: 1.55,
            overflowWrap: 'anywhere',
          }}
        >
          {msg}
        </div>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const push = useCallback((kind, title, msg) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, kind, title, msg }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id)) // функциональный апдейтер — нет stale closure
    }, 5200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: 'min(370px, calc(100vw - 32px))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} kind={t.kind} title={t.title} msg={t.msg} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
