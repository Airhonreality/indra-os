import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { DataProjector } from '../../services/DataProjector';
import { useAppState } from '../../state/app_state';
import { StatusLed } from '../utilities/primitives';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { SchemaMicroExplorer } from '../utilities/SchemaMicroExplorer';
import { useShell } from '../../context/ShellContext';
import { SchemaActionService } from '../../services/SchemaActionService';

/**
 * AtomGlif: Versión densa de un átomo para la columna de POTENCIA (20%).
 */
export function AtomGlif({ atom, onHoverStart, onHoverEnd }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const { openArtifact, openContextMenu, lang } = useShell();
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const handleDelete = () => {
        useAppState.getState().deleteArtifact(atom.id, atom.provider);
    };

    return (
        <div 
            className="atom-glif stack--none ripple glass-hover"
            style={{
                minHeight: '32px',
                height: 'auto',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--color-border)',
                overflow: 'hidden'
            }}
            onMouseEnter={() => onHoverStart?.(atom.id)}
            onMouseLeave={() => onHoverEnd?.()}
            onClick={() => openArtifact(atom)}
        >
            <style>
                {`
                    .atom-glif:hover {
                        border-color: var(--color-accent) !important;
                        box-shadow: 0 0 10px var(--color-accent-dim);
                    }
                    .atom-glif .delete-trigger {
                        opacity: 0;
                        transition: opacity 0.2s ease;
                    }
                    .atom-glif:hover .delete-trigger {
                        opacity: 0.4;
                    }
                    .atom-glif .delete-trigger:hover {
                        opacity: 1;
                        color: var(--color-danger);
                    }
                    .atom-glif-header {
                        display: flex;
                        align-items: center;
                        gap: var(--space-2);
                        padding: var(--space-2);
                        min-height: 32px;
                        width: 100%;
                    }
                `}
            </style>

            {/* Header Area */}
            <div className="atom-glif-header">
                <IndraIcon 
                    name={projection.theme.icon} 
                    size="12px" 
                    style={{ color: projection.theme.color, opacity: 0.8 }} 
                />
                
                <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    color: 'var(--color-text-primary)'
                }}>
                    {projection.title}
                </span>

                {projection.density > 0 && (
                    <span style={{ 
                        fontSize: '8px', 
                        fontFamily: 'var(--font-mono)', 
                        opacity: 0.4,
                        background: 'var(--color-bg-hover)',
                        padding: '1px 4px',
                        borderRadius: '2px'
                    }}>
                        {projection.density}
                    </span>
                )}

                <div className="delete-trigger" onClick={e => e.stopPropagation()} style={{ padding: '0 4px' }}>
                    <IndraActionTrigger 
                        variant="destructive"
                        label="ELIMINAR"
                        onClick={handleDelete}
                        size="10px"
                    />
                </div>

                <StatusLed 
                    active={!atom._orphan} 
                    color={atom._orphan ? 'var(--color-danger)' : 'var(--color-success)'} 
                    size="4px"
                />

                <button 
                    className="btn btn--mini opacity-40 hover-opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <IndraIcon name="CHEVRON_RIGHT" size="8px" style={{ 
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s ease'
                    }} />
                </button>
            </div>



            {/* Expansion Area (Tree) */}
            {isExpanded && (
                <div 
                    className="stack--none fill" 
                    style={{ 
                        padding: '0 var(--space-2) var(--space-2)',
                        background: 'rgba(0,0,0,0.15)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        width: '100%'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <SchemaMicroExplorer 
                        schema={atom}
                        onContextMenu={(e, field) => {
                            const creds = { 
                                url: useAppState.getState().protocolUrl, 
                                secret: useAppState.getState().protocolSecret 
                            };
                            openContextMenu(e, [
                                { 
                                    label: 'Añadir Hijo', 
                                    icon: 'PLUS', 
                                    action: () => SchemaActionService.addField(atom, { parentId: field.id }, creds) 
                                },
                                { 
                                    label: 'Eliminar Campo', 
                                    icon: 'DELETE', 
                                    color: 'var(--color-danger)',
                                    action: () => SchemaActionService.removeField(atom, field.id, creds) 
                                }
                            ]);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
