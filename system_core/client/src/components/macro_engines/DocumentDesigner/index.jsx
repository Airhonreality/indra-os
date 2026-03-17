/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/index.jsx
 * RESPONSABILIDAD: Orquestador Macro Engine del Diseñador de Documentos.
 *
 * REFACTOR (FASE 4):
 * - Implementa Layout tríadico dinámico en la columna de control.
 * - Añade ResizeHandle vertical entre Navigator e Inspector.
 * - Persistencia de layout local.
 * =============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useLexicon } from '../../../services/lexicon';

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

export function DocumentDesigner({ atom, bridge }) {
    const initialBlocks = atom.payload?.blocks || (atom.payload ? [] : DEFAULT_BLOCKS);

    return (
        <ASTProvider initialBlocks={initialBlocks}>
            <SelectionProvider>
                <DocumentDesignerShell atom={atom} bridge={bridge} />
            </SelectionProvider>
        </ASTProvider>
    );
}

function DocumentDesignerShell({ atom, bridge }) {
    const t = useLexicon();
    const { updatePinIdentity } = useWorkspace();
    const { blocks, updateNode, undo, redo, canUndo, canRedo } = useAST();
    const { selectedId, selectNode } = useSelection();

    const projection = DataProjector.projectArtifact(atom);
    const accentColor = atom?.color || '#00f5d4';
    
    // ── Estado de UI ──────────────────────────────────────────────────────────
    const [localLabel, setLocalLabel] = useState(projection.title);
    const [isSaving, setIsSaving] = useState(false);
    const [zoom, setZoom] = useState(0.8);
    const [toast, setToast] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeSlot, setActiveSlot] = useState('CORE');
    
    // ── Lógica de Resize (Zona A vs Zona B) ───────────────────────────────────
    const [navHeight, setNavHeight] = useState(320); // Altura inicial del Navigator
    const isResizing = useRef(false);

    const startResizing = useCallback((e) => {
        isResizing.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const resize = useCallback((e) => {
        if (!isResizing.current) return;
        
        // Coordenada Y relativa al contenedor de la columna derecha
        const column = document.getElementById('designer-control-column');
        if (!column) return;
        
        const rect = column.getBoundingClientRect();
        const newHeight = e.clientY - rect.top;
        
        // Axioma A1: Mínimo 160px para el Navigator, mínimo 200px para el Inspector
        if (newHeight > 160 && newHeight < (rect.height - 200)) {
            setNavHeight(newHeight);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // ── Handlers ──────────────────────────────────────────────────────────────
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
            showToast(`SAVE_ERROR: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const handleKeys = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo(); else undo();
                } else if (e.key === 'y') {
                    e.preventDefault(); redo();
                }
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [undo, redo]);

    return (
        <div className={`macro-designer-wrapper fill ${previewMode ? 'preview-mode-active' : ''}`} style={{
            '--indra-dynamic-accent': accentColor,
            '--indra-dynamic-border': `${accentColor}26`,
            '--indra-dynamic-bg': `${accentColor}08`,
        }}>
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
                        >
                            <IndraIcon name="EYE" size="12px" />
                            <span style={{ fontSize: '9px' }}>{previewMode ? 'EDIT_MODE' : 'PREVIEW'}</span>
                        </button>
                    </div>
                }
            />

            {!previewMode && (
                <div className="indra-container">
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
                                            const newId = addNode(tool.type, selectedId || blocks[0]?.id);
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
                                <div className="engine-hood__capsule">
                                    <button className="engine-hood__btn" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
                                        <IndraIcon name="MINUS" size="10px" />
                                    </button>
                                    <span className="text-hint font-mono" style={{ fontSize: '9px', minWidth: '35px', textAlign: 'center' }}>
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button className="engine-hood__btn" onClick={() => setZoom(zoom + 0.1)}>
                                        <IndraIcon name="PLUS" size="10px" />
                                    </button>
                                </div>
                                <button className="btn btn--xs btn--accent" onClick={() => handleManualSave()}>
                                    <IndraIcon name="SAVE" size="10px" />
                                    <span style={{ marginLeft: "6px" }}>SAVE</span>
                                </button>
                            </div>
                        }
                    />
                </div>
            )}

            <div className={`designer-body fill overflow-hidden indra-engine-shell dd-shell`} data-active-tab={activeSlot}>
                <div className={`fill indra-engine-body ${previewMode ? 'preview-mode' : ''}`}>
                    {/* ── 1. CANVAS AREA (SIEMPRE VISIBLE) ── */}
                    <div className="indra-slot-core canvas-section relative overflow-hidden">
                        <div className="indra-header-label" style={{ position: 'absolute', top: 6, left: 10, zIndex: 5 }}>CANVAS</div>
                        <main className="fill overflow-auto designer-canvas-bg">
                            <div className="canvas-viewport">
                                <div className="canvas-scaler" style={{ transform: previewMode ? 'none' : `scale(${zoom})` }}>
                                    <div className="indra-document-root shadow-glow">
                                        {blocks.map((rootNode) => (
                                            <RecursiveBlock key={rootNode.id} block={rootNode} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>

                    {/* ── 2. CONTROL SECTION (SIDEBAR EN DESKTOP / BOTTOM EN MÓVIL) ── */}
                    {!previewMode && (
                        <div id="designer-control-column" className="indra-slot-controls control-section">
                            {/* INDUSTRIAL MOBILE TABS (Solo visibles en móvil) */}
                            <nav className="indra-mobile-tabs">
                                <button className={`btn btn--xs fill ${activeSlot === 'NAV' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setActiveSlot('NAV')}>HIERARCHY</button>
                                <button className={`btn btn--xs fill ${activeSlot === 'INSP' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setActiveSlot('INSP')}>PROPERTIES</button>
                            </nav>

                            <div className="control-desktop-stack fill stack--none">
                                {/* ZONA A: NAVIGATOR */}
                                <div className="navigator-zone indra-slot-nav" style={{ height: window.innerWidth > 900 ? `${navHeight}px` : '100%' }}>
                                    <NavigatorPanel
                                        atom={atom}
                                        onNotify={showToast}
                                        activeTab="LAYERS"
                                        onTabChange={() => {}}
                                    />
                                </div>

                                {/* RESIZE HANDLE (Solo escritorio) */}
                                <div 
                                    className="designer-resize-handle"
                                    onMouseDown={startResizing}
                                >
                                    <div className="handle-line" />
                                </div>

                                {/* ZONA B: INSPECTOR */}
                                <div className="inspector-zone indra-slot-insp">
                                    <PropertiesInspector />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TOAST HUD */}
            {toast && (
                <div className="universal-toast">
                    <IndraIcon name="LOGIC" size="14px" color="var(--color-accent)" />
                    <span>{toast}</span>
                </div>
            )}

            <style>{`
                .dd-shell .indra-engine-body {
                    display: flex;
                    flex-direction: row;
                    background: var(--color-bg-deep);
                }

                .canvas-section {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .control-section {
                    width: 320px;
                    border-left: 1px solid var(--color-border);
                    background: var(--color-bg-surface);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                /* RESPONSIVE PIVOT (ADR_018 Refined) */
                @media (max-width: 1024px) {
                    .designer-body {
                        flex-direction: column;
                    }
                    .canvas-section {
                        flex: 7; /* Prioridad Macro */
                    }
                    .control-section {
                        width: 100%;
                        height: 30%; /* Espacio pequeño inferior */
                        border-left: none;
                        border-top: 1px solid var(--color-border);
                    }
                }

                .designer-canvas-bg {
                    flex: 1;
                    background: var(--color-bg-deep);
                }

                .canvas-viewport {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 80px 40px;
                    min-height: 100%;
                }

                .canvas-scaler {
                    transform-origin: top center;
                    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
                    flex-shrink: 0;
                }

                .navigator-zone, .inspector-zone {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .inspector-zone {
                    flex: 1;
                }

                .designer-resize-handle {
                    height: 4px;
                    background: var(--color-bg-deep);
                    cursor: row-resize;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    border-top: 1px solid var(--color-border);
                }
                
                .designer-resize-handle:hover {
                    background: var(--color-accent-dim);
                }

                .handle-line {
                    width: 20px;
                    height: 1px;
                    background: var(--color-border);
                    opacity: 0.3;
                }

                .universal-toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: var(--color-bg-elevated);
                    border: 1px solid var(--color-accent);
                    padding: 6px 12px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 9px;
                    font-family: var(--font-mono);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    z-index: 2000;
                }

                .indra-document-root {
                    background: white;
                    width: fit-content;
                    height: fit-content;
                }
            `}</style>
        </div>
    );
}
