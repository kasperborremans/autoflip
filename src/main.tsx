import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { pasThemaToe } from './thema'

pasThemaToe()

// Vraag de browser om onze opslag (login en lokale gegevens) niet zelf op te ruimen.
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
