/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/NavigatorPanel.jsx
 * RESPONSABILIDAD: Orquestador de navegación IZQUIERDA (Zona A).
 * (ADR_018 §3.1.2)
 *
 * REFACTOR (FASE 3):
 * - Integra WorkspaceResourcePanel reemplazando el antiguo DATA_SOURCE.
 * - Inyecta estilos globales para LayerTree y Navigator.
 * =============================================================================
 */

import React, { useRef, useEffect } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { LayerTree, LAYER_TREE_STYLES } from './LayerTree';
import { DocumentStylesPanel } from './DocumentStylesPanel';
import { useAST } from '../context/ASTContext';
import { WorkspaceResourcePanel } from './WorkspaceResourcePanel';
import { useSelection } from '../context/SelectionContext';

const CONTAINER_TYPES = new Set(['PAGE', 'FRAME', 'ITERATOR']);

const isContainerNode = (node) => Boolean(node && CONTAINER_TYPES.has(node.type));

export function NavigatorPanel({ atom, onNotify, activeTab: controlledTab, onTabChange }) {
    const { blocks, addNode, removeNode, findNode } = useAST();
    const { selectedId, deselect } = useSelection();
    
    // ADR-002 §8.2: componente controlado — el shell eleva el estado del tab.
    const [localTab, setLocalTab] = React.useState('LAYERS');
    const tab = controlledTab !== undefined ? controlledTab : localTab;
    const setTab = onTabChange !== undefined ? onTabChange : setLocalTab;
    
    const scrollRef = useRef(null);

    // Reset scroll al cambiar de tab
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [tab]);

    // Contrato determinista: el Navigator requiere un AST válido y mutadores reales.
    if (!Array.isArray(blocks)) {
        throw new Error('[NavigatorPanel] Contrato inválido: `blocks` debe ser un array.');
    }
    if (typeof addNode !== 'function' || typeof removeNode !== 'function' || typeof findNode !== 'function') {
        throw new Error('[NavigatorPanel] Contrato inválido: API de mutación AST incompleta.');
    }

    const createEntityFromLayers = (type) => {
        const selectedNode = selectedId ? findNode(selectedId) : null;
        const parentId = isContainerNode(selectedNode)
            ? selectedNode.id
            : (blocks[0]?.id || null);

        const newId = addNode(type, parentId);
        if (typeof onNotify === 'function') {
            onNotify(`ENTITY_CREATED: ${type}`);
        }
        return newId;
    };

    const deleteSelectedEntity = () => {
        if (!selectedId) {
            if (typeof onNotify === 'function') {
                onNotify('SELECCION_REQUERIDA_PARA_ELIMINAR');
            }
            return;
        }

        removeNode(selectedId);
        deselect();

        if (typeof onNotify === 'function') {
            onNotify('ENTITY_DELETED');
        }
    };

    return (
        <aside className="navigator-panel fill stack">
            {/* TABS ENAV (ADR_018 §3.1.3 - Sistema Triádico) */}
            <div className="navigator-tabs">
                <button
                    onClick={() => setTab('LAYERS')}
                    data-active={tab === 'LAYERS'}
                    className="nav-tab-btn shelf--tight center"
                    title="HIERARCHY"
                >
                    <IndraIcon name="ATOM" size="10px" />
                    <span>LAYERS</span>
                </button>
                <button
                    onClick={() => setTab('WORKSPACE')}
                    data-active={tab === 'WORKSPACE'}
                    className="nav-tab-btn shelf--tight center"
                    title="RESOURCES"
                >
                    <IndraIcon name="LAYER_STRICT" size="10px" />
                    <span>RESOURCES</span>
                </button>
                <button
                    onClick={() => setTab('STYLES')}
                    data-active={tab === 'STYLES'}
                    className="nav-tab-btn shelf--tight center"
                    title="DESIGN_SYSTEM"
                >
                    <IndraIcon name="PALETTE" size="10px" />
                    <span>THEME</span>
                </button>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="fill overflow-y-auto" ref={scrollRef}>
                {tab === 'LAYERS' && (
                    <div className="stack--none" style={{ padding: 'var(--space-2)' }}>
                        <header className="navigator-header">
                            <IndraIcon name="ATOM" size="10px" />
                            <span>DOCUMENT_HIERARCHY</span>
                        </header>

                        {/*
                          Toolbar de acciones canónicas del árbol.
                          Axioma de conexión real: cada botón dispara un mutador AST explícito.
                        */}
                        <div className="layer-toolbar" role="toolbar" aria-label="LAYERS_ACTIONS">
                            <button className="layer-toolbar-btn" title="NEW_PAGE" onClick={() => createEntityFromLayers('PAGE')}>
                                <IndraIcon name="DOCUMENT" size="10px" />
                            </button>
                            <button className="layer-toolbar-btn" title="NEW_FRAME" onClick={() => createEntityFromLayers('FRAME')}>
                                <IndraIcon name="FRAME" size="10px" />
                            </button>
                            <button className="layer-toolbar-btn" title="NEW_TEXT" onClick={() => createEntityFromLayers('TEXT')}>
                                <IndraIcon name="TEXT" size="10px" />
                            </button>
                            <button className="layer-toolbar-btn" title="NEW_IMAGE" onClick={() => createEntityFromLayers('IMAGE')}>
                                <IndraIcon name="IMAGE" size="10px" />
                            </button>
                            <button className="layer-toolbar-btn" title="NEW_ITERATOR" onClick={() => createEntityFromLayers('ITERATOR')}>
                                <IndraIcon name="REPEATER" size="10px" />
                            </button>
                            <button className="layer-toolbar-btn layer-toolbar-btn--danger" title="DELETE_SELECTED" onClick={deleteSelectedEntity}>
                                <IndraIcon name="DELETE" size="10px" />
                            </button>
                        </div>
                        
                        <div className="stack--none">
                            {blocks.map(node => (
                                <LayerTree
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {tab === 'WORKSPACE' && (
                    <WorkspaceResourcePanel 
                        atom={atom} 
                        onNotify={onNotify} 
                    />
                )}

                {tab === 'STYLES' && (
                    <DocumentStylesPanel />
                )}
            </div>

            {/* ESTILOS ENCAPSULADOS (ADR_004 AXIOMS) */}
            <style>{`
                .navigator-panel {
                    background: var(--color-bg-surface);
                    border-right: 1px solid var(--color-border);
                }

                .navigator-tabs {
                    display: flex;
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-bg-deep);
                }

                .nav-tab-btn {
                    flex: 1;
                    height: 32px;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--color-text-secondary);
                    font-size: 9px;
                    font-family: var(--font-mono);
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.05em;
                }

                .nav-tab-btn:hover {
                    background: var(--color-bg-hover);
                    color: var(--color-text-primary);
                }

                .nav-tab-btn[data-active="true"] {
                    color: var(--color-accent);
                    border-bottom-color: var(--color-accent);
                    background: var(--color-accent-dim);
                }

                .navigator-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    padding: var(--space-2);
                    opacity: 0.4;
                    font-size: 8px;
                    font-family: var(--font-mono);
                    letter-spacing: 0.1em;
                }

                .layer-toolbar {
                    display: flex;
                    align-items: center;
                    gap: var(--space-1);
                    padding: 0 var(--space-2) var(--space-2);
                }

                .layer-toolbar-btn {
                    width: 22px;
                    height: 22px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    background: var(--color-bg-elevated);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .layer-toolbar-btn:hover {
                    color: var(--color-accent);
                    border-color: var(--color-accent);
                    background: var(--color-accent-dim);
                }

                .layer-toolbar-btn--danger:hover {
                    color: var(--color-danger);
                    border-color: var(--color-danger);
                    background: rgba(255, 80, 80, 0.1);
                }

                /* Inyección de estilos de sub-componentes */
                ${LAYER_TREE_STYLES}
            `}</style>
        </aside>
    );
}
