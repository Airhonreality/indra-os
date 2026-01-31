/**
 * 🌐 OMD-10: CONTEXT EXPLORER (The Source)
 * 
 * SOBERANÍA: Este es un Servicio Global de Indra.
 * Proporciona el inventario de variables del Flow State a cualquier módulo.
 */

import React, { useState, useEffect } from 'react';
import './ContextExplorer.css';

export const ContextExplorer = () => {
    const [capabilities, setCapabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchCapabilities() {
            try {
                // Sourcing: Intentamos conectar con el MCEP del Core
                const response = await fetch('/api/indra/getMCEPManifest');
                if (!response.ok) throw new Error('MCEP_UNREACHABLE');
                const data = await response.json();
                setCapabilities(data.capabilities || []);
            } catch (error) {
                console.warn("⚠️ [ContextExplorer] Core MCEP Offline. Manifesting MOCK_DATA (Holodeck Mode).");
                // MOCK DATA: Fallback sistémico para desarrollo local
                setCapabilities([
                    { id: 'gravity_control', label: 'Gravity Control', type: 'FLUID', value: 0.7 },
                    { id: 'time_dilation', label: 'Time Dilation', type: 'QUANTUM', value: 0.002 },
                    { id: 'quantum_flux', label: 'Quantum Flux', type: 'ENERGY', value: 124.5 },
                    { id: 'thermal_signature', label: 'Thermal Sig', type: 'HEAT', value: 36.6 },
                    { id: 'oxygen_level', label: 'O2 Level', type: 'ATMOS', value: 0.21 }
                ]);
            } finally {
                setLoading(false);
            }
        }
        fetchCapabilities();
    }, []);

    const handleDragStart = (e, cap) => {
        // El Cubo de Datos es el origen de la Verdad.
        // Serializamos la variable para el puente semántico.
        e.dataTransfer.setData('indra/variable', JSON.stringify({
            id: cap.id,
            label: cap.label,
            source: 'MCEP_CORE'
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const filtered = capabilities.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="context-explorer">
            <div className="explorer-search">
                <input
                    type="text"
                    placeholder="Search context..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="stark-input-minimal"
                />
            </div>

            <div className="variable-list">
                {loading ? (
                    <div className="explorer-loading">Scanning Core...</div>
                ) : filtered.map(cap => (
                    <div
                        key={cap.id}
                        className="variable-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, cap)}
                    >
                        <span className="var-icon">🔗</span>
                        <div className="var-info">
                            <span className="var-label">{cap.label}</span>
                            <span className="var-id">{cap.id}</span>
                        </div>
                        <span className="var-type">{cap.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Metadata para el Registro Global
ContextExplorer.metadata = {
    id: "OMD-10",
    name: "Context Explorer",
    archetype: "SERVICE",
    description: "Global inventory of Flow State variables."
};

export default ContextExplorer;
