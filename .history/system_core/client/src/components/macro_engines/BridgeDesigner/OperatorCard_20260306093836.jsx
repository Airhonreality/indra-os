/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorCard.jsx
 * RESPONSABILIDAD: Tarjeta celular que representa una unidad de procesamiento.
 *
 * DHARMA:
 *   - Autonomía Configurativa: Cada operador sabe cómo renderizar su propia UI.
 *   - Identidad Obligatoria: Requiere un alias único para proyectarse al contexto.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';
import { MathConfig } from './OperatorTypes/MathConfig';

export function OperatorCard({ op, onUpdate, onRemove, contextBefore, onOpenSelector }) {

    const renderConfig = () => {
        switch (op.type) {
            case 'MATH':
                return <MathConfig
                    config={op.config}
                    onUpdate={(cfg) => onUpdate({ ...op, config: cfg })}
                    onOpenSelector={onOpenSelector}
                />;
            default:
                return (
                    <div style={{ fontSize: '10px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
                        [{op.type}_CONFIG_PENDING]
                    </div>
                );
        }
    };

    const updateAlias = (newAlias) => {
        onUpdate({ ...op, alias: newAlias.toLowerCase().replace(/\s+/g, '_') });
    };

    return (
        <div className="stack--tight glass" style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            position: 'relative',
            background: 'rgba(255,255,255,0.02)'
        }}>
            {/* Header: Tipo + Alias + Acciones */}
            <div className="spread">
                <div className="shelf--tight">
                    <div style={{ cursor: 'grab', opacity: 0.3 }} title="DRAG_TO_REORDER">
                        <IndraIcon name="DRAG" size="14px" />
                    </div>
                    <div className="badge badge--ghost" style={{ fontSize: '9px', opacity: 0.6 }}>{op.type}</div>
                    <input
                        type="text"
                        value={op.alias || ''}
                        onChange={(e) => updateAlias(e.target.value)}
                        placeholder="OP_ALIAS_REQUIRED..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-accent)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            outline: 'none',
                            borderBottom: '1px solid transparent'
                        }}
                        onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-accent)'}
                        onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                    />
                </div>

                <div className="shelf--tight">
                    <IndraActionTrigger
                        icon="DELETE"
                        size="10px"
                        requiresHold={true}
                        holdTime={800}
                        onClick={onRemove}
                        color="var(--color-danger)"
                    />
                </div>
            </div>

            {/* Config Area (Específica por tipo) */}
            <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--color-bg-void)',
                borderRadius: 'var(--radius-md)'
            }}>
                {/* TODO: Inyectar OperatorTypes/ Configs */}
                <div style={{ fontSize: '10px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
                    [{op.type}_CONFIG_PENDING]
                </div>
            </div>

            {/* Conector Visual (La Flecha) */}
            <div style={{
                position: 'absolute',
                bottom: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.2
            }}>
                <IndraIcon name="ARROW_DOWN" size="14px" />
            </div>
        </div>
    );
}
