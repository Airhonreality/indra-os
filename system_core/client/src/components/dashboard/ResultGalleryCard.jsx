import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { DataProjector } from '../../services/DataProjector';
import { useAppState } from '../../state/app_state';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { Badge } from '../utilities/primitives';
import { useLexicon } from '../../services/lexicon';

/**
 * ResultGalleryCard: Visualización de resultados para la columna de MANIFESTACIÓN (30%).
 */
export function ResultGalleryCard({ atom, onHoverStart, onHoverEnd }) {
    const t = useLexicon();
    const { openArtifact } = useAppState();
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const handleDelete = () => {
        useAppState.getState().deleteArtifact(atom.id, atom.provider);
    };

    const timestamp = new Date(projection.timestamp).toLocaleDateString();

    return (
        <div 
            className="result-card shelf--tight ripple glass-hover"
            style={{
                background: 'var(--glass-bg)',
                borderRadius: 'var(--indra-ui-radius)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                border: '1px solid var(--color-border)',
                position: 'relative',
                padding: 'var(--space-2)',
                minHeight: '54px'
            }}
            onMouseEnter={() => onHoverStart?.(atom.id)}
            onMouseLeave={() => onHoverEnd?.()}
            onClick={() => openArtifact(atom)}
        >
            <style>
                {`
                    .result-card:hover {
                        border-color: var(--color-warm) !important;
                        background: var(--glass-light);
                    }
                    .result-card .delete-trigger {
                        opacity: 0;
                        transition: opacity 0.2s ease;
                        position: absolute;
                        bottom: var(--space-2);
                        right: var(--space-2);
                        z-index: 10;
                    }
                    .result-card:hover .delete-trigger {
                        opacity: 0.6;
                    }
                    .result-card .delete-trigger:hover {
                        opacity: 1;
                        color: var(--color-danger);
                    }
                `}
            </style>

            <div className="delete-trigger" onClick={e => e.stopPropagation()}>
                <IndraActionTrigger 
                    variant="destructive"
                    label={t('action_delete')}
                    onClick={handleDelete}
                    size="10px"
                />
            </div>

            {/* Compact Indicator */}
            <div style={{ 
                width: '32px', 
                height: '32px',
                borderRadius: '4px',
                background: `${projection.theme.color}11`,
                border: `1px solid ${projection.theme.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <IndraIcon name={projection.theme.icon} size="16px" style={{ color: projection.theme.color }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }} className="stack--2xs">
                <div className="spread">
                    <h4 style={{ 
                        margin: 0, 
                        fontSize: '9px', 
                        fontWeight: '800', 
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {projection.title.toUpperCase()}
                    </h4>
                </div>
                
                <div className="shelf--tight" style={{ opacity: 0.4, fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                    <span>{"//"} {timestamp}</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span style={{ textTransform: 'uppercase' }}>{projection.theme.label || projection.class}</span>
                </div>
            </div>
        </div>
    );
}
