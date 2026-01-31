import React from 'react'
import ReactDOM from 'react-dom/client'

// 🎨 DESIGN SYSTEM
import './styles/tokens.css'
import './styles/index.css'

// ⚛️ CORE APP
import App from './App'

// 💠 IGNITION
console.log('%c 🛰️ INDRA CONSOLE: ONLINE ', 'background: #0a0a0c; color: #3b82f6; padding: 4px; font-weight: bold;');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
