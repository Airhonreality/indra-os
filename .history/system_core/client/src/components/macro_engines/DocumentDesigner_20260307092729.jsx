/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner.jsx
 * RESPONSABILIDAD: Orquestador del Motor de Plantillas y Documentos.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useDocumentAST } from './DocumentDesigner/hooks/useDocumentAST';
import { RecursiveBlock } from './DocumentDesigner/renderer/RecursiveBlock';
import { TopRibbon } from './DocumentDesigner/layout/TopRibbon';
import { LeftPanel } from './DocumentDesigner/layout/LeftPanel';
import { RightPanel } from './DocumentDesigner/layout/RightPanel';
import { useAppState } from '../../state/app_state';
import { executeDirective } from '../../services/directive_executor';
import { IndraIcon } from '../utilities/IndraIcons';

export function DocumentDesigner({ atom }) {
    const { coreUrl, sessionSecret } = useAppState();
    const [isSaving, setIsSaving] = useState(false);
    const [zoom, setZoom] = useState(0.85); // Zoom inicial para ver casi toda la página A4

    // Inicializar AST desde el payload del atom
    const {
        blocks,
        selectedNode,
        selectedId,
        selectNode,
        addNode,
        updateNode,
        moveNode,
        removeNode
    } = useDocumentAST(atom.payload?.blocks || [
        {
            id: 'root',
            type: 'FRAME',
            props: {
                direction: 'column',
                padding: 'var(--space-12)',
                background: '#ffffff',
                width: '800px',
                minHeight: '1100px',
                alignItems: 'stretch',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            },
            children: []
        }
    ]);

    const saveDocument = async () => {
        setIsSaving(true);
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'ATOM_UPDATE',
                context_id: atom.id,
                payload: { ...atom.payload, blocks: blocks }
            }, coreUrl, sessionSecret);
            console.log('[DocumentDesigner] Saved successfully');
        } catch (err) {
            console.error('[DocumentDesigner] Save failed:', err);
            alert(`Fallo al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fill stack--tight" style={{ background: 'var(--color-bg-void)', overflow: 'hidden' }}>

            {/* 1. HUD SUPERIOR (TopRibbon) */}
            <TopRibbon
                isSaving={isSaving}
                onSave={saveDocument}
                onAddBlock={(type) => addNode(type, selectedId)}
            />

            <div className="fill shelf--tight" style={{ overflow: 'hidden' }}>
                {/* 1. MONITOR CENTRAL (El documento en sí) ahora ocupa el espacio principal a la izquierda */}
                <main className="fill canvas-grid" style={{
                    overflow: 'auto',
                    padding: 'var(--space-12)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    background: 'var(--color-bg-deep)'
                }}>
                    {/* HUB DE ZOOM FLOTANTE */}
                    <div className="glass shelf--tight" style={{
                        position: 'absolute',
                        bottom: 'var(--space-8)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-pill)',
                        zIndex: 10,
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                        <button className="btn btn--xs btn--ghost" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
                            <IndraIcon name="MINUS" size="10px" />
                        </button>
                        <span style={{ fontSize: '10px', width: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <button className="btn btn--xs btn--ghost" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                            <IndraIcon name="PLUS" size="10px" />
                        </button>
                        <div style={{ width: '1px', height: '12px', background: 'var(--color-border)', margin: '0 4px' }} />
                        <button className="btn btn--xs btn--ghost" onClick={() => setZoom(0.85)}>FIT</button>
                    </div>

                    <div style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            boxShadow: '0 30px 100px rgba(0,0,0,0.5)',
                            background: 'white',
                            marginTop: 'var(--space-12)',
                            marginBottom: 'var(--space-12)',
                            flexShrink: 0,
                            border: '1px solid rgba(255,255,255,0.05)',
                            width: 'fit-content'
                        }}>
                            {blocks.map(rootNode => (
                                <RecursiveBlock
                                    key={rootNode.id}
                                    block={rootNode}
                                    isSelected={selectedId === rootNode.id}
                                    onSelect={selectNode}
                                    onUpdate={updateNode}
                                />
                            ))}
                        </div>
                    </div>
                </main>

                {/* 2. PANEL DE CONTROL UNIFICADO (A LA DERECHA) */}
                <div className="stack--tight" style={{
                    width: '320px',
                    background: 'var(--color-bg-surface)',
                    borderLeft: '1px solid var(--color-border-strong)',
                    height: '100%',
                    overflow: 'hidden'
                }}>
                    {/* Sección de Capas y Datos */}
                    <div style={{ height: '40%', borderBottom: '1px solid var(--color-border)' }}>
                        <LeftPanel
                            blocks={blocks}
                            selectedId={selectedId}
                            onSelect={selectNode}
                            onMove={moveNode}
                            onRemove={removeNode}
                            atom={atom}
                        />
                    </div>

                    {/* Sección de Inspector Paramétrico */}
                    <div className="fill" style={{ overflowY: 'auto' }}>
                        <RightPanel
                            node={selectedNode}
                            onUpdate={(newData) => updateNode(selectedId, newData)}
                            onRemove={() => removeNode(selectedId)}
                        />
                    </div>
                </div>
            </div>

            {/* Estilos específicos para desbordamientos y punteros */}
            <style>{`
                .block-wrapper:hover {
                    outline-color: var(--color-border-strong) !important;
                }
                pre, p { margin: 0; }
            `}</style>
        </div>
    );
}
