import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { DataProjector } from '../../services/DataProjector';
import { useAppState } from '../../state/app_state';
import { Badge, ConfirmModal } from '../utilities/primitives';
import { useLexicon } from '../../services/lexicon';

/**
 * ResultGalleryCard: Visualización de resultados para la columna de MANIFESTACIÓN (30%).
 */
export function ResultGalleryCard({ atom, onHoverStart, onHoverEnd }) {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const t = useLexicon();
    const { openArtifact } = useAppState();
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const handleDelete = () => {
        useAppState.getState().deleteArtifact(atom.id, atom.provider);
        setIsDeleting(false);
    };

    const timestamp = new Date(projection.timestamp).toLocaleDateString();

    return (
        <div 
            className="result-card stack--tight ripple glass-hover"
            style={{
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                border: '1px solid var(--color-border)',
                position: 'relative'
            }}
            onMouseEnter={() => onHoverStart?.(atom.id)}
            onMouseLeave={() => onHoverEnd?.()}
            onClick={() => openArtifact(atom)}
        >
            <style>
                {`
                    .result-card:hover {
                        border-color: var(--color-accent) !important;
                        box-shadow: 0 0 15px var(--color-accent-dim);
                    }
                    .result-card .delete-trigger {
                        opacity: 0;
                        transition: opacity 0.2s ease;
                        position: absolute;
                        top: var(--space-2);
                        right: var(--space-2);
                        z-index: 10;
                    }
                    .result-card:hover .delete-trigger {
                        opacity: 0.4;
                    }
                    .result-card .delete-trigger:hover {
                        opacity: 1;
                        color: var(--color-danger);
                    }
                `}
            </style>

            <button 
                className="delete-trigger btn btn--mini"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleting(true);
                }}
            >
                <IndraIcon name="DELETE" size="12px" />
            </button>

            <ConfirmModal 
                isOpen={isDeleting}
                title="ELIMINAR MANIFESTACIÓN"
                message={`¿Estás seguro de que deseas eliminar permanentemente el logro '${projection.title}'? Esta acción no se puede deshacer.`}
                confirmLabel="ELIMINAR"
                cancelLabel="CANCELAR"
                danger={true}
                onConfirm={handleDelete}
                onCancel={() => setIsDeleting(false)}
            />

            {/* Cognitive Thumbnail Placeholder */}
            <div style={{ 
                aspectRatio: '16/9', 
                background: `linear-gradient(45deg, ${projection.theme.color}22, transparent)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                <IndraIcon name={projection.theme.icon} size="32px" style={{ opacity: 0.1, color: projection.theme.color }} />
                <Badge 
                    label={projection.theme.label || projection.class} 
                    style={{ position: 'absolute', bottom: 'var(--space-2)', right: 'var(--space-2)', fontSize: '8px' }} 
                />
            </div>

            <div style={{ padding: 'var(--space-3)' }} className="stack--tight">
                <div className="stack--2xs">
                    <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>{projection.title}</h4>
                    <span style={{ fontSize: '8px', opacity: 0.2, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>ID_LOGRO: {atom.id.substring(0, 8)}</span>
                </div>
                
                <div className="spread" style={{ marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>// {timestamp}</span>
                    <button 
                        className="btn btn--mini btn-micro-action" 
                        style={{ fontSize: '8px', opacity: 0.6, letterSpacing: '0.1em' }}
                        onClick={(e) => { e.stopPropagation(); /* Logic for harvest/view */ }}
                    >
                        {t('action_harvest')?.toUpperCase() || 'COSECHAR'}
                    </button>
                </div>
            </div>
        </div>
    );
}
