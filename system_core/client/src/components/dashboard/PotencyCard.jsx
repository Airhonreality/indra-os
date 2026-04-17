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
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const isSchema = projection.class === 'DATA_SCHEMA';

    return (
        <div 
            className="potency-card glass-hover ripple"
            onClick={() => openArtifact(atom)}
            style={{
                background: 'var(--glass-bg-light)', // Más claro/limpio como el mockup
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-4)',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
            }}
        >
            <style>
                {`
                    .potency-card:hover {
                        border-color: ${projection.theme.color} !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        z-index: 10;
                    }
                    .potency-card-header {
                        display: flex;
                        align-items: center;
                        gap: var(--space-3);
                    }
                `}
            </style>

            <div className="potency-card-header">
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: `${projection.theme.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: projection.theme.color,
                    border: `1px solid ${projection.theme.color}30`
                }}>
                    <IndraIcon name={projection.theme.icon} size="12px" />
                </div>

                <div className="stack--2xs fill">
                    <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        color: 'var(--color-text-primary)',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase'
                    }}>
                        {projection.title}
                    </span>
                    <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
                        {projection.class} {" // "} DNA_ID: {atom.id.substring(0, 8)}
                    </span>
                </div>

                <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                    <IndraActionTrigger 
                        variant="destructive"
                        onClick={() => useAppState.getState().deleteArtifact(atom.id, atom.provider)}
                        size="10px"
                    />
                    <IndraIcon name="CHEVRON_RIGHT" size="8px" style={{ opacity: 0.2 }} />
                </div>
            </div>

            {/* PREVIEW DEL FRACTAL (Solo si es Schema y es relevante) */}
            {isSchema && atom.payload?.fields?.length > 0 && (
                <div style={{ 
                    marginTop: 'var(--space-2)', 
                    paddingTop: 'var(--space-2)', 
                    borderTop: '1px dashed var(--color-border)',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    scrollbarWidth: 'none'
                }}>
                    <SchemaMicroExplorer schema={atom} />
                </div>
            )}
        </div>
    );
}
