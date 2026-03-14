import React, { useState } from 'react';
import { ASTProvider, useAST } from './context/ASTContext';
import { SelectionProvider, useSelection } from './context/SelectionContext';
import { RecursiveBlock } from './renderer/RecursiveBlock';
import { NavigatorPanel } from './layout/NavigatorPanel';
import { PropertiesInspector } from './inspector/PropertiesInspector';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { DataProjector } from '../../../services/DataProjector';
import { useWorkspace } from '../../../context/WorkspaceContext';

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
    // AXIOMA: Si el payload existe, aunque esté vacío, se respeta la voluntad del autor.
    // Solo usamos DEFAULT_BLOCKS si el átomo es una "hoja en blanco" total (sin payload).
    const initialBlocks = atom.payload?.blocks || (atom.payload ? [] : DEFAULT_BLOCKS);

    return (
        <ASTProvider initialBlocks={initialBlocks}>
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
    const { updatePinIdentity } = useWorkspace();
    const { blocks, findNode, addNode, updateNode, undo, redo, canUndo, canRedo } = useAST();
    const { selectedId, selectNode } = useSelection();

    const projection = DataProjector.projectArtifact(atom);
    const [localLabel, setLocalLabel] = useState(projection.title);
    const [isSaving, setIsSaving] = useState(false);
    const [zoom, setZoom] = useState(0.8);
    const [toast, setToast] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);

    const handleTitleChange = (newLabel) => {
        const cleanLabel = newLabel === '' ? 'UNTITLED_DOCUMENT' : newLabel;
        setLocalLabel(cleanLabel);
        updatePinIdentity(atom.id, atom.provider, { label: cleanLabel });
        handleManualSave(cleanLabel);
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handlePrint = () => {
        // Entrar en modo preview forzado para limpiar la pantalla
        setPreviewMode(true);
        // Pequeño delay para que React renderice el cambio antes de llamar al print del sistema
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleManualSave = async (overrideLabel = null) => {
        setIsSaving(true);
        try {
            await bridge.save({
                ...atom,
                handle: { ...atom.handle, label: overrideLabel || localLabel },
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

    React.useEffect(() => {
        const handleKeys = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                } else if (e.key === 'p') {
                    e.preventDefault();
                    handlePrint();
                }
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [undo, redo]);

    const accentColor = atom?.color || '#00f5d4';
    const dynamicStyles = {
        '--indra-dynamic-accent': accentColor,
        '--indra-dynamic-border': `${accentColor}26`,
        '--indra-dynamic-bg': `${accentColor}08`,
    };

    return (
        <div className={`macro-designer-wrapper fill ${previewMode ? 'preview-mode-active' : ''}`} style={dynamicStyles}>
            <IndraMacroHeader
                atom={atom}
                onClose={() => bridge.close()}
                isSaving={isSaving}
                onTitleChange={handleTitleChange}
                rightSlot={
                    <div className="shelf--tight">
                        <button 
                            className={`btn btn--xs ${previewMode ? 'active' : 'btn--ghost'}`}
                            onClick={() => setPreviewMode(!previewMode)}
                            style={{ 
                                borderRadius: 'var(--indra-ui-radius)',
                                border: previewMode ? '1px solid var(--indra-dynamic-accent)' : '1px solid var(--color-border)',
                                color: previewMode ? 'var(--indra-dynamic-accent)' : 'var(--color-text-secondary)',
                                background: previewMode ? 'var(--indra-dynamic-bg)' : 'transparent'
                            }}
                        >
                            <IndraIcon name="EYE" size="12px" color={previewMode ? 'var(--indra-dynamic-accent)' : 'var(--color-text-secondary)'} />
                            <span style={{ fontSize: '9px' }}>{previewMode ? 'EDIT_MODE' : 'PREVIEW'}</span>
                        </button>
                        <button 
                            className="btn btn--ghost btn--xs" 
                            onClick={handlePrint}
                            style={{ borderRadius: 'var(--indra-ui-radius)' }}
                        >
                            <IndraIcon name="FILE" size="12px" />
                            <span style={{ fontSize: '9px' }}>PDF_EXPORT</span>
                        </button>
                    </div>
                }
            />

            {!previewMode && (
                <div className="indra-container">
                    <div className="indra-header-label">DOCUMENT_COMPOSITION_ENGINE</div>
                    <IndraEngineHood
                        onUndo={undo}
                        onRedo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        leftSlot={
                            <div className="engine-hood__capsule">
                                {DataProjector.getDocumentTools().map(tool => (
                                    <button
                                        key={tool.type}
                                        className="engine-hood__btn"
                                        onClick={() => {
                                            let targetId = selectedId;
                                            if (!targetId && blocks.length > 0) { targetId = blocks[0].id; }
                                            const newId = addNode(tool.type, targetId);
                                            selectNode(newId);
                                        }}
                                        title={`INSERT ${tool.label}`}
                                    >
                                        <IndraIcon name={tool.icon} size="12px" color={tool.color} />
                                    </button>
                                ))}
                            </div>
                        }
                        rightSlot={
                            <div className="shelf--tight">
                                <div className="engine-hood__capsule" style={{ gap: '2px' }}>
                                    <button className="engine-hood__btn" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
                                        <IndraIcon name="MINUS" size="10px" color="var(--color-text-secondary)" />
                                    </button>
                                    <span className="text-hint font-mono" style={{ fontSize: '9px', minWidth: '30px', textAlign: 'center' }}>
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button className="engine-hood__btn" onClick={() => setZoom(zoom + 0.1)}>
                                        <IndraIcon name="PLUS" size="10px" color="var(--color-text-secondary)" />
                                    </button>
                                </div>

                                <div className="engine-hood__divider" />

                                <button 
                                    className="btn btn--xs" 
                                    onClick={handleManualSave}
                                    style={{ 
                                        borderRadius: 'var(--indra-ui-radius)', 
                                        padding: '2px 12px', 
                                        backgroundColor: 'var(--indra-dynamic-bg)',
                                        border: '1px solid var(--indra-dynamic-accent)',
                                        color: 'var(--indra-dynamic-accent)'
                                    }}
                                >
                                    <IndraIcon name="SAVE" size="10px" color="var(--indra-dynamic-accent)" />
                                    <span style={{ marginLeft: "6px" }}>SAVE_DOC</span>
                                </button>
                            </div>
                        }
                    />
                </div>
            )}


            <div className="designer-body fill shelf overflow-hidden" style={{ gap: 'var(--indra-ui-gap)' }}>
                {/* 2. ADAPTIVE VIEWPORT (CENTER) */}
                <div className="indra-container fill relative overflow-hidden">
                    <div className="indra-header-label">PROJECTION_REALITY_CANVAS</div>
                    <main className="fill" style={{
                        overflow: 'auto', 
                        position: 'relative',
                        background: previewMode ? 'white' : 'var(--color-bg-deep)',
                    }}>
                        {/* SCALABLE CANVAS CONTAINER */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            padding: previewMode ? '0' : '80px 40px',
                            minHeight: '100%',
                            minWidth: 'fit-content'
                        }}>
                            <div style={{
                                transform: previewMode ? 'none' : `scale(${zoom})`,
                                transformOrigin: 'top center',
                                transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                                flexShrink: 0
                            }}>
                                <div className="stack--loose indra-document-root" style={{
                                    position: 'relative',
                                    width: 'fit-content',
                                    height: 'fit-content',
                                    boxShadow: previewMode ? 'none' : '0 10px 30px rgba(0,0,0,0.5)'
                                }}>
                                    {blocks.map((rootNode) => (
                                        <RecursiveBlock key={rootNode.id} block={rootNode} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                {/* 3. CONTROL COLUMN (RIGHT) */}
                {!previewMode && (
                    <div className="indra-container" style={{ width: '320px' }}>
                        <div className="indra-header-label">DOCUMENT_STRUCTURE_NAV</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <NavigatorPanel atom={atom} onNotify={showToast} />
                        </div>
                        <div className="border-top" style={{
                            height: '400px',
                            borderColor: 'var(--indra-dynamic-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            background: 'var(--indra-dynamic-bg)'
                        }}>
                            <PropertiesInspector />
                        </div>
                    </div>
                )}
            </div>

            {/* UNIVERSAL TOAST HUD */}
            {toast && (
                <div className="glass shelf--loose" style={{
                    position: 'fixed',
                    bottom: 'var(--indra-ui-margin)',
                    right: 'var(--indra-ui-margin)',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--indra-ui-radius)',
                    border: '1px solid var(--indra-dynamic-accent)',
                    background: 'var(--indra-dynamic-bg)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 1000,
                    animation: 'slideUp 0.3s ease-out',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                    <IndraIcon name="LOGIC" size="14px" color="var(--indra-dynamic-accent)" />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'white' }}>{toast}</span>
                </div>
            )}

            <style>{`
                .block-wrapper:hover { outline-color: var(--indra-dynamic-border) !important; } 
                pre, p { margin: 0; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                
                @media print {
                    .preview-mode-active .indra-document-root {
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
