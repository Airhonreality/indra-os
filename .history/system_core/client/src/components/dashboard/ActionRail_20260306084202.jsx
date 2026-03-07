/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/ActionRail.jsx
 * RESPONSABILIDAD: El Hilo de Comandos (Tony Stark Hood).
 *
 * DHARMA:
 *   - Descubrimiento Automático: Se hidrata de ENGINE_MANIFESTS.
 *   - Simplicidad Stark: Una sola línea de acciones flotantes.
 * 
 * AXIOMAS:
 *   - El Rail no sabe qué hace cada botón, solo despacha el protocolo de creación.
 *   - Se posiciona siempre en el eje de control operativo.
 * 
 * RESTRICCIONES:
 *   - NO debe ocupar espacio visual si no hay interacción.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { ENGINE_MANIFESTS } from '../../services/engine_manifests';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';

export function ActionRail({ onCreate }) {
    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    // DEFINICIÓN DETERMINISTA DE MOTORES (Cero Burocracia)
    const ENGINES = [
        { class: 'DATA_SCHEMA', icon: 'SCHEMA', label: 'DATA_SCHEMA', color: 'var(--color-accent)' },
        { class: 'BRIDGE', icon: 'BRIDGE', label: 'LOGIC_BRIDGE', color: 'var(--color-cold)' }
    ];

    return (
        <div className="action-rail shelf" style={{
            position: 'fixed',
            bottom: 'var(--space-8)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-glass-bg)',
            backdropFilter: 'var(--blur-glass)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            gap: 'var(--space-2)'
        }}>
            <div className="shelf" style={{ borderRight: '1px solid var(--color-border)', paddingRight: 'var(--space-4)', marginRight: 'var(--space-2)' }}>
                <IndraIcon name="FLOW" style={{ color: 'var(--color-accent)', opacity: 0.5 }} />
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', opacity: 0.5 }}>ACTION_COMMANDS</span>
            </div>

            {ENGINES.map(engine => (
                <button
                    key={engine.class}
                    className="btn btn--ghost btn--sm action-btn"
                    onClick={() => onCreate(engine.class)}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        transition: 'all var(--transition-fast)',
                        opacity: 0.7
                    }}
                >
                    <IndraIcon name={engine.icon} size="16px" style={{ color: engine.color }} />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{t(engine.label)}</span>
                </button>
            ))}
        </div>
    );
}
