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

    // Filtrar infra externa para que la cuenta coincida con lo que se renderiza
    const operationalPins = (pins || []).filter(p => !['FOLDER', 'ACCOUNT_IDENTITY'].includes(p.class));

    return (
        <div className="fill stack" style={{ padding: 'var(--space-4) var(--space-8)' }}>

            {/* ── HEADER DEL WORKSPACE ── */}
            <header className="spread" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="shelf--tight" style={{ gap: 'var(--space-2)' }}>
                    <IndraIcon name="ATOM" size="24px" style={{ color: 'var(--color-accent)' }} />
                    <div className="stack--tight">
                        <h1 style={{
                            margin: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '14px',
                            letterSpacing: '0.1em'
                        }}>
                            {activeWS?.handle?.label || 'UNNAMED_WORKSPACE'}
                        </h1>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                            WS_ID: {activeWorkspaceId} // {operationalPins.length} PINS_ACTIVE
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
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

            {/* ── GRID DE ARTEFACTOS ── */}
            <ArtifactGrid pins={pins} />

        </div>
    );
}
