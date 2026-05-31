// Point d'entrée de l'application React.
// createRoot monte le composant App dans la div #root de index.html.
// StrictMode active des avertissements supplémentaires en développement.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   // styles globaux (variables CSS, classes utilitaires)
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
