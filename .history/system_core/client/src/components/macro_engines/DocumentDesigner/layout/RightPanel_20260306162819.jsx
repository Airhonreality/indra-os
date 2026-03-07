/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/RightPanel.jsx
 * RESPONSABILIDAD: Inspector paramétrico dinámico.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { SpacingControl } from '../../../utilities/GraphicDesignUtils/SpacingControl';
import { TypographyControl } from '../../../utilities/GraphicDesignUtils/TypographyControl';
import { AlignmentControl } from '../../../utilities/GraphicDesignUtils/AlignmentControl';

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

                {/* 1. SECCIÓN: LAYOUT */}
                <div className="stack--tight">
                    <span className="util-label">LAYOUT_PARAMETRICS</span>

                    <div className="stack--tight" style={{ background: 'rgba(255,255,255,0.03)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                        <div className="shelf--tight fill">
                            <AlignmentControl
                                items={node.props.alignItems}
                                justify={node.props.justifyContent}
                                onChange={(vals) => onUpdate({ props: { ...node.props, alignItems: vals.items, justifyContent: vals.justify } })}
                            />
                            <div className="stack--tight fill">
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
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <SpacingControl
                                label="Padding"
                                value={node.props.padding}
                                onChange={(val) => onUpdate({ props: { ...node.props, padding: val } })}
                            />
                            <SpacingControl
                                label="Gap"
                                value={node.props.gap}
                                onChange={(val) => onUpdate({ props: { ...node.props, gap: val } })}
                            />
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />

                {/* 2. SECCIÓN: ESPECÍFICA POR TIPO */}
                {node.type === 'TEXT' && (
                    <div className="stack--tight">
                        <span className="util-label">CONTENT</span>
                        <textarea
                            value={node.props.content || ''}
                            onChange={(e) => onUpdate({ props: { ...node.props, content: e.target.value } })}
                            style={{
                                width: '100%',
                                minHeight: '60px',
                                background: 'var(--color-bg-void)',
                                color: 'white',
                                border: '1px solid var(--color-border)',
                                padding: 'var(--space-2)',
                                fontSize: '11px',
                                borderRadius: 'var(--radius-sm)',
                                resize: 'vertical',
                                fontFamily: 'var(--font-mono)'
                            }}
                        />

                        <TypographyControl
                            fontSize={node.props.fontSize}
                            color={node.props.color}
                            onChange={(vals) => onUpdate({ props: { ...node.props, ...vals } })}
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
                    onClick={() => { if (confirm('DELETE_BLOCK?')) onRemove(); }}
                >
                    <IndraIcon name="DELETE" size="10px" /> DELETE_BLOCK
                </button>
            </div>
        </aside>
    );
}
