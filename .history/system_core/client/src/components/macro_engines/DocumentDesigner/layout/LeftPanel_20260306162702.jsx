/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/LeftPanel.jsx
 * RESPONSABILIDAD: Panel dual: Árbol de capas y Fuentes de datos (IN).
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { LayerTree } from './LayerTree';

export function LeftPanel({ blocks, selectedId, onSelect, onMove, onRemove }) {
    const [tab, setTab] = useState('LAYERS'); // 'LAYERS' | 'DATA'

    return (
        <aside style={{
            width: '280px',
            background: 'var(--color-bg-surface)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* TABS ENAV */}
            <div className="shelf" style={{ borderBottom: '1px solid var(--color-border)', padding: '0 var(--space-2)' }}>
                <button
                    onClick={() => setTab('LAYERS')}
                    className={`btn btn--xs ${tab === 'LAYERS' ? 'btn--accent' : 'btn--ghost'}`}
                    style={{ flex: 1, borderRadius: 0, border: 'none' }}
                >
                    LAYERS
                </button>
                <button
                    onClick={() => setTab('DATA')}
                    className={`btn btn--xs ${tab === 'DATA' ? 'btn--accent' : 'btn--ghost'}`}
                    style={{ flex: 1, borderRadius: 0, border: 'none' }}
                >
                    DATA_SOURCE
                </button>
            </div>

            <div className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-2)' }}>
                {tab === 'LAYERS' ? (
                    <div className="stack--tight">
                        <header className="shelf--tight" style={{ padding: 'var(--space-2)', opacity: 0.4 }}>
                            <IndraIcon name="ATOM" size="10px" />
                            <span style={{ fontSize: '9px', fontWeight: 'bold' }}>DOCUMENT_HIERARCHY</span>
                        </header>
                        {blocks.map(node => (
                            <LayerTree
                                key={node.id}
                                node={node}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                onMove={onMove}
                                onRemove={onRemove}
                                depth={0}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="center fill" style={{ opacity: 0.3, fontSize: '10px' }}>
                        [IN_DATA_SOURCE_PENDING_PHASE_1]
                    </div>
                )}
            </div>
        </aside>
    );
}
