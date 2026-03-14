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

    const handleOpen = () => {
        if (capabilities.canRead) openArtifact(atom);
    };

    const handleAction = async (protocol) => {
        try {
            if (protocol === 'ATOM_DELETE') {
                await unpinAtom(projection.id, projection.provider);
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
            className="mca-surface stack"
            style={{
                borderColor: theme.color,
                background: `linear-gradient(135deg, ${theme.color}10 0%, transparent 100%)`,
                '--theme-color': theme.color
            }}
            onClick={handleOpen}
        >
            {/* HUD Decoration */}
            <div className="mca-surface__deco" style={{
                borderTop: `2px solid ${theme.color}`,
                borderRight: `2px solid ${theme.color}`
            }}></div>

            {/* Header: Metadata */}
            <div className="spread" style={{ opacity: 0.4 }}>
                <span className="text-hint font-mono" style={{ fontSize: '8px' }}>
                    {projection.subtitle}
                </span>
                <IndraIcon name={theme.icon} size="12px" style={{ color: theme.color }} />
            </div>

            {/* Identity Slot */}
            <div className="fill center stack--tight" style={{ padding: 'var(--space-1) 0' }}>
                <h3 className="mca-surface__title">
                    {projection.title}
                </h3>
            </div>

            {/* Footer: Protocol Triggers */}
            <div className="spread mca-surface__footer">
                <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                    {capabilities.canDelete && (
                        <IndraActionTrigger
                            icon="DELETE"
                            color="var(--color-danger)"
                            requiresHold={true}
                            holdTime={800}
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
