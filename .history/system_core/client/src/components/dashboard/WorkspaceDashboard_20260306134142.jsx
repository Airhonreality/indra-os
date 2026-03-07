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
        <div className="fill stack" style={{ padding: 'var(--space-4) var(--space-8)' }}>

            {/* ── HEADER DEL WORKSPACE ── */}
            <div className="shelf--tight" style={{ gap: 'var(--space-4)' }}>
                <ActionRail />
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
                        requiresHold={false}
                    />
                </div>
            </div>
        </header>

            {/* ── GRID DE ARTEFACTOS ── */ }
        </div >
    );
}
