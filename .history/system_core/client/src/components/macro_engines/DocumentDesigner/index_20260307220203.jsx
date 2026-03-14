import React, { useState } from 'react';
import { ASTProvider, useAST } from './context/ASTContext';
import { SelectionProvider, useSelection } from './context/SelectionContext';
import { RecursiveBlock } from './renderer/RecursiveBlock';
import { TopRibbon } from './layout/TopRibbon';
import { NavigatorPanel } from './layout/NavigatorPanel';
import { PropertiesInspector } from './inspector/PropertiesInspector';
import { IndraIcon } from '../../utilities/IndraIcons';

const PAGE_PRESETS = {
    A4: { width: '210mm', height: '297mm', label: 'ISO A4' },
    LETTER: { width: '215.9mm', height: '279.4mm', label: 'US LETTER' },
    SQUARE: { width: '200mm', height: '200mm', label: 'SQUARE' }
};

const DEFAULT_BLOCKS = [
    {
        id: 'root',
        type: 'PAGE',
        props: {
            width: PAGE_PRESETS.A4.width,
            minHeight: PAGE_PRESETS.A4.height,
            background: '#ffffff',
            padding: '20mm',
            direction: 'column',
            gap: '10px'
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
export function DocumentDesigner({ atom, bridge }) {
    return (
        <ASTProvider initialBlocks={atom.payload?.blocks || DEFAULT_BLOCKS}>
            <SelectionProvider>
                <DocumentDesignerShell atom={atom} bridge={bridge} />
            </SelectionProvider>
        </ASTProvider>
    );
}

/**
 * DocumentDesignerShell (UI)
 * Renderiza la interfaz y consume el ASTContext.
 */
function DocumentDesignerShell({ atom, bridge }) {
    const { blocks, findNode, addNode, updateNode } = useAST();
    const { selectedId, selectNode } = useSelection();

    const [localLabel, setLocalLabel] = useState(atom.handle?.label || 'UNTITLED_DOCUMENT');
    const [isSaving, setIsSaving] = useState(false);
    const [zoom, setZoom] = useState(0.8);
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const saveDocument = async () => {
        setIsSaving(true);
        try {
            await bridge.save({
                ...atom,
                handle: { ...atom.handle, label: localLabel },
                payload: { ...atom.payload, blocks: blocks }
            });
            showToast('DOCUMENT_SAVED_SUCCESSFULLY');
        } catch (err) {
            console.error('[DocumentDesigner] Save failed:', err);
            showToast(`SAVE_ERROR: ${err.message}`);
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
        <div
            className="fill stack--tight"
            style={{
                background: 'var(--color-bg-void)',
                height: '100%', // Crucial para el scroll
                maxHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <TopRibbon
                label={localLabel}
                onUpdateLabel={setLocalLabel}
                isSaving={isSaving}
                onSave={saveDocument}
                onAddBlock={(type) => {
                    let targetId = selectedId;
                    // Si no hay nada seleccionado, intentamos añadir al primer bloque contenedor (PAGE o FRAME)
                    if (!targetId && blocks.length > 0) {
                        const rootNode = blocks[0];
                        if (rootNode.type === 'PAGE' || rootNode.type === 'FRAME' || rootNode.type === 'ITERATOR') {
                            targetId = rootNode.id;
                        }
                    }
                    const newId = addNode(type, targetId);
                    selectNode(newId);
                }}
                onClose={() => bridge.close()}
                zoom={zoom}
                setZoom={setZoom}
            />

            <div className="fill" style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                overflow: 'hidden',
                background: 'var(--color-bg-void)',
                height: 'calc(100% - 40px)' // Descontamos el TopRibbon
            }}>
                {/* 2. ADAPTIVE VIEWPORT (CENTER) */}
                <main className="fill" style={{
                    overflow: 'auto', // Scroll real aquí
                    position: 'relative',
                    background: 'var(--color-bg-deep)',
                    minWidth: 0,
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* SCALABLE CANVAS CONTAINER (The Axiomatic Viewport) */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: '120px 80px',
                        minHeight: '100%',
                        minWidth: 'fit-content'
                    }}>
                        <div style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                            flexShrink: 0
                        }}>
                            <div className="stack--loose" style={{
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

                {/* 3. CONTROL COLUMN (RIGHT) */}
                <div style={{
                    width: '320px',
                    background: 'var(--color-bg-surface)',
                    borderLeft: '1px solid var(--color-border-strong)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    height: '100%'
                }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <NavigatorPanel atom={atom} onNotify={showToast} />
                    </div>
                    <div style={{
                        height: '400px',
                        borderTop: '2px solid var(--color-border-strong)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        <PropertiesInspector />
                    </div>
                </div>
            </div>

            {/* UNIVERSAL TOAST HUD */}
            {toast && (
                <div className="glass shelf--loose" style={{
                    position: 'fixed',
                    bottom: 'var(--space-8)',
                    right: 'var(--space-8)',
                    padding: 'var(--space-3) var(--space-6)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-accent)',
                    background: 'rgba(var(--rgb-accent), 0.1)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 1000,
                    animation: 'slideUp 0.3s ease-out',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                    <IndraIcon name="LOGIC" size="14px" style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'white' }}>{toast}</span>
                </div>
            )}

            <style>{`
                .block-wrapper:hover { outline-color: var(--color-border-strong) !important; } 
                pre, p { margin: 0; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
