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

export function NavigatorPanel({ atom, onNotify, activeTab: controlledTab, onTabChange }) {
    const { blocks } = useAST();
    
    // ADR-002 §8.2: componente controlado — el shell eleva el estado del tab.
    const [localTab, setLocalTab] = React.useState('LAYERS');
    const tab = controlledTab !== undefined ? controlledTab : localTab;
    const setTab = onTabChange !== undefined ? onTabChange : setLocalTab;
    
    const scrollRef = useRef(null);

    // Reset scroll al cambiar de tab
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [tab]);

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

                /* Inyección de estilos de sub-componentes */
                ${LAYER_TREE_STYLES}
            `}</style>
        </aside>
    );
}
