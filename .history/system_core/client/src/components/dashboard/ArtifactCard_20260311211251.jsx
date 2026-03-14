/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/ArtifactCard.jsx
 * RESPONSABILIDAD: Proyectar la identidad de un Átomo Universal en la grilla.
 *
 * DHARMA (MCA):
 *   - Celularidad: Habla directamente con el estado (app_state).
 *   - Sinceridad Identitaria: Muestra el ID real y el label proyectado.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { Badge } from '../utilities/primitives';
import { useAppState } from '../../state/app_state';
import { executeDirective } from '../../services/directive_executor';
import { DataProjector } from '../../services/DataProjector';
import './ArtifactCard.css';

export function ArtifactCard({ atom }) {
    const { openArtifact, unpinAtom, deleteArtifact, coreUrl, sessionSecret } = useAppState();

    // 1. Proyectar el Átomo (Agnosticismo Axiomático)
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const { theme, capabilities } = projection;

    const isOrphan = atom._orphan === true;

    const handleOpen = () => {
        if (isOrphan) return; // La materia no existe
        if (capabilities.canRead) openArtifact(atom);
    };

    const handleAction = async (protocol) => {
        try {
            if (protocol === 'ATOM_DELETE') {
                await deleteArtifact(projection.id, projection.provider);
            } else {
                await executeDirective({
                    provider: projection.provider,
                    protocol: protocol,
                    context_id: projection.id
                }, coreUrl, sessionSecret);
            }
        } catch (err) {
            console.error('[Card] Action failed:', err);
        }
    };

    return (
        <div
            className={`mca-surface stack ${isOrphan ? 'is-orphan' : ''}`}
            style={{
                borderColor: isOrphan ? 'var(--color-border)' : theme.color,
                background: isOrphan
                    ? 'rgba(255,255,255,0.02)'
                    : `linear-gradient(135deg, ${theme.color}10 0%, transparent 100%)`,
                '--theme-color': isOrphan ? 'var(--color-text-dim)' : theme.color,
                opacity: isOrphan ? 0.6 : 1,
                cursor: isOrphan ? 'not-allowed' : 'pointer'
            }}
            onClick={handleOpen}
        >
            {/* HUD Decoration */}
            <div className="mca-surface__deco" style={{
                borderTop: `2px solid ${theme.color}`,
                borderRight: `2px solid ${theme.color}`
            }}></div>

            {/* Header: Metadata & Resonance */}
            <div className="spread" style={{ opacity: 0.8, marginBottom: 'var(--space-2)' }}>
                <div className="shelf--tight font-mono" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
                    <div className={`resonance-dot ${projection.raw?.status === 'LIVE' ? 'resonance-dot--active' : ''}`} style={{
                        background: projection.raw?.status === 'LIVE' ? 'var(--color-danger)' : 'var(--color-accent)'
                    }}></div>
                    <span style={{ color: projection.raw?.status === 'LIVE' ? 'var(--color-danger)' : 'inherit' }}>
                        {projection.raw?.status === 'LIVE' ? 'AST_LIVE' : 'AST_STABLE'}
                    </span>
                </div>
                <div className="shelf--tight">
                    {isOrphan ? (
                        <Badge type="danger" label="MATERIA_DESAPARECIDA" />
                    ) : (
                        <>
                            <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.5 }}>
                                {projection.subtitle}
                            </span>
                            <IndraIcon name={theme.icon} size="10px" style={{ color: theme.color, opacity: 0.8 }} />
                        </>
                    )}
                </div>
            </div>

            {/* Identity Slot */}
            <div className="fill center stack--tight" style={{ padding: 'var(--space-1) 0' }}>
                <h3 className="mca-surface__title" style={{ fontSize: '13px', textAlign: 'center' }}>
                    {projection.title}
                </h3>
            </div>

            {/* Footer: Protocol Triggers */}
            <div className="spread mca-surface__footer">
                <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                    {capabilities.canDelete && (
                        <IndraActionTrigger
                            variant="destructive"
                            label="ATOM_DELETE"
                            onClick={() => handleAction('ATOM_DELETE')}
                            size="12px"
                        />
                    )}
                </div>

                <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.3 }}>
                    {new Date(projection.timestamp).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}
