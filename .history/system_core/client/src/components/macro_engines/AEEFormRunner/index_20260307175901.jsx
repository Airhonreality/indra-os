/**
 * =============================================================================
 * ARTEFACTO: AEEFormRunner/index.jsx
 * RESPONSABILIDAD: Proyección de formularios y captura de datos.
 * =============================================================================
 */

import React, { useState } from 'react';
import './AEEFormRunner.css';

export function AEEFormRunner({ atom, onUpdate }) {
    const [formData, setFormData] = useState({});

    // El Schema reside en el payload del átomo
    const fields = atom.payload?.fields || [];

    const handleFieldChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleExecute = () => {
        console.log('[AEE] Ejecutando flujo con datos:', formData);
        // Aquí se dispararía el ProtocolRouter.execute({ protocol: 'SCHEMA_SUBMIT', ... })
        alert('Ejecutando Workflow de Indra...');
    };

    return (
        <div className="indra-macro-engine aee-form-runner">
            <main className="form-viewport">
                <header className="form-header">
                    <span className="badge">OPERATIONAL_MODE</span>
                    <h1>{atom.handle?.label || 'Formulario de Entrada'}</h1>
                    <p>Completa los campos para procesar la transacción.</p>
                </header>

                <section className="form-grid">
                    {fields.length > 0 ? (
                        fields.map(field => (
                            <div key={field.id} className="form-field">
                                <label>{field.label}</label>
                                <input
                                    type={field.type === 'NUMBER' ? 'number' : 'text'}
                                    placeholder={`Ingrese ${field.label}...`}
                                    onChange={(e) => handleFieldChange(field.alias, e.target.value)}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="empty-schema">
                            <p>No hay campos definidos en el esquema asociado.</p>
                        </div>
                    )}
                </section>
            </main>

            <footer className="aee-hud">
                <div className="status-info">
                    <div className="led pulse-cyan"></div>
                    <span>SISTEMA_LISTO</span>
                </div>

                <button className="execute-btn" onClick={handleExecute}>
                    EJECUTAR FLUJO
                </button>
            </footer>
        </div>
    );
}
