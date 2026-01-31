/**
 * modules/isk/components/SemanticDataCube.jsx
 * 
 * DHARMA: Cubo de Datos Semánticos con Drag & Drop para Bindings.
 * 
 * ZONA A: Navigator - Lista de variables disponibles desde MCEP.
 */

import React, { useState, useEffect } from 'react';
import './SemanticDataCube.css';

export function SemanticDataCube() {
    const [capabilities, setCapabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [draggedVariable, setDraggedVariable] = useState(null);

    useEffect(() => {
        fetchCapabilities();
    }, []);

    async function fetchCapabilities() {
        try {
            const response = await fetch('/api/indra/getMCEPManifest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                // FALLBACK: Mock Data for Local Development ("First Light")
                console.warn("[SemanticDataCube] API unavailable, using Holodeck Simulation.");
                setCapabilities(MOCK_CAPABILITIES);
                setLoading(false);
                return;
            }

            const data = await response.json();
            setCapabilities(data.tools || []);
            setLoading(false);
        } catch (err) {
            // FALLBACK: Mock Data for Network Errors
            console.warn("[SemanticDataCube] Network error, engaging Holodeck Simulation.", err);
            setCapabilities(MOCK_CAPABILITIES);
            setLoading(false);
        }
    }

    // Datos simulados para "Primera Luz"
    const MOCK_CAPABILITIES = [
        { function: { name: "gravity_control", description: "Control universal gravitational constant (G)" } },
        { function: { name: "time_dilation", description: "Adjust local temporal flow rate" } },
        { function: { name: "quantum_flux", description: "Probability amplitude of spatial nodes" } },
        { function: { name: "entity_spawner", description: "Instantiate archetype entities in Zone B" } },
        { function: { name: "light_intensity", description: "Global illumination flux (Lumens)" } }
    ];

    function handleDragStart(variable) {
        setDraggedVariable(variable);
        console.log('[SemanticDataCube] Drag started:', variable);
    }

    function handleDragEnd() {
        setDraggedVariable(null);
        console.log('[SemanticDataCube] Drag ended');
    }

    if (loading) {
        return (
            <div className="semantic-data-cube">
                <div className="cube-header">
                    <h3>📊 Data Cube</h3>
                </div>
                <div className="cube-loading">Loading capabilities...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="semantic-data-cube">
                <div className="cube-header">
                    <h3>📊 Data Cube</h3>
                </div>
                <div className="cube-error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="semantic-data-cube">
            <div className="cube-header">
                <h3>📊 Data Cube</h3>
                <span className="cube-count">{capabilities.length} variables</span>
            </div>

            <div className="cube-search">
                <input
                    type="text"
                    placeholder="Search variables..."
                    className="cube-search-input"
                />
            </div>

            <div className="cube-variables">
                {capabilities.map((cap, index) => (
                    <div
                        key={index}
                        className={`cube-variable ${draggedVariable === cap ? 'dragging' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(cap)}
                        onDragEnd={handleDragEnd}
                    >
                        <span className="variable-icon">🔗</span>
                        <div className="variable-info">
                            <div className="variable-name">{cap.function?.name || 'Unknown'}</div>
                            <div className="variable-description">
                                {cap.function?.description || 'No description'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {capabilities.length === 0 && (
                <div className="cube-empty">
                    No capabilities available. Check Core connection.
                </div>
            )}
        </div>
    );
}

// Metadata para OrbitalCore alignment
SemanticDataCube.metadata = {
    archetype: 'SENSOR',
    semantic_intent: 'PROBE',
    description: 'Semantic Data Cube with drag & drop for variable bindings'
};
