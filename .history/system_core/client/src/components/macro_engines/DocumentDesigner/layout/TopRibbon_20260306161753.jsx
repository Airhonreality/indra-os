/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/TopRibbon.jsx
 * RESPONSABILIDAD: Cinturón de herramientas superior (Insertores y Sync).
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export function TopRibbon({ isSaving, onSave, onAddBlock }) {
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
                <span style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>BLOCKS_DOCK:</span>
                {TOOLS.map(tool => (
                    <button
                        key={tool.type}
                        className="btn btn--xs btn--ghost shelf--tight"
                        onClick={() => onAddBlock(tool.type)}
                        style={{ borderRadius: 'var(--radius-pill)', padding: '4px 12px' }}
                    >
                        <IndraIcon name={tool.icon} size="10px" />
                        <span style={{ fontSize: '10px' }}>{tool.label}</span>
                    </button>
                ))}
            </div>

            <button
                className={`btn btn--sm ${isSaving ? 'btn--ghost' : 'btn--accent'}`}
                onClick={onSave}
                disabled={isSaving}
                style={{ minWidth: '120px' }}
            >
                <IndraIcon name={isSaving ? 'SYNC' : 'OK'} size="12px" className={isSaving ? 'spin' : ''} />
                <span>{isSaving ? 'SYNCING_AST...' : 'SAVE_DOCUMENT'}</span>
            </button>
        </div>
    );
}
