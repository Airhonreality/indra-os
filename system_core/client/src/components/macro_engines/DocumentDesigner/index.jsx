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
import { DataProjector } from '../../../services/DataProjector';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useLexicon } from '../../../services/lexicon';
import { HonestProvider } from './renderer/HonestProvider';
import { IndraLoadingBar } from './layout/IndraLoadingBar';
import { Crystallizer } from './Crystallizer';
import { TokenDiscovery } from '../../../services/TokenDiscovery';
import { AxiomRegistry } from '../../../services/AxiomRegistry';

const MEDIA_PRESETS = {
    PRINT: { canvasBg: 'var(--color-bg-void)' },
    SCREEN: { canvasBg: 'linear-gradient(180deg, #070716 0%, #0f1030 100%)' },
    PRESENTATION: { canvasBg: 'linear-gradient(180deg, #050612 0%, #101a35 100%)' }
};

export function DocumentDesigner({ atom, bridge }) {
    // AXIOMA DE SINCERIDAD TOTAL: 
    // No inventamos materia. Si el payload está vacío, el motor es vacío.
    const initialBlocks = atom.payload?.blocks || [];
    const initialVariables = atom.payload?.variables || null;
    const initialLayoutMeta = atom.payload?.layoutMeta || null;

    return (
        <ASTProvider initialBlocks={initialBlocks} initialVariables={initialVariables} initialLayoutMeta={initialLayoutMeta}>
            <SelectionProvider>
                <DocumentDesignerShell atom={atom} bridge={bridge} />
            </SelectionProvider>
        </ASTProvider>
    );
}

