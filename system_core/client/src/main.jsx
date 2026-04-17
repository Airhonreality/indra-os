import React from 'react';
console.log('%c🔴 INDRA OS v4.75-NEXUS ACTIVE', 'color: #ff3e00; font-weight: bold; font-size: 14px;');
console.log('%cTrazabilidad: TOTAL | Puente: GITHUB RAW (CACHE-BUSTED)', 'color: #00e5ff; font-size: 10px;');
import ReactDOM from 'react-dom/client';
import App from './App';
import { NeuralSplitter } from './context/NeuralSplitter';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
