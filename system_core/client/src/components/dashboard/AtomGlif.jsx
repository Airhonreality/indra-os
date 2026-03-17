import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { DataProjector } from '../../services/DataProjector';
import { useAppState } from '../../state/app_state';
import { StatusLed, ConfirmModal } from '../utilities/primitives';
import { SchemaMicroExplorer } from '../utilities/SchemaMicroExplorer';
import { useShell } from '../../context/ShellContext';
import { SchemaActionService } from '../../services/SchemaActionService';

/**
 * AtomGlif: Versión densa de un átomo para la columna de POTENCIA (20%).
 */
export function AtomGlif({ atom, onHoverStart, onHoverEnd }) {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const { openArtifact, openContextMenu, lang } = useShell();
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const handleDelete = () => {
        useAppState.getState().deleteArtifact(atom.id, atom.provider);
        setIsDeleting(false);
    };

    return (
        <div 
            className="atom-glif shelf--tight ripple glass-hover"
            style={{
                minHeight: '32px',
                height: 'auto',
                padding: 'var(--space-2)',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                border: '1px solid var(--color-border)',
                flexWrap: 'wrap'
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
                `}
            </style>

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

            {/* Contador de Densidad */}
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

            <button 
                className="delete-trigger btn btn--mini"
                style={{ padding: '4px' }}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleting(true);
                }}
            >
                <IndraIcon name="DELETE" size="10px" />
            </button>

            <ConfirmModal 
                isOpen={isDeleting}
                title="ELIMINAR ESQUEMA"
                message={`¿Estás seguro de que deseas eliminar permanentemente '${projection.title}'? Esta acción no se puede deshacer.`}
                confirmLabel="ELIMINAR"
                cancelLabel="CANCELAR"
                danger={true}
                onConfirm={handleDelete}
                onCancel={() => setIsDeleting(false)}
            />

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
            >
                <IndraIcon name="CHEVRON_RIGHT" size="8px" style={{ 
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s ease'
                }} />
            </button>

            {isExpanded && (
                <div 
                    className="stack--tight fill" 
                    style={{ 
                        marginTop: 'var(--space-1)', 
                        padding: 'var(--space-2)',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: 'var(--radius-sm)',
                        borderTop: '1px solid var(--color-border)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <SchemaMicroExplorer 
                        schema={atom}
                        onContextMenu={(e, field) => {
                            openContextMenu(e, [
                                { 
                                    label: 'Añadir Hijo', 
                                    icon: 'PLUS', 
                                    action: () => SchemaActionService.addField(atom, { parentId: field.id }, { url: useAppState.getState().protocolUrl, secret: useAppState.getState().protocolSecret }) 
                                },
                                { 
                                    label: 'Eliminar Campo', 
                                    icon: 'DELETE', 
                                    color: 'var(--color-danger)',
                                    action: () => SchemaActionService.removeField(atom, field.id, { url: useAppState.getState().protocolUrl, secret: useAppState.getState().protocolSecret }) 
                                }
                            ]);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
