/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/TopRibbon.jsx
 * RESPONSABILIDAD: Cinturón de herramientas superior (Insertores y Sync).
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

import { DataProjector } from '../../../../services/DataProjector';

export function TopRibbon({ label, onUpdateLabel, isSaving, onSave, onAddBlock, onClose, zoom, setZoom }) {
    const TOOLS = DataProjector.getDocumentTools();

    return (
        <div className="spread" style={{
            padding: 'var(--space-2) var(--space-4)',
            borderBottom: '1px solid var(--color-border-strong)',
            background: 'linear-gradient(to bottom, var(--color-bg-surface), var(--color-bg-deep))',
            zIndex: 1000,
            height: '52px'
        }}>
            {/* LEFT: Branding & Creation Tools */}
            <div className="shelf--loose">
                <div className="stack--tight" style={{ borderRight: '1px solid var(--color-border)', paddingRight: 'var(--space-4)', marginRight: 'var(--space-2)' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.2em' }}>INDRA // {isSaving ? 'SYNCING...' : 'STABLE'}</span>
                    <input
                        type="text"
                        value={label || ''}
                        onChange={(e) => onUpdateLabel(e.target.value)}
                        placeholder="DOC_NAME_REQUIRED..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'bold',
                            outline: 'none',
                            width: '200px'
                        }}
                    />
                </div>

                <div className="shelf--tight">
                    {TOOLS.map(tool => (
                        <button
                            key={tool.type}
                            className="btn btn--xs btn--ghost shelf--tight glass-hover"
                            onClick={() => onAddBlock(tool.type)}
                            title={`INSERT ${tool.label}`}
                            style={{
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-2) var(--space-3)',
                                border: '1px solid transparent',
                                background: 'transparent',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            <IndraIcon name={tool.icon} size="12px" style={{ color: 'var(--color-accent)' }} />
                            <span style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* CENTER: Viewport Controls (ZOOM CAPSULE) */}
            <div className="shelf--tight" style={{
                background: 'var(--color-bg-deep)',
                padding: '2px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-border-strong)',
                height: '32px',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), 0 0 20px rgba(var(--rgb-accent), 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
            }}>
                <button
                    className="btn btn--xs btn--ghost"
                    onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                    style={{ border: 'none', padding: 'var(--space-1)', width: '24px' }}
                    title="ZOOM_OUT"
                >
                    <IndraIcon name="MINUS" size="10px" />
                </button>

                <div style={{
                    width: '40px',
                    textAlign: 'center',
                    borderLeft: '1px solid var(--color-border)',
                    borderRight: '1px solid var(--color-border)',
                    margin: '0 var(--space-1)'
                }}>
                    <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-accent)',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em'
                    }}>
                        {Math.round(zoom * 100)}%
                    </span>
                </div>

                <button
                    className="btn btn--xs btn--ghost"
                    onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                    style={{ border: 'none', padding: 'var(--space-1)', width: '24px' }}
                    title="ZOOM_IN"
                >
                    <IndraIcon name="PLUS" size="10px" />
                </button>

                <div style={{ width: '1px', height: '14px', background: 'var(--color-border)', margin: '0 var(--space-2)' }} />

                <button
                    className="btn btn--xs btn--ghost"
                    onClick={() => setZoom(0.8)}
                    style={{
                        fontSize: '8px',
                        fontWeight: 'bold',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        padding: '0 var(--space-2)',
                        fontFamily: 'var(--font-mono)'
                    }}
                >
                    FIT
                </button>
            </div>

            {/* RIGHT: Actions */}
            <div className="shelf">
                <button
                    className={`btn btn--sm ${isSaving ? 'btn--ghost' : 'btn--accent'}`}
                    onClick={onSave}
                    disabled={isSaving}
                    style={{
                        minWidth: '180px',
                        boxShadow: isSaving ? 'none' : '0 0 20px var(--color-accent-dim)',
                        borderRadius: 'var(--radius-sm)'
                    }}
                >
                    <IndraIcon name={isSaving ? 'SYNC' : 'OK'} size="12px" className={isSaving ? 'spin' : ''} />
                    <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>{isSaving ? 'SYNCING_AST...' : 'SAVE_DOCUMENT'}</span>
                </button>

                <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 var(--space-2)' }}></div>

                <button
                    className="btn btn--sm btn--ghost"
                    onClick={onClose}
                    style={{
                        color: 'var(--color-danger)',
                        borderColor: 'transparent',
                        background: 'rgba(255, 70, 85, 0.05)'
                    }}
                >
                    <IndraIcon name="CLOSE" size="12px" />
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>EXIT</span>
                </button>
            </div>

            <style>{`
                .glass-hover:hover { border-color: var(--color-accent) !important; color: var(--color-accent) !important; background: var(--color-accent-dim) !important; }
            `}</style>
        </div>
    );
}
