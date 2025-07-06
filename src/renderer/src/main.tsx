import '@renderer/styles/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ClickToComponent } from 'click-to-react-component'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ClickToComponent />
  </StrictMode>
)
