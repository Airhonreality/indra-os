console.log(`%c 🔴 INDRA OS ${__INDRA_VERSION__}-${__INDRA_STATUS__}`, "color: #ff4d4d; font-weight: bold; font-size: 14px;");
console.log(`%cTrazabilidad: ${__INDRA_DHARMA__}`, 'color: #00e5ff; font-size: 10px;');
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
