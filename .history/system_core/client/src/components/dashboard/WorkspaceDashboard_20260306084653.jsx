/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/WorkspaceDashboard.jsx
 * RESPONSABILIDAD: El Orquestador de Nivel 2.
 *
 * DHARMA (MCA):
 *   - Vacío Transparente: Es un espejo del estado del Núcleo.
 *   - Celularidad: Los subcomponentes (Grid, Card, Rail) gestionan su propia acción.
 * =============================================================================
 */

import React from 'react';
import { useAppState } from '../../state/app_state';
import { ArtifactGrid } from './ArtifactGrid';
import { ActionRail } from './ActionRail';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useLexicon } from '../../services/lexicon';

export function WorkspaceDashboard() {
    const {
        activeWorkspaceId,
        workspaces,
        pins,
        loadingKeys,
        loadPins,
        setActiveWorkspace
    } = useAppState();

    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    const loading = loadingKeys.pins;
    const activeWS = workspaces.find(w => w.id === activeWorkspaceId);

    return (
        <div className="fill stack" style={{ padding: 'var(--space-8)', paddingBottom: '100px' }}>

            {/* ── HEADER DEL WORKSPACE ── */}
            <header className="spread" style={{ marginBottom: 'var(--space-10)' }}>
                <div className="shelf--loose">
                    <IndraIcon name="ATOM" size="40px" style={{ color: 'var(--color-accent)' }} />
                    <div className="stack--tight">
                        <h1 style={{
                            margin: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xl)',
                            letterSpacing: '0.1em'
                        }}>
                            {activeWS?.handle?.label || 'UNNAMED_WORKSPACE'}
                        </h1>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                            WS_ID: {activeWorkspaceId} // {pins.length} PINS_ACTIVE
                        </span>
                    </div>
                </div>

                <div className="shelf glass" style={{
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-strong)'
                }}>
                    <IndraActionTrigger
                        icon="SYNC"
                        label={t('action_sync')}
                        onClick={loadPins}
                        color={loading ? 'var(--color-accent)' : 'var(--color-text-secondary)'}
                        activeColor="var(--color-accent)"
                    />
                    <div style={{ width: '1px', height: '12px', background: 'var(--color-border)', margin: '0 var(--space-1)' }}></div>
                    <IndraActionTrigger
                        icon="CLOSE"
                        label={t('action_back')}
                        onClick={() => setActiveWorkspace(null)}
                        color="var(--color-danger)"
                        activeColor="var(--color-danger)"
                        requiresHold={true}
                        holdTime={800}
                    />
                </div>
            </header>

            {/* ── GRID DE ARTEFACTOS ── */}
            <ArtifactGrid pins={pins} />

            {/* ── ACTION COMMAND RAIL ── */}
            <ActionRail />

        </div>
    );
}
