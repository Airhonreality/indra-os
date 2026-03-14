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

            {/* ── 4. AGENTE AXIOMÁTICO (MCEP) ── */}
            <AgentTrigger />

        </div>
    );
}

function AgentTrigger() {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
        <>
            <button 
                className="btn-agent-trigger shadow-glow"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: 'var(--space-6)',
                    right: 'var(--space-6)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: isOpen ? 'var(--color-danger)' : 'var(--color-accent)',
                    color: 'black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    transition: 'all 0.3s ease'
                }}
            >
                <IndraIcon name={isOpen ? "CLOSE" : "COGNITIVE"} size="24px" />
            </button>
            <AxiomAgent isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

import { AxiomAgent } from './AxiomAgent';

