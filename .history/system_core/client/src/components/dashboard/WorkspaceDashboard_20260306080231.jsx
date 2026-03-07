/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/WorkspaceDashboard.jsx
 * RESPONSABILIDAD: El Orquestador de Nivel 2.
 *
 * DHARMA:
 *   - Vacío Transparente: Es un espejo del estado del Núcleo.
 *   - Orquestación Agnóstica: Conecta la Grid con el ActionRail.
 * 
 * AXIOMAS:
 *   - Solo existe si activeWorkspaceId está presente.
 *   - Despacha la creación de nuevos átomos al Backend vía ATOM_CREATE.
 * 
 * RESTRICCIONES:
 *   - No contiene lógica de negocio, solo flujo de identidad.
 * =============================================================================
 */

import React from 'react';
import { useAppState } from '../../state/app_state';
import { executeDirective } from '../../services/directive_executor';
import { ArtifactGrid } from './ArtifactGrid';
import { ActionRail } from './ActionRail';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useLexicon } from '../../services/lexicon';

export function WorkspaceDashboard() {
    const {
        coreUrl,
        sessionSecret,
        activeWorkspaceId,
        workspaces,
        pins,
        loadingKeys,
        loadPins,
        pinAtom
    } = useAppState();

    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    const loading = loadingKeys.pins;
    const activeWS = workspaces.find(w => w.id === activeWorkspaceId);

    const handleCreate = async (atomClass) => {
        const label = prompt(`${t('action_generate_ws')} (${atomClass}):`);
        if (!label) return;

        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_CREATE',
                data: {
                    class: atomClass,
                    handle: { label: label }
                }
            }, coreUrl, sessionSecret);

            if (result.items?.[0]) {
                const newAtom = result.items[0];
                await pinAtom(newAtom);
            }
        } catch (err) {
            alert(`ERROR_CREATE: ${err.message}`);
        }
    };

    const handleOpen = (atom) => {
        console.log('[Dashboard] Opening atom:', atom);
        useAppState.getState().openArtifact(atom);
    };

    const handleAction = async (protocol, atom) => {
        console.log(`[Dashboard] Executing ${protocol} on`, atom);

        try {
            if (protocol === 'ATOM_DELETE') {
                // Sinceridad Radical: Si es un PIN, desanclamos. Si es el objeto real, lo borramos.
                // En el Dashboard, los átomos son PINS, así que desanclamos por defecto.
                await useAppState.getState().unpinAtom(atom.id, atom.provider);
            } else if (protocol === 'ATOM_UPDATE') {
                // Abrir configuración (Placeholder por ahora)
                alert(`CONFIGURING: ${atom.handle?.label}`);
            } else {
                // Ejecución genérica
                await executeDirective({
                    provider: atom.provider,
                    protocol: protocol,
                    context_id: atom.id
                }, coreUrl, sessionSecret);
            }
        } catch (err) {
            alert(`ACTION_ERROR: ${err.message}`);
        }
    };

    return (
        <div className="fill stack" style={{ padding: 'var(--space-8)', paddingBottom: '100px' }}>

            {/* ── HEADER DEL WORKSPACE ── */}
            <header className="spread" style={{ marginBottom: 'var(--space-10)' }}>
                <div className="shelf--loose">
                    <div style={{ position: 'relative' }}>
                        <IndraIcon name="ATOM" size="40px" style={{ color: 'var(--color-accent)' }} />
                    </div>
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
                        onClick={() => useAppState.getState().setActiveWorkspace(null)}
                        color="var(--color-danger)"
                        activeColor="var(--color-danger)"
                        requiresHold={true}
                        holdTime={800}
                    />
                </div>
            </header>

            {/* ── GRID DE ARTEFACTOS ── */}
            <ArtifactGrid pins={pins} onOpen={handleOpen} onAction={handleAction} />

            {/* ── ACTION COMMAND RAIL ── */}
            <ActionRail onCreate={handleCreate} />

        </div>
    );
}
