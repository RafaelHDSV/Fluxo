import { VieiraAnalytics } from '@vieira/analytics/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <VieiraAnalytics projectKey="fluxo" />
  </React.StrictMode>
)
