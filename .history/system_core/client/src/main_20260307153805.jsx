import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NeuralSplitter } from './context/NeuralSplitter';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <NeuralSplitter>
            <App />
        </NeuralSplitter>
    </React.StrictMode>
);
