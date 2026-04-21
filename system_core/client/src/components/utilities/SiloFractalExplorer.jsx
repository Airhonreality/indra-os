/**
 * =============================================================================
 * ARTEFACTO: components/utilities/SiloFractalExplorer.jsx
 * RESPONSABILIDAD: Explorador Recursivo de Silos Externos (Drive, Notion, etc.)
 * PROTOCOLO: HIERARCHY_TREE
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { IndraFractalTree } from './IndraFractalTree';
import { IndraIcon } from './IndraIcons';

export function SiloFractalExplorer({ bridge, onSelect, filterClass = 'FOLDER' }) {
    const [silos, setSilos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. CARGA INICIAL: Obtener Silos Disponibles (Drive, Notion, etc.)
    useEffect(() => {
        const fetchSilos = async () => {
            if (!bridge) return;
            try {
                const res = await bridge.execute({
                    provider: 'system',
                    protocol: 'SYSTEM_MANIFEST'
                });
                
                const providers = (res.items || []).filter(p => p.capabilities?.HIERARCHY_TREE);
                
                // Convertir cada provider en un nodo raíz del árbol
                const rootNodes = providers.map(p => ({
                    id: p.id, // El ID único (ej: notion:account1)
                    provider: p.provider_base || p.provider, // El motor (ej: notion)
                    account_id: p.account_id, // La cuenta específica
                    handle: p.handle,
                    class: p.class || 'SILO',
                    isRootSilo: true, 
                    children: [],
                    isLeaf: false
                }));

                setSilos(rootNodes);
            } catch (e) {
                console.error("[SiloExplorer] Fallo cargando manifiesto:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSilos();
    }, [bridge]);

    // 2. RESONANCIA DE RAMA: Cargar hijos vía HIERARCHY_TREE
    const handleExpand = async (node) => {
        if (!bridge) return;
        if (node.children && node.children.length > 0) return;

        try {
            const res = await bridge.execute({
                provider: node.provider || 'drive',
                account_id: node.account_id,
                protocol: 'HIERARCHY_TREE',
                context_id: node.isRootSilo ? (node.handle?.entry_point || 'ROOT') : node.id
            }, { vaultKey: `tree_${node.id}` }); // Cachear estructura de carpetas en el Vault

            const children = (res.items || []).map(item => ({
                ...item,
                provider: node.provider, // Heredar motor del padre
                account_id: node.account_id, // Heredar cuenta del padre
                children: [],
                isLeaf: item.class !== 'FOLDER' && item.class !== 'WORKSPACE'
            }));

            // Inyectar hijos en la estructura in-place
            node.children = children;
            setSilos([...silos]);
        } catch (e) {
            console.error("[SiloExplorer] Error expandiendo nodo:", e);
        }
    };

    if (isLoading) return <div className="indra-spin center" style={{ padding: '40px' }} />;

    return (
        <div className="silo-fractal-explorer fill stack--none" style={{ 
            background: 'rgba(0,0,0,0.4)', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px'
        }}>
            <IndraFractalTree 
                data={silos}
                onExpand={handleExpand}
                renderItem={({ node, depth, isExpanded, isLoading, hasChildren, toggleExpand }) => (
                    <SiloNodeItem 
                        node={node}
                        depth={depth}
                        isExpanded={isExpanded}
                        isLoading={isLoading}
                        hasChildren={hasChildren}
                        onToggle={toggleExpand}
                        onSelect={() => onSelect(node)}
                    />
                )}
            />
        </div>
    );
}

function SiloNodeItem({ node, depth, isExpanded, isLoading, hasChildren, onToggle, onSelect }) {
    const isSilo = node.class === 'SILO';
    
    return (
        <div className="silo-node-item shelf--tight glass-hover" style={{
            padding: '8px 12px',
            paddingLeft: `calc(12px + ${depth * 16}px)`,
            cursor: 'pointer',
            minHeight: '36px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            position: 'relative'
        }} onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle();
            else onSelect();
        }}>
            {/* Indicador de expansión */}
            <div style={{ width: '12px', display: 'flex', alignItems: 'center' }}>
                {isLoading ? (
                    <div className="indra-spin--fast" style={{ width: '8px', height: '8px' }} />
                ) : hasChildren && (
                    <IndraIcon 
                        name="CHEVRON_RIGHT" 
                        size="8px" 
                        style={{ 
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            opacity: 0.4,
                            transition: 'transform 0.2s ease'
                        }} 
                    />
                )}
            </div>

            {/* Icono de clase */}
            <IndraIcon 
                name={node.handle?.icon || (isSilo ? 'VAULT' : 'FOLDER')} 
                size="14px" 
                color={isSilo ? 'var(--indra-dynamic-accent)' : 'rgba(255,255,255,0.4)'} 
            />

            {/* Etiqueta */}
            <div className="stack--none fill">
                <span className="font-mono" style={{ 
                    fontSize: '11px', 
                    fontWeight: isSilo ? '900' : '500',
                    color: isSilo ? 'white' : 'rgba(255,255,255,0.8)'
                }}>
                    {node.handle?.label?.toUpperCase()}
                </span>
                {node.class === 'WORKSPACE' && (
                    <span style={{ fontSize: '8px', opacity: 0.3, letterSpacing: '0.1em' }}>[CELL_WORKSPACE]</span>
                )}
            </div>

            {/* Botón de selección rápida */}
            {!isSilo && (
                <button 
                    className="btn btn--xs btn--accent btn--ghost"
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    style={{ padding: '4px 8px', fontSize: '8px', opacity: 0 }}
                >
                    SELECCIONAR
                </button>
            )}

            <style>{`
                .silo-node-item:hover .btn { opacity: 1 !important; }
            `}</style>
        </div>
    );
}
