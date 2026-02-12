import React from 'react';
import StarkInput from './atoms/StarkInput';
import StarkButton from './atoms/StarkButton';
import StarkBadge from './atoms/StarkBadge';

/**
 * FACTORY: UnitFactory
 * DHARMA: El Gran Tejedor de Manifestaciones.
 */
/**
 * FACTORY: UnitFactory
 * DHARMA: El Gran Tejedor de Manifestaciones.
 * VERSION: 7.2.0 (Behavior-Aware)
 */

const BEHAVIOR_ICONS = {
    GATE: '🔐',
    STREAM: '📡',
    PROBE: '🔍',
    BRIDGE: '🌉',
    SCHEMA: '🧬',
    TRIGGER: '⚡',
    TRANSFORM: '⚙️',
    SENSOR: '👁️'
};

const UnitFactory = {
    /**
     * PROYECTO: Manifiesta la realidad física de un Host de Artefactos.
     * DHARMA: Cada Artefacto mantiene su linaje e interpreta su comportamiento IO.
     */
    project: (law, isIgnited) => {
        if (!law) return null;

        const artefacts = law.artefacts || [];

        if (artefacts.length === 0) {
            return (
                <div className="stark-empty-host stack-v center" style={{ opacity: 0.3, padding: '40px 0' }}>
                    <span className="text-dim">Esperando herencia del Core...</span>
                </div>
            );
        }

        return artefacts.map((artefact, index) => {
            const rawSchemas = artefact.schemas || {};
            const rawMethods = artefact.methods || {};

            // 1. Destilación de Schemas (Fields)
            // Si el schema es un objeto con metadatos (Behavior), extraemos su valor real
            const fields = Object.keys(rawSchemas).map(key => {
                const meta = rawSchemas[key];
                const isBehavioral = meta && typeof meta === 'object';
                return {
                    id: key,
                    label: key.toUpperCase(),
                    value: isBehavioral ? (meta.value || "LOCKED") : meta,
                    behavior: isBehavioral ? meta.io_behavior : "DATA",
                    description: isBehavioral ? meta.description : null
                };
            });

            // 2. Destilación de Methods (Actions)
            const actions = (Array.isArray(rawMethods) ? rawMethods : Object.keys(rawMethods)).map(key => {
                const meta = typeof rawMethods === 'object' ? rawMethods[key] : null;
                const intent = (meta && meta.semantic_intent) || "GENERIC";
                return {
                    id: key,
                    label: key.replace(/_/g, ' '),
                    intent: intent,
                    description: meta && meta.description
                };
            });

            return (
                <div key={artefact.id} className="stark-artefact-block stack-v" style={{
                    marginBottom: index === artefacts.length - 1 ? 0 : '24px',
                    borderLeft: `2px solid var(--omd-accent)`,
                    paddingLeft: '16px',
                    position: 'relative'
                }}>
                    {/* Artefact Lineage */}
                    <div className="artefact-header stack-h" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div className="stack-v">
                            <span className="artefact-label" style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '1px',
                                color: 'var(--omd-accent)'
                            }}>
                                {artefact.label.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '7px', opacity: 0.3, fontBold: 'mono' }}>{artefact.role} // {artefact.domain}</span>
                        </div>
                        <StarkBadge label={artefact.intent} status="COMPLETE" />
                    </div>

                    {/* Proyección de Fields (Schemas) */}
                    {fields.length > 0 && (
                        <div className="stack-v" style={{ gap: '10px', width: '100%', marginBottom: '16px' }}>
                            {fields.map(field => (
                                <StarkInput
                                    key={field.id}
                                    label={`${BEHAVIOR_ICONS[field.behavior] || ''} ${field.label}`}
                                    value={field.value}
                                    placeholder={field.description || `Valor de ${field.label}...`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Proyección de Acciones (Methods) */}
                    {actions.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                            {actions.map(action => (
                                <StarkButton
                                    key={action.id}
                                    label={`${BEHAVIOR_ICONS[action.intent] || ''} ${action.label}`}
                                    isIgnited={isIgnited}
                                    variant={action.intent === 'TRIGGER' ? 'primary' : 'ghost'}
                                    onClick={() => console.log(`🚀 [UnitFactory] Ejecución: ${artefact.id} -> ${action.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        });
    }
};

export default UnitFactory;
