import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { ThemeProvider } from './context/ThemeContext'
import 'animal-island-ui/style'
import './styles.css'
import './styles/display-stand.css'
import './styles/recipes.css'
import './styles/planting.css'
import './styles/museum.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
