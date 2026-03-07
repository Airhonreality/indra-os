/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/RightPanel.jsx
 * RESPONSABILIDAD: Inspector paramétrico dinámico.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export function RightPanel({ node, onUpdate, onRemove }) {
    if (!node) {
        return (
            <aside style={{ width: '320px', background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)', padding: 'var(--space-8)' }}>
                <div className="center fill stack" style={{ opacity: 0.2 }}>
                    <IndraIcon name="ATOM" size="32px" />
                    <span style={{ fontSize: '10px', marginTop: 'var(--space-4)' }}>SELECT_BLOCK_TO_INSPECT</span>
                </div>
            </aside>
        );
    }

    return (
        <aside style={{
            width: '320px',
            background: 'var(--color-bg-surface)',
            borderLeft: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <header className="spread" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="shelf--tight">
                    <IndraIcon name="SETTINGS" size="12px" style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>BLOCK_INSPECTOR</span>
                </div>
                <div className="badge badge--ghost" style={{ fontSize: '9px' }}>{node.type}</div>
            </header>

            <div className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-4)' }}>

                {/* 1. SECCIÓN: LAYOUT (Solo si no es TEXT/IMAGE puro, o para todos envolviéndolos) */}
                <div className="stack--tight">
                    <span className="util-label">LAYOUT_PARAMETRICS</span>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <div className="stack--tight">
                            <label style={{ fontSize: '9px', opacity: 0.5 }}>DIRECTION</label>
                            <select
                                value={node.props.direction || 'column'}
                                onChange={(e) => onUpdate({ props: { ...node.props, direction: e.target.value } })}
                                className="util-input--sm"
                            >
                                <option value="column">COLUMN ↓</option>
                                <option value="row">ROW →</option>
                            </select>
                        </div>
                        <div className="stack--tight">
                            <label style={{ fontSize: '9px', opacity: 0.5 }}>GAP (px)</label>
                            <input
                                type="text"
                                value={node.props.gap || ''}
                                onChange={(e) => onUpdate({ props: { ...node.props, gap: e.target.value } })}
                                className="util-input--sm"
                                placeholder="var(--space-2)"
                            />
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />

                {/* 2. SECCIÓN: ESPECÍFICA POR TIPO */}
                {node.type === 'TEXT' && (
                    <div className="stack--tight">
                        <span className="util-label">TEXT_PROPERTIES</span>
                        <textarea
                            value={node.props.content || ''}
                            onChange={(e) => onUpdate({ props: { ...node.props, content: e.target.value } })}
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                background: 'var(--color-bg-void)',
                                color: 'white',
                                border: '1px solid var(--color-border)',
                                padding: 'var(--space-2)',
                                fontSize: '12px',
                                borderRadius: 'var(--radius-sm)',
                                resize: 'vertical'
                            }}
                        />
                        <div className="shelf--tight" style={{ marginTop: 'var(--space-2)' }}>
                            <button className="btn btn--xs btn--ghost fill">
                                <IndraIcon name="PLUS" size="10px" /> INJECT_SLOT
                            </button>
                        </div>
                    </div>
                )}

                {node.type === 'IMAGE' && (
                    <div className="stack--tight">
                        <span className="util-label">SOURCE_URL</span>
                        <input
                            type="text"
                            value={node.props.src || ''}
                            onChange={(e) => onUpdate({ props: { ...node.props, src: e.target.value } })}
                            className="util-input--sm"
                            placeholder="https://..."
                        />
                    </div>
                )}

                <div className="fill" />

                {/* 3. BOTÓN DE ELIMINACIÓN */}
                <button
                    className="btn btn--xs btn--ghost"
                    style={{ color: 'var(--color-danger)', borderColor: 'rgba(255, 70, 85, 0.2)' }}
                    onClick={() => { if (confirm('DELETE_BLOCK?')) { /* removeNode call needed here or passed via prop */ } }}
                >
                    <IndraIcon name="DELETE" size="10px" /> DELETE_BLOCK
                </button>
            </div>
        </aside>
    );
}
