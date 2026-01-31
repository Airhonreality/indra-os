/**
 * 🔍 OMD-05: CONTEXT INSPECTOR (The Host)
 * 
 * SOBERANÍA: Servicio Global Transversal.
 * Polimórfico: Actúa como host de configuración para cualquier entidad del sistema.
 */

import React, { useState, useEffect } from 'react';
import { ReactiveMapper } from '../ReactiveMapper/ReactiveMapper';
import './ContextInspector.css';

export const ContextInspector = () => {
    const [selection, setSelection] = useState(null);

    useEffect(() => {
        const handleSelect = (e) => {
            // El Inspector observa el bus de eventos global para reaccionar.
            setSelection(e.detail);
        };

        window.addEventListener('isk-entity-selected', handleSelect);
        return () => window.removeEventListener('isk-entity-selected', handleSelect);
    }, []);

    const renderControl = (key, propSchema) => {
        const { type, value } = propSchema;
        return (
            <div key={key} className="inspector-field">
                <label>{key}</label>
                <div className="control-group">
                    <input
                        type={type === 'color' ? 'color' : type === 'number' ? 'number' : 'text'}
                        defaultValue={value}
                        className="stark-input"
                    />
                    {/* El botón de 'Mapear' inyecta el OMD-11: Reactive Mapper */}
                    <button className="btn-map" title="Map to Context Variable">⚡</button>
                </div>
            </div>
        );
    };

    return (
        <div className="context-inspector">
            <div className="inspector-header">
                <span className="inspector-title">CONTEXT INSPECTOR</span>
                {selection && <span className="selection-tag">{selection.schema.type}</span>}
            </div>

            {!selection ? (
                <div className="inspector-empty">No Active Selection</div>
            ) : (
                <div className="inspector-scroll">
                    <div className="inspector-section">
                        <h5 className="section-title">Geometric Context</h5>
                        {Object.entries(selection.schema.properties).map(([key, prop]) => renderControl(key, prop))}
                    </div>

                    {/* Proyección del Reactive Mapper (Servicio OMD-11) */}
                    <div className="inspector-section">
                        <h5 className="section-title">Reactive Bindings</h5>
                        <p className="section-hint">Drag variables here to animate properties.</p>
                        <ReactiveMapper targetType={selection.schema.type} />
                    </div>
                </div>
            )}
        </div>
    );
};

ContextInspector.metadata = {
    id: "OMD-05",
    name: "Context Inspector",
    archetype: "TRANSFORM",
    description: "Global property host for all system entities."
};

export default ContextInspector;
