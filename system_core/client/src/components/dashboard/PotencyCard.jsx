import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { DataProjector } from '../../services/DataProjector';
import { SchemaMicroExplorer } from '../utilities/SchemaMicroExplorer';
import { useAppState } from '../../state/app_state';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';

/**
 * PotencyCard: Representación de la NATURALEZA del OBJETO (Columna I).
 * Se diferencia de la Card estándar por su blancura, densidad y revelación del DNA (Tree).
 */
export function PotencyCard({ atom }) {
    const { openArtifact } = useAppState();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const projection = React.useMemo(() => DataProjector.projectArtifact(atom), [atom]);
    if (!projection) return null;

    const isSchema = projection.class === 'DATA_SCHEMA';
    const isLinked = !!atom.payload?.target_silo_id;

    // --- QUICK ACTIONS HUB ---
    const handleQuickAction = (e, action) => {
        e.stopPropagation();
        // AXIOMA DE DIRECCIONALIDAD: Inyectamos la intención de ruta en el átomo
        openArtifact({ ...atom, _initialPath: action });
    };

    return (
        <div 
            className={`potency-card glass-hover ripple ${isLinked ? 'is-linked' : ''} ${isExpanded ? 'is-expanded' : ''}`}
            onClick={() => isSchema ? setIsExpanded(!isExpanded) : openArtifact(atom)}
            style={{
                background: 'var(--glass-bg-light)', 
                border: isLinked ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                boxShadow: isLinked ? '0 0 10px var(--color-accent-dim)' : 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-4)',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <style>
                {`
                    .potency-card:hover {
                        border-color: ${isLinked ? 'var(--color-accent)' : projection.theme.color} !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2) ${isLinked ? ', 0 0 15px var(--color-accent-glow)' : ''};
                        z-index: 10;
                    }
                    .potency-card-header {
                        display: flex;
                        align-items: center;
                        gap: var(--space-3);
                    }
                    .storage-quick-actions {
                        display: flex;
                        gap: 4px;
                        margin-top: 4px;
                        opacity: 0;
                        transform: translateY(5px);
                        transition: all 0.3s ease;
                    }
                    .potency-card:hover .storage-quick-actions {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    .btn-quick-action {
                        width: 28px;
                        height: 28px;
                        border-radius: 6px;
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.05);
                        color: var(--color-text-secondary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    }
                    .btn-quick-action:hover {
                        background: var(--color-accent-dim);
                        color: var(--color-accent);
                        border-color: var(--color-accent);
                        box-shadow: 0 0 8px var(--color-accent-dim);
                    }
                    @keyframes linkage-pulse {
                        0% { opacity: 0.6; }
                        50% { opacity: 1; }
                        100% { opacity: 0.6; }
                    }
                `}
            </style>

            <div className="potency-card-header">
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: isLinked ? 'var(--color-accent-dim)' : `${projection.theme.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLinked ? 'var(--color-accent)' : projection.theme.color,
                    border: isLinked ? '1px solid var(--color-accent)' : `1px solid ${projection.theme.color}30`,
                    boxShadow: isLinked ? '0 0 5px var(--color-accent-dim)' : 'none'
                }}>
                    <IndraIcon name={projection.theme.icon} size="12px" />
                </div>

                <div className="stack--2xs fill">
                    <div className="shelf--tight" style={{ justifyContent: 'space-between' }}>
                        <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            color: isLinked ? 'var(--color-accent)' : 'var(--color-text-primary)',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase'
                        }}>
                            {projection.title}
                        </span>
                        {isSchema && (
                             <IndraIcon 
                                name="CHEVRON_RIGHT" 
                                size="10px" 
                                style={{ 
                                    opacity: 0.3, 
                                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.3s ease'
                                }} 
                            />
                        )}
                    </div>
                    <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
                        {isLinked ? 'STATUS_LINKED' : projection.class} {" // "} DNA_ID: {atom.id.substring(0, 8)}
                    </span>
                    
                    {isSchema && (
                        <div className="storage-quick-actions" onClick={e => e.stopPropagation()}>
                            <button className="btn-quick-action" title="CREAR NUEVA" onClick={(e) => handleQuickAction(e, 'IGNITE')}>
                                <IndraIcon name="VAULT" size="12px" />
                            </button>
                            <button className="btn-quick-action" title="IMPORTAR ADN" onClick={(e) => handleQuickAction(e, 'IMPORT_DNA')}>
                                <IndraIcon name="SEARCH" size="12px" />
                            </button>
                            <button className="btn-quick-action" title="VINCULAR" onClick={(e) => handleQuickAction(e, 'LINK')}>
                                <IndraIcon name="LINK" size="12px" />
                            </button>
                            <button className="btn-quick-action" title="TRANSFERIR" onClick={(e) => handleQuickAction(e, 'HYDRATE')}>
                                <IndraIcon name="SYNC" size="12px" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="shelf--tight" onClick={e => e.stopPropagation()} style={{ marginLeft: 'var(--space-2)' }}>
                    <IndraActionTrigger 
                        variant="destructive"
                        onClick={() => useAppState.getState().deleteArtifact(atom.id, atom.provider)}
                        size="10px"
                    />
                    <button className="btn btn--ghost btn--mini" onClick={() => openArtifact(atom)} style={{ padding: '4px' }}>
                        <IndraIcon name="OPEN_IN_NEW" size="10px" style={{ opacity: 0.4 }} />
                    </button>
                </div>
            </div>

            {/* PREVIEW DEL FRACTAL (Colapsable) */}
            {isSchema && (
                <div style={{ 
                    maxHeight: isExpanded ? '300px' : '0px',
                    opacity: isExpanded ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginTop: isExpanded ? 'var(--space-2)' : '0',
                    borderTop: isExpanded ? '1px dashed var(--color-border)' : 'none',
                    paddingTop: isExpanded ? 'var(--space-2)' : '0'
                }}>
                    {atom.payload?.fields?.length > 0 ? (
                        <div style={{ 
                            maxHeight: '240px',
                            overflowY: 'auto',
                            scrollbarWidth: 'none'
                        }}>
                            <SchemaMicroExplorer schema={atom} />
                        </div>
                    ) : (
                        <div style={{ padding: '12px', textAlign: 'center', opacity: 0.3 }}>
                             <span className="font-mono" style={{ fontSize: '9px' }}>SIN_CAMPOS_DETECTADOS</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
