/**
 * =============================================================================
 * ARTEFACTO: components/utilities/SlotSelector.jsx
 * RESPONSABILIDAD: Buscador de variables (slots) en el contexto de la pipeline.
 *
 * DHARMA:
 *   - Precisión Semántica: Agrupa variables por origen (Source/Op).
 *   - Agnosticismo de Tipo: Filtra variables por compatibilidad de datos.
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IndraIcon } from './IndraIcons';
import { IndraFractalTree } from './IndraFractalTree';
import { useAppState } from '../../state/app_state';
import { executeDirective } from '../../services/directive_executor';

export function SlotSelector({ contextStack, onSelect, onCancel, filterType = null }) {
    const { coreUrl, sessionSecret, activeWorkspaceId, workspaces } = useAppState();
    const [treeData, setTreeData] = useState([]);

    // AXIOMA: Escape de emergencia (Ergonomía de Enfoque Volátil)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    // ── GÉNESIS DEL ÁRBOL SINCERADO ──
    useEffect(() => {
        const localNodes = [];
        
        // 1. Rama de Contexto Local (Gatillos y Pasos Previos)
        const sources = contextStack?.sources || {};
        const ops = contextStack?.ops || {};

        const localChildren = [];

        // Procesar Sources
        Object.entries(sources).forEach(([alias, schema]) => {
            const fields = schema.fields || [];
            localChildren.push({
                id: `local.source.${alias}`,
                label: `ENTRADA: ${alias.toUpperCase()}`,
                icon: 'EYE',
                children: fields.map(f => ({
                    id: `$payload.${f.id}`,
                    label: f.label || f.id,
                    path: f.id === 'all' ? '$payload' : `$payload.${f.id}`,
                    isLeaf: true,
                    type: f.type,
                    icon: 'LINK'
                }))
            });
        });

        // Procesar Pasos
        Object.entries(ops).forEach(([alias, opResult]) => {
            const fields = opResult.fields || [];
            localChildren.push({
                id: `local.op.${alias}`,
                label: `FLUJO: ${alias.toUpperCase()}`,
                icon: 'LOGIC',
                children: fields.map(f => ({
                    id: `$steps.${alias}.${f.id}`,
                    label: f.label || f.id,
                    path: f.id === 'all' ? `$steps.${alias}.0` : `$steps.${alias}.0.${f.id}`,
                    isLeaf: true,
                    type: f.type,
                    icon: 'LINK'
                }))
            });
        });

        localNodes.push({
            id: 'local_root',
            label: 'CONTEXTO_LOCAL',
            icon: 'LOGIC',
            children: localChildren
        });

        // 2. Rama de Workspace Activo (Explorador de Átomos)
        const activeWs = workspaces.find(w => w.id === activeWorkspaceId);
        localNodes.push({
            id: 'ws_root',
            label: activeWs?.handle?.label || 'WORKSPACE_ACTIVO',
            icon: 'LAYERS',
            isWs: true,
            workspaceId: activeWorkspaceId
        });

        // 3. Rama de Mundos Externos (Descubrimiento Global)
        const otherWs = workspaces.filter(w => w.id !== activeWorkspaceId);
        if (otherWs.length > 0) {
            localNodes.push({
                id: 'external_root',
                label: 'MUNDOS_EXTERNOS',
                icon: 'GLOBE',
                children: otherWs.map(w => ({
                    id: `ws.${w.id}`,
                    label: w.handle?.label || w.id,
                    icon: 'LAYERS',
                    isWs: true,
                    workspaceId: w.id
                }))
            });
        }

        setTreeData(localNodes);
    }, [contextStack, activeWorkspaceId, workspaces]);

    // ── RESONANCIA ASÍNCRONA (Lazy Loading) ──
    const handleExpandBranch = async (node) => {
        if (!coreUrl || !sessionSecret) return;

        // Caso A: Expandir un Workspace -> Listar Átomos (Pins)
        if (node.isWs) {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_PINS_READ',
                workspace_id: node.workspaceId
            }, coreUrl, sessionSecret);
            
            const atoms = (result.items || [])
                .filter(a => ['DATA_SCHEMA', 'BRIDGE', 'DOCUMENT', 'WORKFLOW'].includes(a.class));

            node.children = atoms.map(a => ({
                id: `atom.${a.id}`,
                label: a.handle?.label || a.id,
                icon: a.class === 'DATA_SCHEMA' ? 'SCHEMA' : a.class === 'WORKFLOW' ? 'TIME' : 'DOC',
                isAtom: true,
                atomId: a.id,
                atomClass: a.class
            }));
            setTreeData([...treeData]); // Forzar re-render de la referencia
        }

        // Caso B: Expandir un Átomo -> Listar Campos (ADN)
        if (node.isAtom) {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: node.atomId
            }, coreUrl, sessionSecret);

            const fullAtom = result.items?.[0];
            const fields = fullAtom?.payload?.fields || [];

            node.children = fields.map(f => ({
                id: `field.${node.atomId}.${f.id}`,
                label: f.label || f.id,
                path: `$ref.${node.atomId}.${f.id}`, 
                isLeaf: true,
                type: f.type,
                icon: 'LINK'
            }));
            setTreeData([...treeData]);
        }
    };

    // ── RENDERIZADO DEL NODO (DHARMA VISUAL) ──
    const renderNode = ({ node, depth, isExpanded, hasChildren, isLoading, toggleExpand }) => {
        const isLeaf = node.isLeaf;

        return (
            <div 
                className={`tree-node ${isLeaf ? 'tree-node--leaf' : 'tree-node--branch'} shelf--tight`} 
                style={{ 
                    padding: '6px 8px',
                    marginLeft: `${depth * 4}px`,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'all 0.1s ease',
                    userSelect: 'none'
                }}
                onClick={() => isLeaf ? onSelect(node) : toggleExpand()}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <div style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isLoading ? (
                        <div className="indra-spin" style={{ width: '8px', height: '8px', border: '1px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    ) : (hasChildren || node.isWs || node.isAtom) && (
                        <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.4, display: 'flex' }}>
                            <IndraIcon name="CHEVRON_RIGHT" size="8px" />
                        </div>
                    )}
                </div>

                <IndraIcon 
                    name={node.icon || (isLeaf ? 'LINK' : 'FOLDER')} 
                    size="10px" 
                    color={isLeaf ? 'var(--color-accent)' : 'var(--color-text-dim)'}
                />
                
                <div className="stack--none" style={{ marginLeft: '4px' }}>
                    <span className="font-mono" style={{ fontSize: '9px', fontWeight: isLeaf ? 'bold' : 'normal', color: isLeaf ? 'var(--color-text-primary)' : 'var(--color-text-dim)' }}>
                        {node.label}
                    </span>
                    {isLeaf && node.type && (
                        <span style={{ fontSize: '7px', opacity: 0.3, letterSpacing: '0.05em' }}>{node.type}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="indra-overlay" onClick={onCancel} style={{ zIndex: 5000 }}>
            <div 
                className="slot-selector-card glass-chassis stack--none" 
                style={{ width: '100%', maxWidth: '600px', height: '80vh', overflow: 'hidden' }} 
                onClick={e => e.stopPropagation()}
            >
                
                <div className="stack" style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="spread">
                        <span className="font-mono" style={{ fontSize: '10px', fontWeight: 'bold' }}>VINCULAR_DATO_AL_NODO</span>
                        <div className="shelf--tight" style={{ gap: '12px' }}>
                            <span className="font-mono" style={{ fontSize: '9px', opacity: 0.5 }}>{filterType === 'ANY_TYPE' ? 'CUALQUIER_TIPO' : filterType || 'DATO_UNIVERSAL'}</span>
                            <button className="btn--ghost opacity-50 hover-opacity-100" onClick={onCancel} style={{ padding: '4px', display: 'flex' }}>
                                <IndraIcon name="CLOSE" size="10px" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="fill scroll-y" style={{ padding: 'var(--space-4) var(--space-6)' }}>
                    <IndraFractalTree 
                        data={treeData}
                        renderItem={renderNode}
                        onExpand={handleExpandBranch}
                        defaultExpanded={['local_root']}
                    />
                </div>

                <div style={{ padding: 'var(--space-3) var(--space-6)', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontSize: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    TIP: EXPLORA OTROS MUNDOS PARA IMPORTAR MATERIA EXTRAPLANAR. ESC PARA SALIR.
                </div>
            </div>
        </div>
    );
}
