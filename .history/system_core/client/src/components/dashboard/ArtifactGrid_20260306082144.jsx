/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/ArtifactGrid.jsx
 * RESPONSABILIDAD: El Mapa de Calor Operativo.
 *
 * DHARMA:
 *   - Agnosticismo de Clase: Organiza átomos en slots sin conocer su tipo de antemano.
 *   - Fluidez Solar-Punk: Layout dinámico que respira según el contenido.
 * 
 * AXIOMAS:
 *   - Un grupo vacío no consume espacio electromagnético (no se renderiza).
 *   - El orden de los grupos lo determina el ENGINE_MANIFESTS.
 * 
 * RESTRICCIONES:
 *   - Prohibido el scroll interno. El Dashboard usa scroll infinito de página.
 * =============================================================================
 */

import React from 'react';
import { ArtifactCard } from './ArtifactCard';
import { ENGINE_MANIFESTS, getEngineForClass } from '../../services/engine_manifests';
import { useLexicon } from '../../services/lexicon';
import { useAppState } from '../../state/app_state';

export function ArtifactGrid({ pins, onOpen, onAction }) {
    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    // 1. Filtrar solo artefactos operativos (Excluir Infraestructura CORE)
    const pinsList = (pins || []).filter(p => !['FOLDER', 'ACCOUNT_IDENTITY'].includes(p.class));

    const groups = ENGINE_MANIFESTS.filter(e => !e.isInfrastructure).map(engine => {
        return {
            ...engine,
            items: pinsList.filter(p => p.class === engine.class)
        };
    }).filter(g => g.items.length > 0);

    // 2. Fragmento de huérfanos eliminado para mantener pureza según USER_REQUEST

    return (
        <div className="stack" style={{ gap: 'var(--space-12)' }}>
            {groups.length === 0 && (
                <div className="center stack" style={{ padding: 'var(--space-16)', opacity: 0.3 }}>
                    <div style={{ width: '40px', height: '1px', background: 'var(--color-accent)' }}></div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: 'var(--space-4)' }}>
                        EMPTY_WORKSPACE_WAITING_FOR_SEED
                    </span>
                </div>
            )}

            {groups.map(group => (
                <section key={group.class} className="stack" style={{ gap: 'var(--space-4)' }}>
                    {/* Group Header: HUD Style */}
                    <div className="shelf--loose">
                        <span style={{ fontSize: '10px', color: group.color, opacity: 0.5 }}>// {group.class}</span>
                        <h4 style={{
                            margin: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            letterSpacing: '0.3em',
                            opacity: 0.8
                        }}>
                            {group.label}
                        </h4>
                        <div style={{ height: '1px', flex: 1, background: group.color, opacity: 0.1 }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>COUNT: {group.items.length}</span>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid-auto">
                        {group.items.map(atom => (
                            <ArtifactCard
                                key={`${atom.provider}:${atom.id}`}
                                atom={atom}
                                onOpen={onOpen}
                                onAction={onAction}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
