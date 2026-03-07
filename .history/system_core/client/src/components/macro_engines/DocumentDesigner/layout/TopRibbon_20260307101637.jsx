/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/TopRibbon.jsx
 * RESPONSABILIDAD: Cinturón de herramientas superior (Insertores y Sync).
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

export function TopRibbon({ isSaving, onSave, onAddBlock, onClose }) {
    const TOOLS = [
        { type: 'FRAME', label: 'FRAME', icon: 'ATOM' },
        { type: 'TEXT', label: 'TEXT', icon: 'TEXT' },
        { type: 'IMAGE', label: 'IMAGE', icon: 'IMAGE' },
        { type: 'ITERATOR', label: 'ITERATOR', icon: 'REPEATER' }
    ];

    return (
        <div className="spread glass" style={{
            padding: 'var(--space-2) var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            zIndex: 100
        }}>
            <div className="shelf--loose">
                <div className="stack--tight" style={{ borderRight: '1px solid var(--color-border)', paddingRight: 'var(--space-4)', marginRight: 'var(--space-2)' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', opacity: 0.4, letterSpacing: '0.1em' }}>CREATION_DOCK</span>
                    <span style={{ fontSize: '7px', opacity: 0.3 }}>v1.0_CANONICAL</span>
                </div>

                {TOOLS.map(tool => (
                    <button
                        key={tool.type}
                        className="btn btn--sm btn--ghost shelf--tight glass-hover"
                        onClick={() => onAddBlock(tool.type)}
                        style={{
                            borderRadius: 'var(--radius-sm)',
                            padding: 'var(--space-2) var(--space-4)',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255,255,255,0.02)'
                        }}
                    >
                        <IndraIcon name="PLUS" size="10px" style={{ position: 'absolute', top: '-4px', right: '-4px', color: 'var(--color-accent)' }} />
                        <IndraIcon name={tool.icon} size="14px" style={{ color: 'var(--color-accent)' }} />
                        <div className="stack--tight" style={{ alignItems: 'flex-start', gap: 0 }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{tool.label}</span>
                            <span style={{ fontSize: '7px', opacity: 0.4 }}>INSERT_BLOCK</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="shelf">
                <button
                    className={`btn btn--sm ${isSaving ? 'btn--ghost' : 'btn--accent'}`}
                    onClick={onSave}
                    disabled={isSaving}
                    style={{ minWidth: '140px' }}
                >
                    <IndraIcon name={isSaving ? 'SYNC' : 'OK'} size="12px" className={isSaving ? 'spin' : ''} />
                    <span>{isSaving ? 'SYNCING_AST...' : 'SAVE_DOCUMENT'}</span>
                </button>

                <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 var(--space-2)' }}></div>

                <button
                    className="btn btn--sm btn--ghost"
                    onClick={onClose}
                    style={{ color: 'var(--color-danger)', borderColor: 'rgba(255, 70, 85, 0.2)' }}
                >
                    <IndraIcon name="CLOSE" size="14px" />
                    <span>EXIT</span>
                </button>
            </div>
        </div>
    );
}
