import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { usePWA } from './hooks/usePWA.js'

// Componente raíz con PWA registrado
function Root() {
  // Registra el SW y escucha mensajes globales
  usePWA()
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
