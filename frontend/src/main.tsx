import { VieiraAnalytics } from '@vieira/analytics/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from '@/hooks/useTheme'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
    <VieiraAnalytics projectKey="fluxo" />
  </React.StrictMode>,
)

/* Buy Me a Coffee widget (ensures badge after SPA build/deploy) */
;(() => {
  if (typeof document === 'undefined') return
  if (document.querySelector('script[data-name="BMC-Widget"]')) return
  const s = document.createElement('script')
  s.setAttribute('data-name', 'BMC-Widget')
  s.setAttribute('data-cfasync', 'false')
  s.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js'
  s.setAttribute('data-id', 'vieira')
  s.setAttribute('data-description', 'Support me on Buy me a coffee!')
  s.setAttribute('data-message', '')
  s.setAttribute('data-color', '#3ddc97')
  s.setAttribute('data-position', 'Right')
  s.setAttribute('data-x_margin', '18')
  s.setAttribute('data-y_margin', '18')
  document.body.appendChild(s)
})()
