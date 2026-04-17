const SYSTEM_VERSION = "v4.95-NEXUS";
const SYSTEM_TAG = "ACTIVE";
const SYSTEM_DHARMA = "TOTAL | Puente: GITHUB RAW (CACHE-BUSTED)";

console.log(`%c 🔴 INDRA OS ${SYSTEM_VERSION}-${SYSTEM_TAG}`, "color: #ff4d4d; font-weight: bold; font-size: 14px;");
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
