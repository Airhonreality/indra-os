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

export function ArtifactCard({ atom }) {
    const { openArtifact, unpinAtom, coreUrl, sessionSecret } = useAppState();

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
                position: 'relative',
                minHeight: '80px',
                cursor: capabilities.canRead ? 'pointer' : 'default',
                transition: 'all var(--transition-base)',
                borderColor: theme.color,
                background: `linear-gradient(135deg, ${theme.color}10 0%, transparent 100%)`,
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)'
            }}
            onClick={handleOpen}
        >
            {/* HUD Decoration */}
            <div style={{
                position: 'absolute',
                top: 0, right: 0,
                width: '30px', height: '30px',
                borderTop: `2px solid ${theme.color}`,
                borderRight: `2px solid ${theme.color}`,
                opacity: 0.3
            }}></div>

            {/* Header: Metadata */}
            <div className="spread" style={{ opacity: 0.4 }}>
                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                    {projection.subtitle}
                </span>
                <IndraIcon name={theme.icon} size="12px" style={{ color: theme.color }} />
            </div>

            {/* Identity Slot */}
            <div className="fill center stack--tight" style={{ padding: 'var(--space-1) 0' }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em'
                }}>
                    {projection.title}
                </h3>
            </div>

            {/* Footer: Protocol Triggers */}
            <div className="spread" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                    {capabilities.canDelete && (
                        <IndraActionTrigger
                            icon="DELETE"
                            color="var(--color-danger)"
                            activeColor="var(--color-danger)"
                            requiresHold={true}
                            holdTime={800}
                            onClick={() => handleAction('ATOM_DELETE')}
                            size="12px"
                        />
                    )}
                </div>

                <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
                    {new Date(projection.timestamp).toLocaleDateString()}
                </span>
            </div>
            <style>{`
                .mca-surface:hover { border-color: ${theme.color} !important; transform: translateY(-2px); }
                .mca-surface:hover h3 { color: ${theme.color} !important; }
            `}</style>
        </div>
    );
}
