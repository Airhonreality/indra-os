import React, { useState } from 'react';
import { ASTProvider, useAST } from './context/ASTContext';
import { SelectionProvider, useSelection } from './context/SelectionContext';
import { RecursiveBlock } from './renderer/RecursiveBlock';

const PAGE_PRESETS = {
    A4: { width: '210mm', height: '297mm', label: 'ISO A4' },
    LETTER: { width: '215.9mm', height: '279.4mm', label: 'US LETTER' },
    SQUARE: { width: '200mm', height: '200mm', label: 'SQUARE' }
};

const DEFAULT_BLOCKS = [
    {
        id: 'root',
        type: 'FRAME',
        props: {
            direction: 'column',
            padding: '20mm',
            background: '#ffffff',
            width: PAGE_PRESETS.A4.width,
            minHeight: PAGE_PRESETS.A4.height,
            alignItems: 'stretch',
            boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
            borderRadius: '2px'
        },
        children: [
            {
                id: 'header_text',
                type: 'TEXT',
                props: {
                    content: 'INDRA — AXIOMATIC_DOCUMENT',
                    fontSize: '18pt',
                    fontWeight: 'bold',
                    color: 'var(--color-accent)',
                    marginBottom: '10mm'
                }
            }
        ]
    }
];

/**
 * DocumentDesigner (Macro Engine)
 * Encapsula el estado del documento en un ASTProvider neural.
 */
export function DocumentDesigner({ atom }) {
    return (
        <ASTProvider initialBlocks={atom.payload?.blocks || DEFAULT_BLOCKS}>
            <SelectionProvider>
                <DocumentDesignerShell atom={atom} />
            </SelectionProvider>
        </ASTProvider>
    );
}

/**
 * DocumentDesignerShell (UI)
 * Renderiza la interfaz y consume el ASTContext.
 */
function DocumentDesignerShell({ atom }) {
    const { coreUrl, sessionSecret, closeArtifact } = useAppState();
    const { blocks, findNode, addNode, updateNode } = useAST();
    const { selectedId, selectNode } = useSelection();

    const [isSaving, setIsSaving] = useState(false);
    const [zoom, setZoom] = useState(0.8);

    const saveDocument = async () => {
        setIsSaving(true);
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'ATOM_UPDATE',
                context_id: atom.id,
                data: { ...atom, payload: { ...atom.payload, blocks: blocks } }
            }, coreUrl, sessionSecret);
            console.log('[DocumentDesigner] Saved successfully');
        } catch (err) {
            console.error('[DocumentDesigner] Save failed:', err);
            alert(`Fallo al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const applyPreset = (presetKey) => {
        const preset = PAGE_PRESETS[presetKey];
        if (preset && blocks[0]?.id === 'root') {
            updateNode('root', {
                props: {
                    ...blocks[0].props,
                    width: preset.width,
                    minHeight: preset.height
                }
            });
        }
    };

    return (
        <div className="fill stack--tight" style={{ background: 'var(--color-bg-void)', overflow: 'hidden' }}>

            {/* 1. CREATION_DOCK (HUD) */}
            <TopRibbon
                isSaving={isSaving}
                onSave={saveDocument}
                onAddBlock={(type) => addNode(type, selectedId)}
                onClose={closeArtifact}
            />

            <div className="fill" style={{
                display: 'flex',
                alignItems: 'stretch',
                overflow: 'hidden',
                background: 'var(--color-bg-void)'
            }}>
                {/* 2. ADAPTIVE VIEWPORT (MONITOR) */}
                <main className="fill stack" style={{
                    overflowY: 'auto',
                    overflowX: 'auto',
                    position: 'relative',
                    background: 'var(--color-bg-deep)',
                    minWidth: 0,
                    gap: 0
                }}>

                    {/* HUD: PAGINATION & PRESETS */}
                    <div className="shelf--tight" style={{
                        position: 'absolute',
                        top: 'var(--space-4)',
                        left: 'var(--space-4)',
                        zIndex: 100,
                        background: 'rgba(0,0,0,0.6)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                    }}>
                        <span style={{ fontSize: '9px', opacity: 0.5, marginRight: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}>PAGE_FORMAT:</span>
                        {Object.keys(PAGE_PRESETS).map(key => (
                            <button
                                key={key}
                                className="btn btn--xs btn--ghost"
                                style={{
                                    fontSize: '9px',
                                    borderRadius: 'var(--radius-pill)',
                                    padding: '2px 8px',
                                    background: blocks[0]?.props?.width === PAGE_PRESETS[key].width ? 'var(--color-accent-dim)' : 'transparent',
                                    color: blocks[0]?.props?.width === PAGE_PRESETS[key].width ? 'var(--color-accent)' : 'inherit'
                                }}
                                onClick={() => applyPreset(key)}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    {/* ZOOM CONTROL (BOTTOM CENTER) */}
                    <div className="glass shelf--tight" style={{
                        position: 'fixed',
                        bottom: 'var(--space-8)',
                        left: 'calc(50% - 160px)',
                        transform: 'translateX(-50%)',
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-pill)',
                        zIndex: 200,
                        border: '1px solid var(--color-border-active)',
                        boxShadow: '0 0 30px var(--color-accent-dim)'
                    }}>
                        <button className="btn btn--xs btn--ghost" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
                            <IndraIcon name="MINUS" size="10px" />
                        </button>
                        <span style={{ fontSize: '10px', width: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <button className="btn btn--xs btn--ghost" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                            <IndraIcon name="PLUS" size="10px" />
                        </button>
                        <div style={{ width: '1px', height: '12px', background: 'var(--color-border)', margin: '0 8px' }} />
                        <button className="btn btn--xs btn--ghost" onClick={() => setZoom(0.8)} style={{ fontSize: '9px' }}>BEST_FIT</button>
                    </div>

                    {/* SCALABLE CANVAS CONTAINER (The Axiomatic Viewport) */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: '120px 80px',
                        minWidth: 'fit-content', // Crítico para permitir scroll horizontal al escalar
                        minHeight: 'fit-content'
                    }}>
                        <div style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <div style={{
                                position: 'relative',
                                width: 'fit-content',
                                height: 'fit-content'
                            }}>
                                {blocks.map((rootNode) => (
                                    <RecursiveBlock key={rootNode.id} block={rootNode} />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                {/* 3. AXIOMATIC CONTROL COLUMN (RIGHT) */}
                <div className="stack--tight" style={{
                    width: '320px',
                    background: 'var(--color-bg-surface)',
                    borderLeft: '1px solid var(--color-border-strong)',
                    height: '100%',
                    overflow: 'hidden'
                }}>
                    <div style={{ height: '40%', borderBottom: '1px solid var(--color-border)' }}>
                        <NavigatorPanel atom={atom} />
                    </div>

                    <div className="fill" style={{ overflowY: 'auto' }}>
                        <PropertiesInspector />
                    </div>
                </div>
            </div>

            <style>{`.block-wrapper:hover { outline-color: var(--color-border-strong) !important; } pre, p { margin: 0; }`}</style>
        </div>
    );
}
