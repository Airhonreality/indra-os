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
import { useWorkspace } from '../../context/WorkspaceContext';
import { useShell } from '../../context/ShellContext';
import { ArtifactGrid } from './ArtifactGrid';
import { ActionRail } from './ActionRail';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { IndraMacroHeader } from '../utilities/IndraMacroHeader';
import { useLexicon } from '../../services/lexicon';

export function WorkspaceDashboard() {
    const {
        activeWorkspaceId,
        workspaces,
        pins,
        loadingKeys,
        loadPins,
        setActiveWorkspace
    } = useWorkspace();

    const { lang } = useShell();
    const t = useLexicon(lang);

    const loading = loadingKeys.pins;
    const activeWS = workspaces.find(w => w.id === activeWorkspaceId);

    // Filtrar infra externa para que la cuenta coincida con lo que se renderiza
    const operationalPins = (pins || []).filter(p => !['FOLDER', 'ACCOUNT_IDENTITY'].includes(p.class));

    return (
        <div className="fill stack" style={{
            padding: 'var(--space-4) var(--space-8)',
            overflowY: 'auto',
            height: '100%',
            position: 'relative'
        }}>

            {/* ── HEADER DEL WORKSPACE ── */}
            {activeWS && (
                <IndraMacroHeader
                    atom={activeWS}
                    onClose={() => setActiveWorkspace(null)}
                    isSaving={loading}
                    extraControls={<ActionRail />}
                />
            )}

            {/* ── GRID DE ARTEFACTOS ── */}
            {activeWS && <ArtifactGrid pins={pins} />}

            {!activeWS && !loading && (
                <div className="fill center stack--loose opacity-50">
                    <IndraIcon name="ATOM" size="48px" />
                    <span className="font-mono text-xs">RESOLVING_WORKSPACE_SOVEREIGNTY...</span>
                </div>
            )}

        </div>
    );
}
