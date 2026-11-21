import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './national-overview'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
