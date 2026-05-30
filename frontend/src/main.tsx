import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { Toaster } from 'sonner'
import { oidcConfig } from '@/auth/oidc'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
      <Toaster position="bottom-right" theme="dark" richColors />
    </AuthProvider>
  </StrictMode>,
)
