// Дерево провайдеров: BrowserRouter → QueryClientProvider → AuthProvider → App.
// AuthProvider ОБЯЗАН быть внутри BrowserRouter — ему нужен useNavigate.
// TanStack Query подключается уже сейчас (D-04); активное использование — фазы 2–3.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
