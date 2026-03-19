import React, { useState } from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { DataProjector } from '../../services/DataProjector';
import { useAppState } from '../../state/app_state';
import { StatusLed } from '../utilities/primitives';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useLexicon } from '../../services/lexicon';

/**
 * AgencyChassis: El contenedor de motores activo para la columna de AGENCIA (44%).
 */
export function AgencyChassis({ atom, onHoverStart, onHoverEnd }) {
    const t = useLexicon();
    const { openArtifact } = useAppState();
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const handleDelete = () => {
        useAppState.getState().deleteArtifact(atom.id, atom.provider);
    };

    // Extraer fuentes vinculadas (Coupling Port)
    const sources = atom.payload?.sources || [];
    
    // Step Tracking (Ficticio por ahora para cumplimiento de diseño)
    const steps = [1, 2, 3, 4, 5]; 
    const currentStep = 2;

    return (
        <div 
            className="agency-chassis stack--md active-shadow glass-hover"
            style={{
                background: `linear-gradient(to bottom, var(--color-bg-elevated), var(--color-bg-surface))`,
                borderLeft: `2px solid ${projection.theme.color}`,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                minHeight: '120px', 
                transition: 'all var(--transition-base)',
                position: 'relative',
                cursor: 'pointer',
                border: '1px solid var(--color-border)'
            }}
            onMouseEnter={() => onHoverStart(atom.id)}
            onMouseLeave={() => onHoverEnd()}
            onClick={() => openArtifact(atom)}
        >
            <style>
                {`
                    .agency-chassis:hover {
                        border-color: var(--color-accent) !important;
                        box-shadow: 0 0 15px var(--color-accent-dim);
                    }
                    .agency-chassis .delete-trigger {
                        opacity: 0;
                        transition: opacity 0.2s ease;
                        position: absolute;
                        top: var(--space-2);
                        right: var(--space-2);
                    }
                    .agency-chassis:hover .delete-trigger {
                        opacity: 0.4;
                    }
                    .agency-chassis .delete-trigger:hover {
                        opacity: 1;
                        color: var(--color-danger);
                    }
                `}
            </style>

            <div className="spread">
                <div className="shelf--md">
                    <IndraIcon name={projection.theme.icon} size="18px" style={{ color: projection.theme.color, opacity: 0.8 }} />
                    <div className="stack--2xs">
                        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'var(--font-medium)', letterSpacing: '0.01em' }}>{projection.title}</h3>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>ID_MODULO: {atom.id.substring(0, 8)}</span>
                    </div>
                </div>
                <div className="shelf--tight">
                    <div className="delete-trigger" onClick={e => e.stopPropagation()}>
                        <IndraActionTrigger 
                            variant="destructive"
                            label="ELIMINAR"
                            onClick={handleDelete}
                            size="12px"
                        />
                    </div>
                    <StatusLed active={!atom._orphan} color={projection.theme.color} size="5px" />
                </div>
            </div>



            {/* Step Visualizer (Puntos de progreso internos) */}
            <div className="shelf--2xs" style={{ marginTop: 'var(--space-1)', opacity: 0.3 }}>
                {steps.map(s => (
                    <div 
                        key={s} 
                        style={{ 
                            width: '3px', 
                            height: '3px', 
                            borderRadius: '50%', 
                            background: s <= currentStep ? projection.theme.color : 'var(--color-text-tertiary)' 
                        }} 
                    />
                ))}
            </div>

            {/* Coupling Port: Fuentes de entrada vinculadas */}
            {sources.length > 0 && (
                <div className="coupling-port shelf--tight wrap" style={{ marginTop: 'var(--space-1)' }}>
                    {sources.map((sourceId, idx) => (
                        <div 
                            key={idx}
                            style={{ 
                                fontSize: '8px', 
                                padding: '1px 5px', 
                                background: 'var(--glass-light)', 
                                borderRadius: '2px', 
                                border: `1px solid var(--color-border)`,
                                color: 'var(--color-text-secondary)',
                                fontFamily: 'var(--font-mono)'
                            }}
                        >
                            {sourceId.substring(0, 8)}
                        </div>
                    ))}
                </div>
            )}

            {/* Comandos de Micro-Agencia */}
            <div className="spread" style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
                <div className="shelf--tight">
                    <button 
                        className="btn btn--ghost btn--xs btn-micro-action" 
                        title={t('ui_operational_pulse')}
                        onClick={(e) => {
                            e.stopPropagation();
                            useAppState.getState().registerSync(atom.id);
                            setTimeout(() => useAppState.getState().finishSync(atom.id), 2000);
                        }}
                        style={{ color: 'inherit' }}
                    >
                        <IndraIcon name="PLAY" size="10px" />
                    </button>
                    <span className="hud-label-mono" style={{ fontSize: '8px', opacity: 0.2 }}>{t('ui_ready_for_exec')}</span>
                </div>
                
                <div className="hud-label-mono" style={{ fontSize: '9px', color: projection.theme.color, opacity: 0.5, fontWeight: 'bold' }}>
                    {t('ui_focus_engine')}
                </div>
            </div>
        </div>
    );
}
