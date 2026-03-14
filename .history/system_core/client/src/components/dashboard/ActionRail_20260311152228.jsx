/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/ActionRail.jsx
 * RESPONSABILIDAD: El Hilo de Comandos (Tony Stark Hood).
 *
 * DHARMA:
 *   - Descubrimiento Automático (PA-17): Se hidrata de registry.getAll().
 *     Ningún motor se lista aquí manualmente. Solo los motores con
 *     manifest.canCreate:true aparecen como opción de creación.
 *   - Un nuevo motor → actualizar su init.js → aparece aquí solo.
 *
 * AXIOMAS:
 *   - El Rail no sabe qué hace cada botón, solo despacha el protocolo de creación.
 *   - Se posiciona siempre en el eje de control operativo.
 * =============================================================================
 */

import React from 'react';
import { registry } from '../../services/EngineRegistry';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';
import { useToast } from '../utilities/primitives/ToastNotification';

export function ActionRail() {
    const { lang, createArtifact } = useAppState();
    const t = useLexicon(lang);
    const { toast } = useToast();
    const [creating, setCreating] = React.useState(null);

    // ── DESCUBRIMIENTO DINÁMICO: Solo motores con canCreate:true ──
    const creatableEngines = React.useMemo(() =>
        registry.getAll().filter(e => e.manifest?.canCreate === true),
        // Se evalúa una vez al montar — el registro es estático post-boot
        []
    );

    const handleCreate = async (atomClass) => {
        setCreating(atomClass);
        try {
            await createArtifact(atomClass, `NEW_${atomClass}`);
        } catch (err) {
            console.error('[ActionRail] Create failed:', err);
            toast.error(`Error al crear ${atomClass}: ${err.message}`);
        } finally {
            setCreating(null);
        }
    };

    return (
        <div className="action-rail shelf" style={{
            padding: 'var(--space-1) var(--space-4)',
            background: 'var(--color-glass-bg)',
            backdropFilter: 'var(--blur-glass)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-pill)',
            gap: 'var(--space-2)'
        }}>
            <div className="shelf" style={{ gap: 'var(--space-1)' }}>
                {creatableEngines.map(({ atomClass, manifest }) => (
                    <div key={atomClass} className="stack--tight center" style={{ padding: '0 var(--space-2)' }}>
                        <IndraActionTrigger
                            icon={manifest.icon}
                            label={t(manifest.label) || manifest.label}
                            onClick={() => handleCreate(atomClass)}
                            color={manifest.color}
                            activeColor={manifest.color}
                            size="18px"
                            loading={creating === atomClass}
                        />
                        <span style={{
                            fontSize: '8px',
                            fontFamily: 'var(--font-mono)',
                            opacity: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            {t(manifest.label) || manifest.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
