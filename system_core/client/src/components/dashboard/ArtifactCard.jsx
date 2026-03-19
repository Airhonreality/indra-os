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
    const { openArtifact, unpinAtom, deleteArtifact, coreUrl, sessionSecret, pendingSyncs } = useAppState();
    const isSyncing = !!pendingSyncs[atom.id];

    // 1. Proyectar el Átomo (Agnosticismo Axiomático)
    const projection = DataProjector.projectArtifact(atom);
    if (!projection) return null;

    const { theme, capabilities } = projection;

    const isOrphan = atom._orphan === true;

    const handleOpen = () => {
        if (isOrphan || isSyncing) return; // La materia no existe o está en resonancia
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

    const handleShare = async (e) => {
        e.stopPropagation();
        try {
            const res = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_SHARE_CREATE',
                data: {
                    artifact_id: projection.id,
                    artifact_class: projection.class,
                    auth_mode: 'public'
                }
            }, coreUrl, sessionSecret);

            if (res.metadata?.status === 'OK' && res.items?.[0]) {
                const ticketId = res.items[0].ticket_id;
                // Construct public URL
                const publicUrl = `${window.location.origin}${window.location.pathname}#/run?u=${encodeURIComponent(coreUrl)}&id=${ticketId}`;
                await navigator.clipboard.writeText(publicUrl);
                alert(`✅ Enlace público copiado al portapapeles:\n\n${publicUrl}`);
            } else {
                alert(`❌ Error al crear enlace: ${res.metadata?.error}`);
            }
        } catch (err) {
            alert(`❌ Fallo de compartición: ${err.message}`);
        }
    };

    const handlePublish = async (e) => {
        e.stopPropagation();
        try {
            const res = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_BLUEPRINT_SYNC',
                context_id: projection.id,
                data: { action: 'PUBLISH' }
            }, coreUrl, sessionSecret);

            if (res.metadata?.status === 'OK') {
                alert(`✅ Blueprint publicado en el Vault:\n${res.metadata.message}`);
            } else {
                alert(`❌ Error al publicar blueprint: ${res.metadata?.error}`);
            }
        } catch (err) {
            alert(`❌ Fallo de publicación: ${err.message}`);
        }
    };

    return (
        <div
            className={`mca-surface stack ${isOrphan ? 'is-orphan' : ''} ${isSyncing ? 'is-syncing' : ''}`}
            style={{
                borderColor: isSyncing ? 'var(--color-accent)' : (isOrphan ? 'var(--color-border)' : theme.color),
                background: isSyncing 
                    ? 'rgba(0, 255, 200, 0.05)'
                    : (isOrphan
                        ? 'rgba(255,255,255,0.02)'
                        : `linear-gradient(135deg, ${theme.color}10 0%, transparent 100%)`),
                '--theme-color': isSyncing ? 'var(--color-accent)' : (isOrphan ? 'var(--color-text-dim)' : theme.color),
                opacity: (isOrphan && !isSyncing) ? 0.6 : 1,
                cursor: (isOrphan || isSyncing) ? 'wait' : 'pointer'
            }}
            onClick={handleOpen}
        >
            {isSyncing && (
                <div className="mca-surface__loader center">
                    <IndraIcon name="SYNC" size="24px" className="spin" style={{ color: 'var(--color-accent)' }} />
                    <span className="text-label" style={{ fontSize: '7px', marginTop: 'var(--space-2)', color: 'var(--color-accent)' }}>SYNCING_MEMO...</span>
                </div>
            )}
            {/* HUD Decoration */}
            <div className="mca-surface__deco" style={{
                borderTop: `2px solid var(--theme-color)`,
                borderRight: `2px solid var(--theme-color)`
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
                    {capabilities.raw?.includes('SYSTEM_SHARE_CREATE') && (
                        <IndraActionTrigger
                            variant="primary"
                            label="PUBLICAR"
                            onClick={handleShare}
                            size="12px"
                        />
                    )}
                    {capabilities.raw?.includes('SYSTEM_BLUEPRINT_SYNC') && (
                        <IndraActionTrigger
                            variant="primary"
                            label="BP"
                            icon="VAULT"
                            onClick={handlePublish}
                            size="12px"
                            title="Guardar como Blueprint"
                        />
                    )}
                    {capabilities.canDelete && (
                        <IndraActionTrigger
                            variant="destructive"
                            label="BORRAR"
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
