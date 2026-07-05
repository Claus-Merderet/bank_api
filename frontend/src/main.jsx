// Дерево провайдеров: BrowserRouter → QueryClientProvider → AuthProvider → App.
// AuthProvider ОБЯЗАН быть внутри BrowserRouter — ему нужен useNavigate.
// TanStack Query подключается уже сейчас (D-04); активное использование — фазы 2–3.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Шрифты макета — self-hosted через @fontsource (DEPL-01: без сетевых запросов в рантайме).
// Импортируются ПО-ВЕСОВЫЕ файлы (<font>/<weight>.css) — в них @font-face всех сабсетов
// с unicode-range; subset-файлы (cyrillic-400.css) БЕЗ range перекрывают латиницу — не использовать.
import '@fontsource/unbounded/500.css'
import '@fontsource/unbounded/600.css'
import '@fontsource/unbounded/700.css'
import '@fontsource/unbounded/800.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
