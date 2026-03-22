import React from 'react'
import ReactDOM from 'react-dom/client'
import WebApp from '@twa-dev/sdk'
import App from './App.jsx'
import './index.css'

// Initialize Telegram WebApp
WebApp.ready();
WebApp.expand();

// Set theme colors for better visibility in Telegram
document.documentElement.style.setProperty('--tg-theme-bg-color', WebApp.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', WebApp.secondaryBackgroundColor);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
