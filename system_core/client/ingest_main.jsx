import React from 'react'
import ReactDOM from 'react-dom/client'
import { EmergencyIngest } from './src/apps/ingesta/EmergencyIngest'
import './src/styles/main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EmergencyIngest />
  </React.StrictMode>,
)
