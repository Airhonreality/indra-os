/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/WorkspaceDashboard.jsx
 * RESPONSABILIDAD: Orquestador del Nivel 2 (Workspace activo).
 *
 * LAYOUT CANÓNICO (Dharma Tríptico):
 *   1. IndraMacroHeader  → flex-shrink: 0  (identidad del workspace)
 *   2. ArtifactGrid      → flex: 1         (área operativa scrollable: I, II, III)
 *
 * AXIOMAS:
 *   - El autodescubrimiento de motores (Dharma) ocurre dentro del ArtifactGrid.
 *   - El título es editable directamente desde la cabecera.
 * =============================================================================
 */

import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useShell } from '../../context/ShellContext';
import { ArtifactGrid } from './ArtifactGrid';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraMacroHeader } from '../utilities/IndraMacroHeader';
import { useLexicon } from '../../services/lexicon';
import ArtifactSelector from '../utilities/ArtifactSelector';
import { useAppState } from '../../state/app_state';
import { LofiFractalBackground } from '../utilities/LofiFractalBackground';

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
    const t = useLexicon(lang);
    const { pinAtom, isGlobalSelectorOpen, closeSelector } = useAppState();

    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const loading = loadingKeys.pins || loadingKeys.workspaces;
    const activeWS = workspaces.find(w => w.id === activeWorkspaceId);

    const handleResonate = (atom) => {
        pinAtom(atom);
        setIsSelectorOpen(false);
        if (closeSelector) closeSelector();
    };

    const isOpen = isSelectorOpen || isGlobalSelectorOpen;

    // AXIOMA: Si no hay workspace activo después de cargar, volvemos a Nexus o mostramos error.
    if (!activeWS && !loading) {
        return (
            <div className="fill center stack--loose" style={{ opacity: 0.5 }}>
                <IndraIcon name="ATOM" size="64px" style={{ opacity: 0.2, marginBottom: '20px' }} />
                <div className="stack--2xs center">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em' }}>
                        ERROR: MATERIA_NO_ENCONTRADA
                    </span>
                    <button className="btn btn--ghost btn--xs" onClick={() => setActiveWorkspace(null)} style={{ marginTop: '20px', color: 'var(--color-accent)' }}>
                        VOLVER_AL_NEXO
                    </button>
                </div>
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
                    rightSlot={
                        <div className="shelf--tight">
                             <button 
                                className="btn btn--ghost btn--mini" 
                                style={{ color: 'var(--color-accent)', border: '1px solid rgba(0, 255, 200, 0.2)' }}
                                onClick={() => {
                                    if (window.confirm('¿Deseas reconstruir el Ledger de este Workspace?\nSe sincronizará el índice con la realidad física de Drive.')) {
                                        useAppState.getState().rebuildLedger();
                                    }
                                }}
                            >
                                <IndraIcon name="SYNC" size="12px" />
                                <span style={{ marginLeft: '6px', fontSize: '9px' }}>RECONSTRUIR_LEDGER</span>
                            </button>
                        </div>
                    }
                />
            )}

            {/* ── 2. GRID DE ARTEFACTOS (área operativa fractal) ── */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                <LofiFractalBackground />
                {activeWS && <ArtifactGrid pins={pins} onResonate={() => setIsSelectorOpen(true)} />}
            </div>

            {/* Selector de Resonancia (Universal Invocation) */}
            {isOpen && (
                <ArtifactSelector 
                    title="INSPECTOR DE ENTIDADES"
                    onSelect={handleResonate}
                    onCancel={() => { setIsSelectorOpen(false); if (closeSelector) closeSelector(); }}
                />
            )}

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
                className="btn-agent-trigger shadow-glow breathing-pulse"
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
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 20px var(--color-accent-glow)'
                }}
            >
                <IndraIcon name={isOpen ? "CLOSE" : "COGNITIVE"} size="24px" />
            </button>
            <AxiomAgent isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

import { AxiomAgent } from './AxiomAgent';

