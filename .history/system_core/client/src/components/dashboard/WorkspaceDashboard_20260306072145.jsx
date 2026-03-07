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

import React, { useEffect, useState } from 'react';
import { useAppState } from '../../state/app_state';
import { executeDirective } from '../../services/directive_executor';
import { ArtifactGrid } from './ArtifactGrid';
import { ActionRail } from './ActionRail';
import { IndraIcon } from '../utilities/IndraIcons';
import { useLexicon } from '../../services/lexicon';

export function WorkspaceDashboard() {
    const { coreUrl, sessionSecret, activeWorkspaceId, workspaces } = useAppState();
    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(true);

    const activeWS = workspaces.find(w => w.id === activeWorkspaceId);


    const handleCreate = async (atomClass) => {
        // En el sistema de VACÍO, la creación es una directiva ruidosa
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
                // PIN automático al workspace actual
                await executeDirective({
                    provider: 'system',
                    protocol: 'SYSTEM_PIN',
                    workspace_id: activeWorkspaceId,
                    data: { atom: newAtom }
                }, coreUrl, sessionSecret);

                // Refrescar lista
                fetchPins();
            }
        } catch (err) {
            alert(`ERROR_CREATE: ${err.message}`);
        }
    };

    const handleOpen = (atom) => {
        console.log('[Dashboard] Opening atom:', atom);
        // Aquí se conectará con el Orquestador de Motores (Nivel 3)
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

                <div className="shelf">
                    <button className="btn btn--ghost" onClick={loadPins} disabled={loading}>
                        <IndraIcon name="SYNC" className={loading ? 'spin' : ''} />
                    </button>
                    <button className="btn btn--danger btn--sm" onClick={() => useAppState.getState().setActiveWorkspace(null)}>
                        {t('action_back')}
                    </button>
                </div>
            </header>

            {/* ── GRID DE ARTEFACTOS ── */}
            <ArtifactGrid pins={pins} onOpen={handleOpen} />

            {/* ── ACTION COMMAND RAIL ── */}
            <ActionRail onCreate={handleCreate} />

            <style jsx>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
