/**
 * 🔍 VISUAL INSPECTOR (Zone C)
 * Reactive Property Inspector: Auto-generates UI from Entity Schemas.
 */

import React, { useState, useEffect } from 'react';
import './VisualInspector.css';

export const VisualInspector = () => {
    const [selection, setSelection] = useState(null);

    // Escuchar cambios de selección en el sistema
    useEffect(() => {
        const handleSelect = (e) => {
            // e.detail puede ser null (deselección) o { id, schema }
            setSelection(e.detail);
        };

        window.addEventListener('isk-entity-selected', handleSelect);
        return () => window.removeEventListener('isk-entity-selected', handleSelect);
    }, []);

    // Renderizado dinámico de controles basado en el tipo de propiedad
    const renderControl = (key, propSchema) => {
        const { type, value } = propSchema;

        switch (type) {
            case 'number':
                return (
                    <div key={key} className="inspector-field">
                        <label>{key}</label>
                        <div className="input-wrapper">
                            <input
                                type="number"
                                defaultValue={value}
                                className="axiom-input"
                            />
                            {/* Simulamos un slider para valores numéricos comunes */}
                            <div className="mini-slider" style={{ width: `${Math.min(value, 100)}%` }}></div>
                        </div>
                    </div>
                );
            case 'color':
                return (
                    <div key={key} className="inspector-field">
                        <label>{key}</label>
                        <div className="color-wrapper">
                            <input
                                type="color"
                                defaultValue={value}
                                className="axiom-color-picker"
                            />
                            <span className="color-hex">{value}</span>
                        </div>
                    </div>
                );
            case 'string':
                return (
                    <div key={key} className="inspector-field">
                        <label>{key}</label>
                        <input
                            type="text"
                            defaultValue={value}
                            className="axiom-input"
                        />
                    </div>
                );
            default:
                return (
                    <div key={key} className="inspector-field">
                        <label>{key}</label>
                        <code className="value-preview">{JSON.stringify(value)}</code>
                    </div>
                );
        }
    };

    return (
        <div className="visual-inspector">
            {/* Header */}
            <div className="inspector-header">
                <span className="inspector-title">PROPERTIES</span>
                {selection && <span className="inspector-subtitle">{selection.id.substr(0, 8)}...</span>}
            </div>

            {/* Content */}
            {!selection ? (
                <div className="inspector-empty">
                    <div className="empty-icon">Select an Entity on Stage</div>
                </div>
            ) : (
                <div className="inspector-scroll">
                    {/* Sección Identidad */}
                    <div className="inspector-section">
                        <h5 className="section-title">Identity</h5>
                        <div className="inspector-field readonly">
                            <label>UUID</label>
                            <input type="text" value={selection.id} readOnly className="axiom-input ghost" />
                        </div>
                        <div className="inspector-field readonly">
                            <label>ARCHETYPE</label>
                            <input type="text" value={selection.schema.type} readOnly className="axiom-input ghost active-type" />
                        </div>
                    </div>

                    {/* Sección Propiedades Dinámicas */}
                    <div className="inspector-section">
                        <h5 className="section-title">Geometry & Style</h5>
                        {Object.entries(selection.schema.properties).map(([key, propSchema]) => (
                            renderControl(key, propSchema)
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Metadata for INDRACore alignment
VisualInspector.metadata = {
    id: "visual_inspector_isk",
    archetype: "TRANSFORM",
    semantic_intent: "PROBE",
    description: "Reactive Property Inspector for ISK."
};

export default VisualInspector;



