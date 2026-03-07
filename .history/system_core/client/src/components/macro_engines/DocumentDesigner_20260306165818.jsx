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

export function DocumentDesigner({ atom }) {
    const { coreUrl, sessionSecret } = useAppState();
    const [isSaving, setIsSaving] = useState(false);

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
                <main className="fill center canvas-grid" style={{
                    overflow: 'auto',
                    padding: 'var(--space-12)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start' // Permitir scroll desde arriba
                }}>
                    <div style={{
                        boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
                        background: 'white',
                        marginTop: 'var(--space-12)',
                        marginBottom: 'var(--space-12)',
                        flexShrink: 0 // Evitar que el flex lo colapse
                    }}>
                        {blocks.map(rootNode => (
                            <RecursiveBlock
                                key={rootNode.id}
                                block={rootNode}
                                isSelected={selectedId === rootNode.id}
                                onSelect={selectNode}
                            />
                        ))}
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
