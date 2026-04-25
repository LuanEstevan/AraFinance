import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

if (!window.storage) {
  window.storage = {
    get: async (key) => {
      try { const val = localStorage.getItem(key); return val ? { key, value: val } : null; } catch { return null; }
    },
    set: async (key, value) => {
      try { localStorage.setItem(key, value); return { key, value }; } catch { return null; }
    },
    delete: async (key) => {
      try { localStorage.removeItem(key); return { key, deleted: true }; } catch { return null; }
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
