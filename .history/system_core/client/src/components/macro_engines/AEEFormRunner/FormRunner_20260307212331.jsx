/**
 * =============================================================================
 * ARTEFACTO: FormRunner.jsx
 * RESPONSABILIDAD: Proyecta un DATA_SCHEMA como formulario interactivo.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export function FormRunner({ schema, formData, onFieldChange, onExecute, status }) {
    const fields = schema.payload?.fields || [];

    return (
        <div className="aee-form-runner__form stack--loose">
            <header className="form-header stack--tight">
                <div className="shelf--tight">
                    <IndraIcon name="SCHEMA" size="12px" style={{ color: 'var(--color-accent)' }} />
                    <span className="util-label">SCHEMA_PROJECTION</span>
                </div>
                <h2>{schema.handle?.label || 'Formulario Indra'}</h2>
                <p className="util-hint">Completa los campos para procesar la transacción.</p>
            </header>

            <section className="form-grid stack">
                {fields.length > 0 ? (
                    fields.map(field => (
                        <div key={field.id} className="form-item slot-small stack--tight">
                            <label className="util-label">{field.label}</label>
                            <input
                                className="input-base"
                                type={field.type === 'NUMBER' ? 'number' : 'text'}
                                placeholder={`Ingrese ${field.label}...`}
                                value={formData[field.alias] || ''}
                                onChange={(e) => onFieldChange(field.alias, e.target.value)}
                                disabled={status === 'EXECUTING'}
                            />
                        </div>
                    ))
                ) : (
                    <div className="empty-state center stack--tight slot-small">
                        <IndraIcon name="WARN" size="24px" />
                        <span className="util-label">NO_SCHEMA_FIELDS</span>
                        <p className="util-hint">Este esquema no tiene campos definidos.</p>
                    </div>
                )}
            </section>

            <footer className="form-actions shelf--tight">
                <button
                    className={`btn btn--accent ${status === 'EXECUTING' ? 'active' : ''}`}
                    onClick={onExecute}
                    disabled={status === 'EXECUTING' || fields.length === 0}
                >
                    <IndraIcon name={status === 'EXECUTING' ? 'SYNC' : 'PLAY'} className={status === 'EXECUTING' ? 'spin' : ''} />
                    <span>{status === 'EXECUTING' ? 'EXECUTING...' : 'EJECUTAR_FLUJO'}</span>
                </button>
            </footer>
        </div>
    );
}
