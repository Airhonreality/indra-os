/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/FieldMapper.jsx
 * RESPONSABILIDAD: Mapeo de variables de la pipeline a campos de destino físico.
 * =============================================================================
 */

import React from 'react';
import { MicroSlot } from './MicroSlot';

export function FieldMapper({ targetId, config = {}, schema, mapping = {}, onUpdateConfig, onUpdateMapping, onOpenSelector }) {
    if (!schema) return <div style={{ opacity: 0.3 }}>LOADING_TARGET_SCHEMA...</div>;

    const action = config.action || 'APPEND';

    return (
        <div className="stack--tight" style={{
            marginTop: 'var(--space-2)',
            padding: 'var(--space-2)',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-sm)'
        }}>

            <div className="shelf--loose" style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '9px', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>INTENT:</span>
                <select
                    value={action}
                    onChange={(e) => onUpdateConfig({ action: e.target.value, match_key: null })}
                    style={{
                        background: 'var(--color-bg-void)', border: '1px solid var(--color-border)', color: 'var(--color-accent)',
                        fontSize: '9px', padding: '2px 4px', borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer'
                    }}
                >
                    <option value="APPEND">INSERT (APPEND_ROW)</option>
                    <option value="UPDATE">MUTATE (UPDATE_ROW)</option>
                </select>
            </div>

            {action === 'UPDATE' && (
                <div className="shelf--loose" style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '9px', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>MATCH_PK:</span>
                    <select
                        value={config.match_key || ''}
                        onChange={(e) => onUpdateConfig({ match_key: e.target.value })}
                        style={{
                            background: 'var(--color-bg-void)', border: '1px solid var(--color-danger)', color: 'white',
                            fontSize: '9px', padding: '2px 4px', borderRadius: 'var(--radius-sm)', outline: 'none', flex: 1
                        }}
                    >
                        <option value="">-- SELECT PRIMARY KEY --</option>
                        {schema.fields.map(f => (
                            <option key={f.id} value={f.id}>{f.label || f.id}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="spread" style={{ paddingBottom: 'var(--space-1)', marginTop: 'var(--space-2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
