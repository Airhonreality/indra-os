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
import { useLexicon } from '../../services/lexicon';
import { useAppState } from '../../state/app_state';
import { DataProjector } from '../../services/DataProjector';
import { EmptyState } from '../utilities/primitives';

export function ArtifactGrid({ pins }) {
    // 1. Filtrar solo artefactos operativos (Agnosticismo de Infraestructura)
    const pinsList = (pins || []).filter(p => !['FOLDER', 'ACCOUNT_IDENTITY'].includes(p.class));

    // 2. Proyectar la Grilla (Axiomático)
    const groups = DataProjector.projectGrid(pinsList);

    return (
        <div className="stack" style={{ gap: 'var(--space-12)' }}>
            {groups.length === 0 && (
                <div style={{ padding: 'var(--space-16)' }}>
                    <EmptyState
                        icon="ATOM"
                        title="WORKSPACE_AWAITING_SEED"
                        description="Crea tu primer artefacto usando el ActionRail de arriba."
                        size="lg"
                    />
                </div>
            )}

            {groups.map(group => (
                <section key={group.id} className="stack" style={{ gap: 'var(--space-4)' }}>
                    {/* Group Header: HUD Style */}
                    <div className="shelf--loose">
                        <span style={{ fontSize: '10px', color: group.color, opacity: 0.5 }}>// {group.id}</span>
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
                        {group.items.map(item => (
                            <ArtifactCard
                                key={`${item.provider}:${item.id}`}
                                atom={item.raw}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
