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
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';

export function ActionRail() {
    const { lang, createArtifact } = useAppState();
    const t = useLexicon(lang);
    const [creating, setCreating] = React.useState(null);

    const handleCreate = async (atomClass) => {
        setCreating(atomClass);
        try {
            await createArtifact(atomClass, `NEW_${atomClass}`);
        } catch (err) {
            console.error('[ActionRail] Create failed:', err);
        } finally {
            setCreating(null);
        }
    };

    const ENGINES = [
        { class: 'DATA_SCHEMA', icon: 'SCHEMA', label: 'DATA_SCHEMA', color: 'var(--color-accent)' },
        { class: 'BRIDGE', icon: 'BRIDGE', label: 'LOGIC_BRIDGE', color: 'var(--color-cold)' }
    ];

    return (
        <div className="action-rail shelf" style={{
            padding: 'var(--space-1) var(--space-4)',
            background: 'var(--color-glass-bg)',
            backdropFilter: 'var(--blur-glass)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-pill)',
            gap: 'var(--space-2)'
        }}>
            <div className="shelf" style={{ borderRight: '1px solid var(--color-border)', paddingRight: 'var(--space-4)', marginRight: 'var(--space-2)' }}>
                <IndraIcon name="FLOW" style={{ color: 'var(--color-accent)', opacity: 0.5 }} />
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', opacity: 0.5 }}>ACTION_COMMANDS</span>
            </div>

            <div className="shelf" style={{ gap: 'var(--space-1)' }}>
                {ENGINES.map(engine => (
                    <div key={engine.class} className="stack--tight center" style={{ padding: '0 var(--space-2)' }}>
                        <IndraActionTrigger
                            icon={engine.icon}
                            label={t(engine.label)}
                            onClick={() => handleCreate(engine.class)}
                            color={engine.color}
                            activeColor={engine.color}
                            size="18px"
                            loading={creating === engine.class}
                        />
                        <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>{t(engine.label)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