function DocumentDesignerShell({ atom, bridge }) {
    const t = useLexicon();
    const { updatePinIdentity } = useWorkspace();
    const { blocks, docVariables, layoutMeta, updateLayoutMeta, setBlocks, undo, redo, canUndo, canRedo } = useAST();
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
            AxiomRegistry.inicializar(discovered);
            setIsReady(true);
        }
        initReality();
    }, []);
    const [toast, setToast] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeSlot, setActiveSlot] = useState('CORE');
    const [navigatorTab, setNavigatorTab] = useState('LAYERS');
    const canvasScrollRef = useRef(null);
    const documentRootRef = useRef(null);
    const pageHostRefs = useRef(new Map());
    const [runtimePaginationMap, setRuntimePaginationMap] = useState([]);
    
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
    // Sincronizar título local si el átomo cambia externamente
    useEffect(() => {
        setLocalLabel(projection.title);
    }, [projection.title]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    // ── Ref Guard para Persistencia Atómica ──────────────────────────────────
    // Evita que handleManualSave capture copias obsoletas (stale closures)
    const astRef = useRef({ blocks, docVariables, layoutMeta });
    useEffect(() => {
        astRef.current = { blocks, docVariables, layoutMeta };
    }, [blocks, docVariables, layoutMeta]);

    const zoom = layoutMeta?.canvas?.zoom ?? 0.8;

    const setZoom = (next) => {
        const nextZoom = typeof next === 'function' ? next(zoom) : next;
        updateLayoutMeta({
            canvas: {
                zoom: Math.max(0.2, Math.min(2.5, Number(nextZoom) || 0.8))
            }
        });
    };

    // Fit geométrico real: calcula escala en función del documento y del viewport actual.
    const fitCanvasToBounds = useCallback(() => {
        const scrollEl = canvasScrollRef.current;
        const docEl = documentRootRef.current;

        if (!scrollEl || !docEl) {
            setZoom(0.8);
            return;
        }

        const availableWidth = Math.max(100, scrollEl.clientWidth - 120);
        const availableHeight = Math.max(100, scrollEl.clientHeight - 120);
        const docWidth = Math.max(1, docEl.scrollWidth);
        const docHeight = Math.max(1, docEl.scrollHeight);

        const nextZoom = Math.min(2.5, Math.max(0.2, Math.min(availableWidth / docWidth, availableHeight / docHeight)));
        setZoom(nextZoom);
    }, [setZoom]);

    const updateCanvasSetting = (key, value) => {
        updateLayoutMeta({
            canvas: {
                [key]: value
            }
        });
    };

    const resolvedPages = React.useMemo(() => {
        const paginationGlobal = layoutMeta?.pagination || {};
        const mastersGlobal = layoutMeta?.masters || {};

        const startAt = Number.isFinite(Number(paginationGlobal.startAt))
            ? Number(paginationGlobal.startAt)
            : 1;

        let pageCursor = startAt;

        return blocks.map((rootNode) => {
            const props = rootNode?.props || {};

            if (props.pageBreakBefore === true) {
                pageCursor += 1;
            }

            const allowPageOverride = props.allowMasterOverride !== false;
            const useMasterHeader = mastersGlobal.headerEnabled === true && (!allowPageOverride || !props.headerTemplate);
            const useMasterFooter = mastersGlobal.footerEnabled === true && (!allowPageOverride || !props.footerTemplate);

            const resolvedProps = {
                ...props,
                paginationMode: props.paginationMode || paginationGlobal.mode || 'hybrid',
                showPageNumber: props.showPageNumber !== undefined
                    ? props.showPageNumber
                    : (paginationGlobal.showNumbers !== false),
                headerTemplate: useMasterHeader
                    ? (mastersGlobal.headerTemplate || '')
                    : (props.headerTemplate || ''),
                footerTemplate: useMasterFooter
                    ? (mastersGlobal.footerTemplate || 'Página {{page}}')
                    : (props.footerTemplate || 'Página {{page}}'),
                _resolvedPageNumber: pageCursor
            };

            const out = {
                pageNumber: pageCursor,
                block: {
                    ...rootNode,
                    props: resolvedProps
                }
            };

            pageCursor += props.pageBreakAfter === true ? 2 : 1;

            return out;
        });
    }, [blocks, layoutMeta]);

    // Medición de overflow real por página para paginación híbrida operativa.
    useEffect(() => {
        const measured = resolvedPages.map((entry) => {
            const host = pageHostRefs.current.get(entry.block.id);
            const pageEl = host?.querySelector('.page-block');
            const mode = entry.block?.props?.paginationMode || 'hybrid';
            const autoPaginationEnabled = mode === 'auto' || mode === 'hybrid';

            if (!pageEl) {
                return {
                    blockId: entry.block.id,
                    pageNumber: entry.pageNumber,
                    overflowPages: 0,
                    contentHeight: 0,
                    pageHeight: 0
                };
            }

            const pageHeight = Math.max(1, pageEl.clientHeight);
            const contentHeight = Math.max(1, pageEl.scrollHeight);
            const overflowPages = autoPaginationEnabled
                ? Math.max(0, Math.ceil(contentHeight / pageHeight) - 1)
                : 0;

            return {
                blockId: entry.block.id,
                pageNumber: entry.pageNumber,
                overflowPages,
                contentHeight,
                pageHeight
            };
        });

        let lastPage = 0;
        const normalized = measured.map((item) => {
            const original = resolvedPages.find(p => p.block.id === item.blockId);
            const requested = Math.max(1, Number(item.pageNumber) || 1);
            const pageBreakAfter = original?.block?.props?.pageBreakAfter === true;
            const currentPage = Math.max(requested, lastPage + 1);
            const consumed = 1 + item.overflowPages + (pageBreakAfter ? 1 : 0);

            lastPage = currentPage + consumed - 1;

            return {
                ...item,
                pageNumber: currentPage,
                consumedPages: consumed
            };
        });

        setRuntimePaginationMap(normalized);
    }, [resolvedPages, zoom, layoutMeta]);

    const effectivePages = React.useMemo(() => {
        return resolvedPages.map((entry) => {
            const runtime = runtimePaginationMap.find(m => m.blockId === entry.block.id);
            return {
                ...entry,
                pageNumber: runtime?.pageNumber || entry.pageNumber,
                overflowPages: runtime?.overflowPages || 0,
                pageHeight: runtime?.pageHeight || 0
            };
        });
    }, [resolvedPages, runtimePaginationMap]);

    // Proyección visible: páginas base + páginas virtuales de continuación por overflow.
    const renderPages = React.useMemo(() => {
        const pages = [];

        effectivePages.forEach((entry) => {
            pages.push({
                renderKey: entry.block.id,
                pageNumber: entry.pageNumber,
                block: entry.block,
                virtual: false
            });

            const overflow = Math.max(0, Number(entry.overflowPages) || 0);
            for (let index = 1; index <= overflow; index += 1) {
                const virtualId = `${entry.block.id}__continuation_${index}`;
                pages.push({
                    renderKey: virtualId,
                    pageNumber: entry.pageNumber + index,
                    virtual: true,
                    block: {
                        ...entry.block,
                        id: virtualId,
                        props: {
                            ...(entry.block?.props || {}),
                            _resolvedPageNumber: entry.pageNumber + index,
                            _virtualContinuation: true,
                            _virtualContinuationOf: entry.block.id,
                            _virtualContinuationIndex: index,
                            _virtualContinuationTotal: overflow,
                            _virtualSliceOffsetPx: Math.max(0, Math.round((entry.pageHeight || 0) * index)),
                            _virtualSliceHeightPx: Math.max(1, Math.round(entry.pageHeight || 1))
                        }
                    }
                });
            }
        });

        return pages;
    }, [effectivePages]);

    const handleManualSave = async (overrideLabel = null) => {
        setIsSaving(true);
        try {
            const currentAST = astRef.current; // Siempre fresco

            // ── ADUANA DE CRISTALIZACIÓN (Axioma de Determinismo) ──
            // Convertimos tokens vivos en Snapshots de Soberanía Atómica
            const bloquesCristalizados = Crystallizer.cristalizar(currentAST.blocks);

            const paginationMap = renderPages.map((entry) => ({
                blockId: entry.block.id,
                sourceBlockId: entry.block.props?._virtualContinuationOf || entry.block.id,
                pageNumber: entry.pageNumber,
                virtual: entry.virtual === true
            }));

            await bridge.save({
                ...atom,
                handle: { ...atom.handle, label: overrideLabel || localLabel },
                payload: { 
                    ...atom.payload, 
                    blocks: bloquesCristalizados, 
                    variables: currentAST.docVariables,
                    layoutMeta: {
                        ...currentAST.layoutMeta,
                        pagination: {
                            ...(currentAST.layoutMeta?.pagination || {}),
                            map: paginationMap
                        }
                    }
                }
            });
            showToast('DOCUMENTO_GUARDADO_CON_ÉXITO_CANÓNICO');
        } catch (err) {
            showToast(`ERROR_DE_GUARDADO_SISTÉMICO: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // ── LÓGICA DE DERIVA Y SINCRONIZACIÓN ──
    const [discrepanciasVisibles, setDiscrepanciasVisibles] = useState(false);
    useEffect(() => {
        const hayDerivaGlobal = blocks.some(b => AxiomRegistry.detectarDeriva(b.props));
        setDiscrepanciasVisibles(hayDerivaGlobal);
    }, [blocks, isReady]);

    const sincronizarMarcaActual = () => {
        // AXIOMA DE SINCRONIZACIÓN VOLUNTARIA
        // El usuario decide actualizar todos los snapshots a la marca actual
        const bloquesSincronizados = blocks.map(b => {
             const nuevasProps = { ...b.props };
             Object.keys(nuevasProps).forEach(key => {
                 const value = nuevasProps[key];
                 if (value && typeof value === 'object' && value._vinc) {
                     // Actualizamos el snapshot al valor actual de la marca
                     nuevasProps[key] = {
                         ...value,
                         _snap: AxiomRegistry.resolver(value._vinc)
                     };
                 }
             });
             return { ...b, props: nuevasProps };
        });
        
        // Reemplazo determinista de estado raíz multipágina (sin suponer id='root').
        setBlocks(bloquesSincronizados);
        showToast('DOCUMENTO_SINCRONIZADO_CON_MARCA_REGISTRADA');
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
            <IndraLoadingBar width="180px" height="5px" />
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
                bridge={bridge}
                onClose={() => bridge.close()}
                isSaving={isSaving}
                rightSlot={
                    <div className="stack--none" style={{ gap: '6px', minWidth: '320px' }}>
                        <div className="shelf--tight" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
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

                    </div>
                }
            />

            <div className={`designer-body fill overflow-hidden indra-engine-shell dd-shell stack`} data-active-tab={activeSlot} style={{ height: 'calc(100vh - var(--indra-header-height))' }}>
                <div className={`fill indra-engine-body ${previewMode ? 'preview-mode' : ''}`}>
                    {/* ── 1. CANVAS AREA (SIEMPRE VISIBLE) ── */}
                    <div className="indra-slot-core canvas-section relative overflow-hidden">
                        <div className="indra-header-label" style={{ position: 'absolute', top: 6, left: 10, zIndex: 5 }}>CANVAS</div>
                        <main
                            className="fill overflow-auto designer-canvas-bg"
                            ref={canvasScrollRef}
                            style={{
                                background: MEDIA_PRESETS[layoutMeta?.canvas?.mediaPreset || 'PRINT']?.canvasBg || 'var(--color-bg-void)'
                            }}
                        >
                            <CanvasTechnicalOverlay layoutMeta={layoutMeta} />
                            <div className="canvas-viewport">
                                <div className="canvas-scaler" style={{ transform: previewMode ? 'none' : `scale(${zoom})` }}>
                                    <HonestProvider styleContext={atom.payload?.styleContext}>
                                        <div className="indra-document-root shadow-glow" ref={documentRootRef}>
                                            {renderPages.map((entry, index) => (
                                                <div
                                                    key={entry.renderKey}
                                                    ref={(el) => {
                                                        if (entry.virtual) return;
                                                        if (el) pageHostRefs.current.set(entry.block.id, el);
                                                        else pageHostRefs.current.delete(entry.block.id);
                                                    }}
                                                >
                                                    <RecursiveBlock
                                                        block={entry.block}
                                                        pageIndex={entry.pageNumber || (index + 1)}
                                                        readOnly={entry.virtual === true}
                                                        keyPrefix={`${entry.renderKey}::`}
                                                        bridge={bridge}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </HonestProvider>
                                </div>
                            </div>
                        </main>

                        {!previewMode && (
                            <CanvasControlHood
                                layoutMeta={layoutMeta}
                                zoom={zoom}
                                onZoomOut={() => setZoom(z => z - 0.1)}
                                onZoomIn={() => setZoom(z => z + 0.1)}
                                onZoomFit={fitCanvasToBounds}
                                onCanvasChange={updateCanvasSetting}
                                overflowCount={effectivePages.reduce((acc, page) => acc + (page.overflowPages || 0), 0)}
                            />
                        )}
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
                                        bridge={bridge}
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

            {/* HUD DE DISCREPANCIAS DE DISEÑO */}
            {discrepanciasVisibles && (
                <div className="hud-deriva-realidad" style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-accent)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 10px var(--color-accent-dim)',
                    zIndex: 2001,
                    animation: 'indra-pulse-glow 2s infinite'
                }}>
                    <IndraIcon name="ALERT" size="14px" color="var(--color-accent)" />
                    <div className="stack--none">
                        <span className="font-mono text-hint" style={{ fontSize: '9px', fontWeight: 'bold' }}>CAMBIOS_DE_MARCA_DETECTADOS</span>
                        <p className="font-mono" style={{ fontSize: '7px', opacity: 0.6, margin: 0 }}>HAY_ATRIBUTOS_FUERA_DE_SINCRONÍA_CON_LA_MARCA_ACTUAL</p>
                    </div>
                    <button 
                        className="btn btn--xs btn--accent"
                        onClick={sincronizarMarcaActual}
                        style={{ height: '24px', fontSize: '8px', padding: '0 10px' }}
                    >
                        SINCRONIZAR_MARCA
                    </button>
                </div>
            )}

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

function CanvasTechnicalOverlay({ layoutMeta }) {
    const canvas = layoutMeta?.canvas || {};
    const gridSize = Math.max(4, Number(canvas.gridSize) || 10);

    return (
        <div className="canvas-tech-overlay" aria-hidden="true">
            {canvas.showGrid && (
                <div
                    className="canvas-tech-overlay__grid"
                    style={{
                        backgroundSize: `${gridSize}px ${gridSize}px`
                    }}
                />
            )}

            {canvas.showGuides && (
                <>
                    <div className="canvas-tech-overlay__guide canvas-tech-overlay__guide--v" />
                    <div className="canvas-tech-overlay__guide canvas-tech-overlay__guide--h" />
                </>
            )}

            {canvas.showRulers && (
                <>
                    <div className="canvas-tech-overlay__ruler canvas-tech-overlay__ruler--top" />
                    <div className="canvas-tech-overlay__ruler canvas-tech-overlay__ruler--left" />
                </>
            )}

            <style>{`
                .canvas-tech-overlay {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    pointer-events: none;
                }

                .canvas-tech-overlay__grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(to right, rgba(0,245,212,0.06) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,245,212,0.06) 1px, transparent 1px);
                }

                .canvas-tech-overlay__guide {
                    position: absolute;
                    background: rgba(0,245,212,0.45);
                    box-shadow: 0 0 0 1px rgba(0,245,212,0.18);
                }

                .canvas-tech-overlay__guide--v {
                    top: 0;
                    bottom: 0;
                    left: 50%;
                    width: 1px;
                    transform: translateX(-0.5px);
                }

                .canvas-tech-overlay__guide--h {
                    left: 0;
                    right: 0;
                    top: 50%;
                    height: 1px;
                    transform: translateY(-0.5px);
                }

                .canvas-tech-overlay__ruler {
                    position: absolute;
                    background: rgba(10, 10, 26, 0.92);
                    backdrop-filter: blur(2px);
                }

                .canvas-tech-overlay__ruler--top {
                    top: 0;
                    left: 18px;
                    right: 0;
                    height: 18px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    background-image: repeating-linear-gradient(
                        to right,
                        rgba(255,255,255,0.24) 0,
                        rgba(255,255,255,0.24) 1px,
                        transparent 1px,
                        transparent 20px
                    );
                }

                .canvas-tech-overlay__ruler--left {
                    top: 18px;
                    left: 0;
                    bottom: 0;
                    width: 18px;
                    border-right: 1px solid rgba(255,255,255,0.08);
                    background-image: repeating-linear-gradient(
                        to bottom,
                        rgba(255,255,255,0.24) 0,
                        rgba(255,255,255,0.24) 1px,
                        transparent 1px,
                        transparent 20px
                    );
                }
            `}</style>
        </div>
    );
}

function CanvasControlHood({ layoutMeta, zoom, onZoomOut, onZoomIn, onZoomFit, onCanvasChange, overflowCount = 0 }) {
    const canvas = layoutMeta?.canvas || {};

    return (
        <div className="canvas-hood" role="toolbar" aria-label="CANVAS_HOOD">
            <button className="canvas-hood__btn" onClick={onZoomOut} title="ZOOM_OUT">
                <IndraIcon name="MINUS" size="10px" />
            </button>

            <button className="canvas-hood__value" onClick={onZoomFit} title="FIT_VIEW">
                {Math.round(zoom * 100)}%
            </button>

            <button className="canvas-hood__btn" onClick={onZoomIn} title="ZOOM_IN">
                <IndraIcon name="PLUS" size="10px" />
            </button>

            <div className="canvas-hood__divider" />

            <select
                value={canvas.mediaPreset || 'PRINT'}
                className="canvas-hood__select"
                onChange={(e) => onCanvasChange('mediaPreset', e.target.value)}
                title="MEDIA_PRESET"
            >
                <option value="PRINT">PRINT</option>
                <option value="SCREEN">SCREEN</option>
                <option value="PRESENTATION">PRESENT</option>
            </select>

            <select
                value={canvas.unit || 'mm'}
                className="canvas-hood__select"
                onChange={(e) => onCanvasChange('unit', e.target.value)}
                title="UNIT"
            >
                <option value="mm">MM</option>
                <option value="pt">PT</option>
                <option value="px">PX</option>
            </select>

            <button className={`canvas-hood__toggle ${canvas.showRulers ? 'is-on' : ''}`} onClick={() => onCanvasChange('showRulers', !canvas.showRulers)} title="RULERS">
                R
            </button>
            <button className={`canvas-hood__toggle ${canvas.showGuides ? 'is-on' : ''}`} onClick={() => onCanvasChange('showGuides', !canvas.showGuides)} title="GUIDES">
                G
            </button>
            <button className={`canvas-hood__toggle ${canvas.showGrid ? 'is-on' : ''}`} onClick={() => onCanvasChange('showGrid', !canvas.showGrid)} title="GRID">
                #
            </button>
            <button className={`canvas-hood__toggle ${canvas.snapToGrid ? 'is-on' : ''}`} onClick={() => onCanvasChange('snapToGrid', !canvas.snapToGrid)} title="SNAP">
                S
            </button>

            {overflowCount > 0 && (
                <span className="canvas-hood__overflow" title="AUTO_PAGINATION_OVERFLOW">
                    +{overflowCount}P
                </span>
            )}

            <style>{`
                .canvas-hood {
                    position: absolute;
                    bottom: 14px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    height: 34px;
                    padding: 0 10px;
                    border-radius: 999px;
                    border: 1px solid var(--color-border-strong);
                    background: rgba(11, 11, 24, 0.85);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 10px 32px rgba(0,0,0,0.4);
                }

                .canvas-hood__btn,
                .canvas-hood__value,
                .canvas-hood__toggle {
                    height: 22px;
                    min-width: 22px;
                    padding: 0 7px;
                    border: 1px solid var(--color-border);
                    border-radius: 999px;
                    background: var(--color-bg-elevated);
                    color: var(--color-text-secondary);
                    font-size: 9px;
                    font-family: var(--font-mono);
                    cursor: pointer;
                }

                .canvas-hood__value {
                    min-width: 48px;
                    color: var(--color-accent);
                    font-weight: 900;
                }

                .canvas-hood__select {
                    height: 22px;
                    border: 1px solid var(--color-border);
                    border-radius: 999px;
                    background: var(--color-bg-elevated);
                    color: var(--color-text-secondary);
                    font-size: 8px;
                    font-family: var(--font-mono);
                    padding: 0 8px;
                }

                .canvas-hood__toggle.is-on {
                    color: var(--color-accent);
                    border-color: var(--color-accent);
                    background: var(--color-accent-dim);
                }

                .canvas-hood__divider {
                    width: 1px;
                    height: 16px;
                    background: var(--color-border);
                    opacity: 0.5;
                }

                .canvas-hood__overflow {
                    height: 20px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 8px;
                    border-radius: 999px;
                    background: rgba(255, 80, 80, 0.12);
                    border: 1px solid rgba(255, 80, 80, 0.4);
                    color: #ff9fa8;
                    font-size: 8px;
                    font-family: var(--font-mono);
                    font-weight: 900;
                    letter-spacing: 0.04em;
                }
            `}</style>
        </div>
    );
}
