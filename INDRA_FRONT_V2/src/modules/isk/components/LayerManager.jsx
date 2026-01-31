/**
 * 🗂️ LAYER MANAGER (Zone A)
 * Navigator panel that lists available Core capabilities via MCP.
 */

import React, { useEffect, useState } from 'react';
import './LayerManager.css';

export const LayerManager = () => {
    const [mcepManifest, setMcepManifest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadMCEPManifest();
    }, []);

    async function loadMCEPManifest() {
        try {
            const sessionId = sessionStorage.getItem('user_session_id') || 'default_session';

            const response = await fetch('/api/indra/getMCEPManifest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: sessionId })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setMcepManifest(data.manifest);
            setLoading(false);
        } catch (err) {
            console.error('[LayerManager] Error loading MCEP:', err);
            setError(err.message);
            setLoading(false);
        }
    }

    function handleBindVariable(toolId) {
        // Activate binding mode in SpatialBridge (future integration)
        console.log('[LayerManager] Binding variable:', toolId);
        if (window.SpatialBridge) {
            window.SpatialBridge.activateBinding(toolId);
        }
    }

    if (loading) {
        return <div className="layer-manager-loading">Cargando capacidades...</div>;
    }

    if (error) {
        return (
            <div className="layer-manager-error">
                <p>⚠️ Error al cargar MCEP</p>
                <code>{error}</code>
            </div>
        );
    }

    return (
        <div className="layer-manager">
            <div className="layer-manager-section">
                <h4>Variables Disponibles</h4>
                <ul className="layer-manager-list">
                    {Object.entries(mcepManifest?.tools || {}).map(([toolId, tool]) => (
                        <li
                            key={toolId}
                            className="layer-manager-item"
                            onClick={() => handleBindVariable(toolId)}
                            title={tool.description || toolId}
                        >
                            <span className="layer-manager-icon">📊</span>
                            <span className="layer-manager-label">{tool.label || toolId}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// Metadata for OrbitalCore alignment
LayerManager.metadata = {
    id: "layer_manager_isk",
    label: "Layer Manager",
    archetype: "SENSOR",
    semantic_intent: "PROBE",
    description: "Navigator panel for ISK Designer, lists available Core capabilities via MCP protocol."
};

export default LayerManager;
