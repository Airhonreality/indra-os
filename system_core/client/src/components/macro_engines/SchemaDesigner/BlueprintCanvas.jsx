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

export function BlueprintCanvas({ fields, selectedId, onSelect, previewMode, isOrphan, onProvisionClick, targetSiloId, targetProvider }) {
    return (
        <main className="fill stack" style={{
            background: 'var(--color-bg-void)',
            padding: 'var(--space-8)',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        }}>
            {/* BARRA DE ESTADO DE INFRAESTRUCTURA (Axioma de Sinceridad) */}
            <div className="shelf--tight shadow-glow" style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                marginBottom: 'var(--space-6)',
                padding: '12px 20px',
                borderRadius: '12px',
                background: isOrphan ? 'rgba(234, 67, 53, 0.1)' : 'rgba(0, 245, 212, 0.05)',
                border: '1px solid',
                borderColor: isOrphan ? 'rgba(234, 67, 53, 0.3)' : 'rgba(0, 245, 212, 0.2)',
                justifyContent: 'space-between',
                backdropFilter: 'blur(10px)',
                width: '100%'
            }}>
                <div className="shelf--tight">
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: isOrphan ? 'var(--color-danger)' : 'var(--indra-dynamic-accent)',
                        boxShadow: `0 0 10px ${isOrphan ? 'var(--color-danger)' : 'var(--indra-dynamic-accent)'}`
                    }}></div>
                    <span className="font-mono" style={{ fontSize: '10px', fontWeight: '900', marginLeft: '10px', color: isOrphan ? 'var(--color-danger)' : 'white' }}>
                        {isOrphan ? 'ESTADO: ESTRUCTURA_SIN_ALMACENAMIENTO' : `ESTADO: VINCULADO_A_${targetProvider.toUpperCase()}`}
                    </span>
                </div>
                
                <button 
                    onClick={onProvisionClick}
                    className="btn btn--xs"
                    style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: isOrphan ? 'var(--color-danger)' : 'rgba(255,255,255,0.05)',
                        color: isOrphan ? 'white' : 'var(--indra-dynamic-accent)',
                        border: 'none',
                        fontSize: '9px',
                        fontWeight: '900',
                        cursor: 'pointer'
                    }}
                >
                    {isOrphan ? 'VINCULAR BASE DE DATOS' : 'GESTIONAR ALMACÉN'}
                </button>
            </div>

            {/* Contenedor del Formulario (Vista Previa) */}
            <div className="stack" style={{
                maxWidth: '650px',
                margin: '0 auto',
                width: '100%',
                background: 'var(--color-bg-elevated)',
                padding: 'var(--space-12)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xl)',
                minHeight: '80vh',
                position: 'relative'
            }}>
                <div className="stack--tight" style={{ marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>MÓDULO DE DISEÑO // VISTA PREVIA</span>
                    <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>PREVISUALIZACIÓN EN VIVO</h1>
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
                            <p style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>ESPERANDO DEFINICIÓN DE CAMPOS...</p>
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
                outline: isSelected ? `2px solid ${projection.theme.color}` : '1px solid transparent',
                outlineOffset: '-2px',
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
                <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>{projection.theme.label.toUpperCase()}</span>
            </div>

            {/* Simulación del Input o Contenedor — fiel al widget real */}
            {!isContainer ? (() => {
                if (projection.type === 'IMAGE') return (
                    <div style={{
                        height: '80px',
                        background: 'var(--color-bg-void)',
                        border: '1px dashed var(--color-border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 'var(--space-2)', opacity: 0.4, flexDirection: 'column'
                    }}>
                        <IndraIcon name="IMAGE" size="20px" />
                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>IMAGEN / FOTO</span>
                    </div>
                );
                if (projection.type === 'FILE_ATTACHMENT' || projection.type === 'FILE') return (
                    <div style={{
                        height: '44px',
                        background: 'var(--color-bg-void)',
                        border: '1px solid var(--color-border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', padding: '0 var(--space-3)',
                        gap: 'var(--space-3)', opacity: 0.5
                    }}>
                        <div style={{ width: '24px', height: '24px', background: 'var(--color-warm)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontFamily: 'var(--font-mono)', color: 'black' }}>
                            {(projection.config?.allowed_extensions?.[0] || 'FILE').toUpperCase().substring(0, 4)}
                        </div>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>Archivo binario vinculado</span>
                    </div>
                );
                // Default: input genérico
                return (
                    <div style={{
                        height: '36px',
                        background: 'var(--color-bg-void)',
                        border: '1px solid var(--color-border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center',
                        padding: '0 var(--space-3)',
                        fontSize: '11px', opacity: 0.5
                    }}>
                        {projection.config?.default_value || projection.config?.placeholder || 'Esperando entrada...'}
                    </div>
                );
            })() : (
                <div className="stack" style={{
                    padding: 'var(--space-6)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    minHeight: '80px',
                    gap: 'var(--space-4)',
                    marginTop: 'var(--space-2)'
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
                            <span style={{ fontSize: '9px', marginLeft: 'var(--space-2)' }}>Contenedor Vacío</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
