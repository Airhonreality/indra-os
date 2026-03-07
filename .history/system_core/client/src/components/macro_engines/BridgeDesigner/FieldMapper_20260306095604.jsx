/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/FieldMapper.jsx
 * RESPONSABILIDAD: Mapeo de variables de la pipeline a campos de destino físico.
 * =============================================================================
 */

import React from 'react';
import { MicroSlot } from './MicroSlot';

export function FieldMapper({ targetId, schema, mapping = {}, onUpdateMapping, onOpenSelector }) {
    if (!schema) return <div style={{ opacity: 0.3 }}>LOADING_TARGET_SCHEMA...</div>;

    return (
        <div className="stack--tight" style={{
            marginTop: 'var(--space-2)',
            padding: 'var(--space-2)',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-sm)'
        }}>
            <div className="spread" style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '8px', opacity: 0.5 }}>TARGET_FIELD</span>
                <span style={{ fontSize: '8px', opacity: 0.5 }}>PIPELINE_SLOT</span>
            </div>

            {schema.fields.map(field => {
                const mappedValue = mapping[field.id];
                const mappedLabel = mapping[field.id + '_label'];

                return (
                    <div key={field.id} className="spread" style={{ padding: 'var(--space-1) 0' }}>
                        <div className="stack--tight">
                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{field.label || field.id}</span>
                            <span style={{ fontSize: '7px', opacity: 0.3 }}>{field.type}</span>
                        </div>

                        <MicroSlot
                            value={mappedValue}
                            label={mappedLabel}
                            onOpenSelector={() => onOpenSelector(field.id)}
                            placeholder="BIND_SLOT..."
                        />
                    </div>
                );
            })}
        </div>
    );
}
