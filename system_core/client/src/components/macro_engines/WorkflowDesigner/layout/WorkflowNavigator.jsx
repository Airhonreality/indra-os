/**
 * =============================================================================
 * ARTEFACTO: WorkflowDesigner/layout/WorkflowNavigator.jsx
 * RESPONSABILIDAD: Esqueleto Jerárquico del Flujo de Trabajo (Outline).
 * 
 * DHARMA: 
 *   - Proyecta la estructura lógica como un árbol fractal.
 *   - Permite navegación rápida entre estaciones distantes.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { IndraFractalTree } from '../../../utilities/IndraFractalTree';
import { useWorkflow } from '../context/WorkflowContext';

const TYPE_ICONS = {
    trigger:  'PLAY',
    PROTOCOL: 'SERVICE',
    ROUTER:   'LOGIC',
    MAP:      'SCHEMA'
};

const TYPE_COLORS = {
    trigger:  'var(--color-accent)',
    PROTOCOL: 'var(--color-accent)',
    ROUTER:   'var(--color-warm)',
    MAP:      'var(--color-cold)'
};

function WorkflowNodeRow({ node, isExpanded, hasChildren, toggleExpand, isSelected, onSelect }) {
    const icon = TYPE_ICONS[node.type] || 'ATOM';
    const color = TYPE_COLORS[node.type] || 'inherit';

    return (
        <div 
            className="workflow-nav-row shelf--tight p-2 pointer hover-bg-dim"
            data-selected={isSelected}
            onClick={() => onSelect(node.id)}
            style={{ 
                fontSize: '10px',
                borderLeft: isSelected ? `2px solid ${color}` : '2px solid transparent',
                background: isSelected ? 'var(--color-bg-hover)' : 'transparent',
                transition: 'all 0.1s ease'
            }}
        >
            {hasChildren && (
                <div onClick={(e) => { e.stopPropagation(); toggleExpand(); }} className="cursor-pointer mr-1">
                    <IndraIcon 
                        name="CHEVRON_RIGHT" 
                        size="8px" 
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }} 
                    />
                </div>
            )}
            {!hasChildren && <div style={{ width: '12px' }} />}

            <IndraIcon name={icon} size="10px" style={{ color: isSelected ? color : 'inherit', opacity: isSelected ? 1 : 0.5 }} />
            
            <span className="font-mono truncate flex-1" style={{ opacity: isSelected ? 1 : 0.7 }}>
                {node.label || node.type}
            </span>
            
            <span className="font-mono opacity-30" style={{ fontSize: '8px' }}>#{node.id.slice(-4)}</span>
        </div>
    );
}

export function WorkflowNavigator() {
    const { workflow, selectedStationId, setSelectedStationId } = useWorkflow();

    // Transformamos el payload plano en una jerarquía virtual para el árbol
    // El gatillo es la raíz virtual, las estaciones son ramas.
    const treeData = [
        {
            id: 'trigger',
            type: 'trigger',
            label: workflow.payload?.trigger?.label || 'IGNICIÓN',
            children: (workflow.payload?.stations || []).map(s => ({
                id: s.id,
                type: s.type,
                label: s.config?.label || s.id,
                children: [] // Los workflows actuales son 1D, pero el motor ya está listo para 2D (bloques anidados)
            }))
        }
    ];

    return (
        <div className="workflow-navigator fill stack overflow-hidden bg-surface border-right">
            <header className="p-3 border-bottom shelf--tight text-hint" style={{ opacity: 0.5 }}>
                <IndraIcon name="ATOM" size="10px" />
                <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold' }}>ESTRUCTURA_LOGICA</span>
            </header>
            
            <div className="fill overflow-y-auto p-2 scroll-minimal">
                <IndraFractalTree 
                    data={treeData}
                    defaultExpanded={true}
                    renderItem={({ node, isExpanded, hasChildren, toggleExpand }) => (
                        <WorkflowNodeRow 
                            node={node}
                            isExpanded={isExpanded}
                            hasChildren={hasChildren}
                            toggleExpand={toggleExpand}
                            isSelected={selectedStationId === node.id}
                            onSelect={setSelectedStationId}
                        />
                    )}
                />
            </div>

            <style>{`
                .workflow-nav-row:hover {
                    background: var(--color-bg-hover);
                }
                .workflow-nav-row[data-selected="true"] {
                    color: var(--color-accent);
                }
            `}</style>
        </div>
    );
}
