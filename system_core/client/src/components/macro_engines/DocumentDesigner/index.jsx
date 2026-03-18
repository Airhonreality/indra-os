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
import { HonestProvider } from './renderer/HonestProvider';
import { Crystallizer } from './Crystallizer';
import { TokenDiscovery } from '../../../services/TokenDiscovery';
import { AxiomRegistry } from '../../../services/AxiomRegistry';

const PAGE_PRESETS = {
    A4: { width: '210mm', height: '297mm', label: 'ISO A4' },
    LETTER: { width: '215.9mm', height: '279.4mm', label: 'US LETTER' },
    SQUARE: { width: '200mm', height: '200mm', label: 'SQUARE' }
};

export function DocumentDesigner({ atom, bridge }) {
    // AXIOMA DE SINCERIDAD TOTAL: 
    // No inventamos materia. Si el payload está vacío, el motor es vacío.
    const initialBlocks = atom.payload?.blocks || [];
    const initialVariables = atom.payload?.variables || null;

    return (
        <ASTProvider initialBlocks={initialBlocks} initialVariables={initialVariables}>
            <SelectionProvider>
                <DocumentDesignerShell atom={atom} bridge={bridge} />
            </SelectionProvider>
        </ASTProvider>
    );
}

function DocumentDesignerShell({ atom, bridge }) {
    const t = useLexicon();
    const { updatePinIdentity } = useWorkspace();
    const { blocks, docVariables, updateNode, undo, redo, canUndo, canRedo } = useAST();
    const { selectedId, selectNode } = useSelection();

    const projection = DataProjector.projectArtifact(atom);
    const accentColor = atom?.color || '#00f5d4';
    
    // ── Estado de UI ──────────────────────────────────────────────────────────
    const [localLabel, setLocalLabel] = useState(projection.title);
    const [isSaving, setIsSaving] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // ── BOOTUP SINCERO (Sincronización de Realidad) ──
    useEffect(() => {
        async function initReality() {
            const discovered = await TokenDiscovery.discover();
            AxiomRegistry.init(discovered);
            setIsReady(true);
        }
        initReality();
    }, []);
    const [zoom, setZoom] = useState(0.8);
    const [toast, setToast] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeSlot, setActiveSlot] = useState('CORE');
    const [navigatorTab, setNavigatorTab] = useState('LAYERS');
    
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

    // ── Ref Guard para Persistencia Atómica ──────────────────────────────────
    // Evita que handleManualSave capture copias obsoletas (stale closures)
    const astRef = useRef({ blocks, docVariables });
    useEffect(() => {
        astRef.current = { blocks, docVariables };
    }, [blocks, docVariables]);

    const handleManualSave = async (overrideLabel = null) => {
        setIsSaving(true);
        try {
            const currentAST = astRef.current; // Siempre fresco

            // ── ADUANA DE CRISTALIZACIÓN (Axioma de Determinismo) ──
            const crystallizedBlocks = Crystallizer.crystallize(currentAST.blocks);

            await bridge.save({
                ...atom,
                handle: { ...atom.handle, label: overrideLabel || localLabel },
                payload: { 
                    ...atom.payload, 
                    blocks: crystallizedBlocks, 
                    variables: currentAST.docVariables 
                }
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

    if (!isReady) return (
        <div className="fill center stack text-hint font-mono">
            <div className="mini-spinner" style={{ animation: 'indra-spin 1s linear infinite', border: '2px solid var(--color-accent)', width: 24, height: 24, borderTopColor: 'transparent', borderRadius: '50%' }} />
            <br />
            <span>CALIBRANDO_REALIDAD...</span>
        </div>
    );

    return (
        <div className={`macro-designer-wrapper fill ${previewMode ? 'preview-mode-active' : ''}`} 
            data-theme="dark"
            style={{
                '--indra-dynamic-accent': accentColor,
                '--indra-dynamic-border': `${accentColor}26`,
                '--indra-dynamic-bg': `${accentColor}08`,
            }}
        >
            <IndraMacroHeader
                atom={atom}
                onClose={() => bridge.close()}
                isSaving={isSaving}
                onTitleChange={handleTitleChange}
                rightSlot={
                    <div className="shelf--tight" style={{ gap: 'var(--space-2)' }}>
                        <button 
                            className={`btn btn--xs ${previewMode ? 'btn--accent' : 'btn--ghost'}`}
                            onClick={() => setPreviewMode(!previewMode)}
                            style={{ padding: '0 12px', height: '32px', gap: '8px', borderRadius: 'var(--radius-md)' }}
                        >
                            <IndraIcon name={previewMode ? "EDIT" : "EYE"} size="12px" />
                            <span style={{ fontSize: '9px', fontWeight: '900' }}>{previewMode ? 'MODO_EDICION' : 'VISTA_PREVIA'}</span>
                        </button>

                        <div className="macro-header__divider-block" style={{ width: '1px', height: '16px', background: 'var(--color-border)', opacity: 0.3, margin: '0 4px' }} />

                        <button 
                            className="btn btn--xs btn--accent shadow-hover" 
                            onClick={() => handleManualSave()}
                            style={{ 
                                height: '32px',
                                padding: '0 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--indra-dynamic-accent)',
                                boxShadow: '0 0 15px var(--indra-dynamic-glow)'
                            }}
                        >
                            <IndraIcon name="SAVE" size="12px" />
                            <span style={{ marginLeft: "8px", fontWeight: '900', fontSize: '9px', letterSpacing: '0.05em' }}>GUARDAR</span>
                        </button>
                    </div>
                }
            />

            <div className={`designer-body fill overflow-hidden indra-engine-shell dd-shell stack`} data-active-tab={activeSlot} style={{ height: 'calc(100vh - var(--indra-header-height))' }}>
                <div className={`fill indra-engine-body ${previewMode ? 'preview-mode' : ''}`}>
                    {/* ── 1. CANVAS AREA (SIEMPRE VISIBLE) ── */}
                    <div className="indra-slot-core canvas-section relative overflow-hidden">
                        <div className="indra-header-label" style={{ position: 'absolute', top: 6, left: 10, zIndex: 5 }}>CANVAS</div>
                        <main className="fill overflow-auto designer-canvas-bg">
                            <div className="canvas-viewport">
                                <div className="canvas-scaler" style={{ transform: previewMode ? 'none' : `scale(${zoom})` }}>
                                    <HonestProvider styleContext={atom.payload?.styleContext}>
                                        <div className="indra-document-root shadow-glow">
                                            {blocks.map((rootNode) => (
                                                <RecursiveBlock key={rootNode.id} block={rootNode} />
                                            ))}
                                        </div>
                                    </HonestProvider>
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

                            <div className="control-desktop-stack fill stack">
                                {/* ZONA A: NAVIGATOR */}
                                <div className="navigator-zone indra-slot-nav" style={{ height: window.innerWidth > 900 ? `${navHeight}px` : 'auto', flexShrink: 0 }}>
                                    <NavigatorPanel
                                        atom={atom}
                                        onNotify={showToast}
                                        activeTab={navigatorTab}
                                        onTabChange={setNavigatorTab}
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
                                <div className="inspector-zone indra-slot-insp fill stack overflow-hidden">
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
                .macro-designer-wrapper {
                    display: flex;
                    flex-direction: column;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    background: var(--color-bg-void);
                }

                .dd-shell .indra-engine-body {
                    display: flex;
                    flex-direction: row;
                    background: var(--color-bg-deep);
                    height: 100%;
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
                    background: var(--color-bg-void);
                    display: flex;
                    flex-direction: column;
                    overflow: auto;
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

                .indra-mobile-tabs {
                    display: none;
                    gap: 1px;
                    background: var(--color-bg-deep);
                    border-bottom: 1px solid var(--color-border);
                    flex-shrink: 0;
                }

                @media (max-width: 900px) {
                    .indra-mobile-tabs {
                        display: flex;
                    }

                    .dd-shell[data-active-tab="NAV"] .inspector-zone { display: none; }
                    .dd-shell[data-active-tab="INSP"] .navigator-zone { display: none; }
                    .dd-shell[data-active-tab="CORE"] .control-section { display: none; } /* En móvil el canvas es core */
                    
                    .control-section {
                        height: 400px !important;
                    }
                }
            `}</style>
        </div>
    );
}
