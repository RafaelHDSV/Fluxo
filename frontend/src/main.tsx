import { VieiraAnalytics } from '@vieira/analytics/react'
import { InstitucionalProvider } from '@vieira/institucional'
import { AppErrorBoundary, initSentry } from '@vieira/institucional/sentry'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Link } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from '@/hooks/useTheme'
import { institucionalConfig } from '@/institucional.config'
import './index.css'
import '@vieira/institucional/styles.css'

initSentry({
  enabled: import.meta.env.PROD,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  allowUrls: [window.location.origin],
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <InstitucionalProvider config={institucionalConfig} linkComponent={Link}>
        <AppErrorBoundary>
          <ThemeProvider>
            <App />
          </ThemeProvider>
          <VieiraAnalytics projectKey="fluxo" />
        </AppErrorBoundary>
      </InstitucionalProvider>
    </BrowserRouter>
  </React.StrictMode>,
)