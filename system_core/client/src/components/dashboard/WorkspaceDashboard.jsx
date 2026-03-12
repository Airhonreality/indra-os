/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/WorkspaceDashboard.jsx
 * RESPONSABILIDAD: Orquestador del Nivel 2 (Workspace activo).
 *
 * LAYOUT CANÓNICO:
 *   1. IndraMacroHeader  → flex-shrink: 0  (identidad del workspace)
 *   2. ActionRail        → flex-shrink: 0  (herramientas de creación)
 *   3. ArtifactGrid      → flex: 1         (área operativa scrollable)
 *
 * AXIOMAS:
 *   - La cabecera NO contiene lógica de negocio del workspace.
 *   - El título es editable directamente desde la cabecera.
 *   - El ActionRail es una banda operativa independiente, no parte del header.
 * =============================================================================
 */

import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useShell } from '../../context/ShellContext';
import { ArtifactGrid } from './ArtifactGrid';
import { ActionRail } from './ActionRail';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraMacroHeader } from '../utilities/IndraMacroHeader';

export function WorkspaceDashboard() {
    const {
        activeWorkspaceId,
        workspaces,
        pins,
        loadingKeys,
        setActiveWorkspace,
        renameWorkspace,
    } = useWorkspace();

    const { lang } = useShell();
    const loading = loadingKeys.pins;
    const activeWS = workspaces.find(w => w.id === activeWorkspaceId);

    if (!activeWS && !loading) {
        return (
            <div className="fill center stack--loose" style={{ opacity: 0.5 }}>
                <IndraIcon name="ATOM" size="48px" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em' }}>
                    RESOLVING_WORKSPACE_SOVEREIGNTY...
                </span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>

            {/* ── 1. CABECERA AGNÓSTICA ── */}
            {activeWS && (
                <IndraMacroHeader
                    atom={activeWS}
                    onClose={() => setActiveWorkspace(null)}
                    isSaving={loading}
                    onTitleChange={(newLabel) => renameWorkspace(activeWS.id, newLabel)}
                />
            )}

            {/* ── 2. ACTION RAIL (banda operativa de creación) ── */}
            <div style={{
                flexShrink: 0,
                padding: 'var(--space-3) var(--space-8)',
                borderBottom: '1px solid var(--color-border)',
                background: 'rgba(0,0,0,0.2)',
            }}>
                <ActionRail />
            </div>

            {/* ── 3. GRID DE ARTEFACTOS (área scrollable) ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-6) var(--space-8)' }}>
                {activeWS && <ArtifactGrid pins={pins} />}
            </div>

        </div>
    );
}
