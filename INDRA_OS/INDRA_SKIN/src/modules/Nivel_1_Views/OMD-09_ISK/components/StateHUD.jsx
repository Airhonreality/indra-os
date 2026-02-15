/**
 * 📊 STATE HUD (Zone D)
 * Status bar showing connection, FPS, and **Entity Spawner**.
 */

import React, { useState, useEffect } from 'react';
import './StateHUD.css';

export const StateHUD = () => {
    const [fps, setFps] = useState(60);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const [activeLayers, setActiveLayers] = useState(0);

    useEffect(() => {
        // Simulate FPS counter
        const interval = setInterval(() => {
            setFps(Math.floor(58 + Math.random() * 5));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Función Spawner: Emite evento hacia el Kernel (o quien escuche)
    const spawnEntity = (type) => {
        console.log(`[HUD] Spawning Primitive: ${type}`);
        const event = new CustomEvent('isk-spawn-entity', {
            detail: { type, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="state-hud">
            {/* Left: System Vitals */}
            <div className="state-hud-group system-vitals">
                <div className="state-hud-item">
                    <span className={`status-dot ${connectionStatus}`}></span>
                    <span className="state-hud-label">CORE: ON</span>
                </div>
                <div className="state-hud-item">
                    <span className="state-hud-value">{fps} FPS</span>
                </div>
            </div>

            {/* Center: The Spawner (Generador de Primitivas) */}
            <div className="state-hud-group spawner-controls">
                <button className="spawn-btn" onClick={() => spawnEntity('RECT')} title="Crear Rectángulo">
                    <span className="icon">⬜</span> RECT
                </button>
                <button className="spawn-btn" onClick={() => spawnEntity('ELLIPSE')} title="Crear Elipse">
                    <span className="icon">⚪</span> CIRCLE
                </button>
                <button className="spawn-btn" onClick={() => spawnEntity('TEXT')} title="Crear Texto">
                    <span className="icon">T</span> TEXT
                </button>
            </div>

            {/* Right: Info */}
            <div className="state-hud-group system-info">
                <span className="version-tag">ISK v2.0</span>
            </div>
        </div>
    );
};

// Metadata for INDRACore alignment
StateHUD.metadata = {
    id: "state_hud_isk",
    archetype: "SENSOR",
    semantic_intent: "PROBE",
    description: "Status bar + Entity Spawner"
};

export default StateHUD;



