import React, { useState, useEffect } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useGuestCore } from '../hooks/useGuestCore';

// Componente Nodo
const TreeNode = ({ node, level, selectedFolderId, onSelect, onToggle, loadChildren }) => {
    const isExpanded = node.isExpanded;
    const isSelected = selectedFolderId === node.id;
    const hasChildrenLoaded = node.children !== null;

    const handleExpandToggle = async (e) => {
        e.stopPropagation();
        if (!hasChildrenLoaded) {
            await loadChildren(node.id);
        }
        onToggle(node.id);
    };

    return (
        <div className="stack--none">
            <div 
                className={`tree-node shelf--tight ${isSelected ? 'active' : ''}`}
                style={{ 
                    padding: `8px 12px 8px ${12 + (level * 16)}px`, 
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(123, 47, 247, 0.1)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #7b2ff7' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                }}
                onClick={() => onSelect(node.id, node.name)}
            >
                <div 
                    onClick={handleExpandToggle} 
                    style={{ width: '16px', display: 'flex', alignItems: 'center', opacity: 0.5, cursor: 'pointer' }}
                >
                    {node.isLoading ? (
                        <div className="indra-spin" style={{ width: '10px', height: '10px', border: '1px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    ) : (
                        <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            <IndraIcon name="CHEVRON_RIGHT" size="10px" />
                        </div>
                    )}
                </div>
                
                <IndraIcon name={isExpanded ? 'FOLDER_OPEN' : 'FOLDER'} size="14px" color={isSelected ? '#7b2ff7' : 'inherit'} style={{ opacity: isSelected ? 1 : 0.6 }} />
                
                <span className="font-outfit" style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, marginLeft: '4px' }}>
                    {node.name}
                </span>
            </div>

            {isExpanded && node.children && (
                <div className="tree-children">
                    {node.children.length === 0 ? (
                        <div style={{ padding: `4px 12px 4px ${32 + (level * 16)}px`, fontSize: '10px', opacity: 0.3, fontStyle: 'italic' }}>Carpeta vacía</div>
                    ) : (
                        node.children.map(child => (
                            <TreeNode 
                                key={child.id} 
                                node={child} 
                                level={level + 1} 
                                selectedFolderId={selectedFolderId}
                                onSelect={onSelect}
                                onToggle={onToggle}
                                loadChildren={loadChildren}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};


export const FractalFolderTree = ({ rootId, rootName, selectedFolderId, onFolderSelect }) => {
    const { listFolder } = useGuestCore();

    const [tree, setTree] = useState({
        id: rootId,
        name: rootName || 'Silo Raíz',
        isExpanded: true, // Raíz expandida por defecto
        isLoading: false,
        children: null
    });

    // Cargar contenido raíz inicial
    useEffect(() => {
        loadSubFolders(rootId, true);
        // eslint-disable-next-line
    }, [rootId]);

    // Función recursiva inmutable para actualizar un nodo específico en el árbol
    const updateNode = (treeState, targetId, updates) => {
        if (treeState.id === targetId) return { ...treeState, ...updates };
        if (treeState.children) {
            return {
                ...treeState,
                children: treeState.children.map(c => updateNode(c, targetId, updates))
            };
        }
        return treeState;
    };

    const loadSubFolders = async (folderId, isRoot = false) => {
        if (!isRoot) setTree(prev => updateNode(prev, folderId, { isLoading: true }));
        
        const items = await listFolder(folderId);
        // Solo conservamos carpetas para el árbol (class === 'FOLDER')
        const folders = items.filter(a => a.class === 'FOLDER').map(f => ({
            id: f.id,
            name: f.handle?.label || f.id,
            isExpanded: false,
            isLoading: false,
            children: null
        }));

        setTree(prev => updateNode(prev, folderId, { children: folders, isLoading: false }));
    };

    const handleToggle = (folderId) => {
        // En vez de mutar, necesitamos otra función recursiva para encontrar el estado actual
        const toggleNode = (node, targetId) => {
            if (node.id === targetId) return { ...node, isExpanded: !node.isExpanded };
            if (node.children) return { ...node, children: node.children.map(c => toggleNode(c, targetId)) };
            return node;
        };
        setTree(prev => toggleNode(prev, folderId));
    };

    return (
        <div className="fractal-tree-container">
            <TreeNode 
                node={tree} 
                level={0}
                selectedFolderId={selectedFolderId}
                onSelect={onFolderSelect}
                onToggle={handleToggle}
                loadChildren={loadSubFolders}
            />
        </div>
    );
};
