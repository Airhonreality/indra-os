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
import { EditableLabel } from '../../utilities/primitives';
import { MathConfig } from './OperatorTypes/MathConfig';
import { TextConfig } from './OperatorTypes/TextConfig';
import { ResolverConfig } from './OperatorTypes/ResolverConfig';
import { ExpressionConfig } from './OperatorTypes/ExpressionConfig';
import { FilterConfig } from './OperatorTypes/FilterConfig';
import { LookupConfig } from './OperatorTypes/LookupConfig';

export function OperatorCard({ op, onUpdate, onRemove, options }) {

    const renderConfig = () => {
        const props = {
            config: op.config,
            onUpdate: (cfg) => onUpdate({ ...op, config: cfg }),
            options,
            opId: op.id
        };

        switch (op.type) {
            case 'MATH':
                return <MathConfig {...props} />;
            case 'TEXT':
                return <TextConfig {...props} />;
            case 'RESOLVER':
                return <ResolverConfig {...props} />;
            case 'EXPRESSION':
                return <ExpressionConfig {...props} />;
            case 'FILTER':
                return <FilterConfig {...props} />;
            case 'LOOKUP':
                return <LookupConfig {...props} />;
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
        <div className="stack--tight indra-container" style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--indra-ui-radius)',
            border: '1px solid var(--indra-dynamic-border)',
            position: 'relative',
            background: 'var(--color-bg-deep)',
            transition: 'all 0.3s'
        }}>
            {/* Header: Tipo + Alias + Acciones */}
            <div className="spread">
                <div className="shelf--tight">
                    <div className="badge badge--ghost" style={{ fontSize: '10px', opacity: 0.6, fontWeight: 'bold' }}>{op.type}</div>
                    <EditableLabel
                        value={op.alias || ''}
                        onCommit={(val) => updateAlias(val)}
                        placeholder="OP_ALIAS_REQUIRED"
                        style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 'bold' }}
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
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)'
            }}>
                {renderConfig()}
            </div>

            {/* Conector Visual (La Flecha) */}
            <div style={{
                position: 'absolute',
                bottom: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.2,
                color: 'var(--color-accent)'
            }}>
                <IndraIcon name="ARROW_DOWN" size="14px" />
            </div>
        </div>
    );
}
