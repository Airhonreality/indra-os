/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/ExtractorConfig.jsx
 * RESPONSABILIDAD: Configuración de extracción de datos de silos (Resolver).
 * =============================================================================
 */

import React, { useState } from 'react';
import { MicroSlot } from '../MicroSlot';
import ArtifactSelector from '../../../utilities/ArtifactSelector';
import { IndraIcon } from '../../../utilities/IndraIcons';

export function ExtractorConfig({ config, onUpdate, onOpenSelector }) {
    const [showSelector, setShowSelector] = useState(false);

    const toggleManualMode = () => {
        onUpdate({
            ...config,
            mode: config.mode === 'MANUAL' ? 'INFERRED' : 'MANUAL',
            silo_id: null,
            silo_label: null
        });
    };

    const selectSilo = (silo) => {
        onUpdate({
            ...config,
            silo_id: silo.id,
            silo_label: silo.handle?.label || silo.id
        });
        setShowSelector(false);
    };

    return (
        <div className="stack--tight">
            <div className="spread">
                <div className="shelf--loose fill">
                    <MicroSlot
                        value={config.pointer}
                        label={config.pointer_label}
                        onOpenSelector={() => onOpenSelector('pointer')}
                        placeholder="INPUT_ID_POINTER"
                    />

                    <div className="shelf--tight" style={{
                        paddingLeft: 'var(--space-4)',
                        borderLeft: '1px solid var(--color-border)',
                        minHeight: '24px'
                    }}>
                        <button
                            className={`btn btn--xs ${config.mode === 'MANUAL' ? 'btn--accent' : 'btn--ghost'}`}
                            onClick={toggleManualMode}
                            style={{ fontSize: '8px', padding: '2px 8px' }}
                        >
                            {config.mode === 'MANUAL' ? 'MANUAL_SILO' : 'INFERRED_SILO'}
                        </button>
                    </div>

                    {config.mode === 'MANUAL' && (
                        <div
                            className="shelf--tight glass-hover"
                            onClick={() => setShowSelector(true)}
                            style={{
                                padding: 'var(--space-1) var(--space-3)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                background: config.silo_id ? 'rgba(var(--rgb-accent), 0.05)' : 'transparent'
                            }}
                        >
                            <IndraIcon name="FOLDER" size="10px" style={{ opacity: 0.5 }} />
                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                                {config.silo_label || 'SELECT_EXT_SILO...'}
                            </span>
                        </div>
                    )}
                </div>

                {config.mode === 'INFERRED' && (
                    <div style={{ fontSize: '9px', opacity: 0.3, fontStyle: 'italic' }}>
                        * Inferred from relation schema
                    </div>
                )}
            </div>

            {showSelector && (
                <ArtifactSelector
                    onSelect={selectSilo}
                    onCancel={() => setShowSelector(false)}
                    title="EXTRACTOR_TARGET_SILO"
                />
            )}
        </div>
    );
}
