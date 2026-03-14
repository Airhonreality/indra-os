/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/SchemaDesigner/BlueprintCanvas.jsx
 * RESPONSABILIDAD: El Plano Visual del ADN.
 *
 * DHARMA:
 *   - Proyección Viva: Es un espejo del formulario final.
 *   - Agnosticismo Cognitivo: No permite edición directa de lógica; solo captura visual.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { DataProjector } from '../../../services/DataProjector';

export function BlueprintCanvas({ fields, selectedId, onSelect, previewMode }) {
    return (
        <main className="fill stack" style={{
            background: 'var(--color-bg-void)',
            padding: 'var(--space-12)',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Contenedor del Formulario */}
            <div className="stack" style={{
                maxWidth: '650px',
                margin: '0 auto',
                width: '100%',
                background: 'var(--color-bg-elevated)',
                padding: 'var(--space-12)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xl)',
                minHeight: '80vh'
            }}>
                <div className="stack--tight" style={{ marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>BLUEPRINT_MODULE // CAPTURE_INTERFACE</span>
                    <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>PREVISUALIZACIÓN_VIVA</h1>
                </div>

                <div className="stack" style={{ gap: 'var(--space-6)' }}>
                    {fields.map(field => (
                        <BlueprintField
                            key={field.id}
                            field={field}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            previewMode={previewMode}
                        />
                    ))}

                    {fields.length === 0 && (
                        <div className="center stack" style={{ padding: 'var(--space-20)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', opacity: 0.4 }}>
                            <IndraIcon name="PLUS" size="32px" />
                            <p style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>ESPERANDO_SEMENTAL_DNA...</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function BlueprintField({ field, selectedId, onSelect, previewMode }) {
    const projection = DataProjector.projectFieldDefinition(field);
    if (!projection) return null;

    const isContainer = projection.type === 'FRAME' || projection.type === 'REPEATER';
    const children = field.children || [];
    const isSelected = selectedId === field.id;

    const handleSelect = (e) => {
        if (previewMode) return;
        e.stopPropagation();
        onSelect(field.id);
    };

    return (
        <div
            onClick={handleSelect}
            className={`stack--tight blueprint-field ${isSelected ? 'selected' : ''}`}
            style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: isSelected ? `2px solid ${projection.theme.color}` : '1px solid transparent',
                background: isSelected ? `${projection.theme.color}12` : 'transparent',
                cursor: previewMode ? 'default' : 'pointer',
                transition: 'all var(--transition-fast)',
                position: 'relative'
            }}
        >
            <div className="spread" style={{ marginBottom: 'var(--space-2)' }}>
                <label style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.9,
                    color: isSelected ? projection.theme.color : 'inherit'
                }}>
                    {projection.label}
                    {projection.config?.required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
                </label>
                <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>{projection.type}</span>
            </div>

            {/* Simulación del Input o Contenedor */}
            {!isContainer ? (
                <div style={{
                    height: '32px',
                    background: 'var(--color-bg-void)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 var(--space-3)',
                    fontSize: '11px',
                    opacity: 0.5
                }}>
                    {projection.config?.default_value || projection.config?.placeholder || 'Esperando entrada...'}
                </div>
            ) : (
                <div className="stack" style={{
                    padding: 'var(--space-4)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    minHeight: '60px',
                    gap: 'var(--space-4)'
                }}>
                    {children.length > 0 ? (
                        children.map(child => (
                            <BlueprintField
                                key={child.id}
                                field={child}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                previewMode={previewMode}
                            />
                        ))
                    ) : (
                        <div className="center" style={{ opacity: 0.2, padding: 'var(--space-4)' }}>
                            <IndraIcon name={projection.theme.icon} size="20px" />
                            <span style={{ fontSize: '9px', marginLeft: 'var(--space-2)' }}>{projection.type}_EMPTY_CONTAINER</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
