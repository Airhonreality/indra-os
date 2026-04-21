/**
 * =============================================================================
 * ARTEFACTO: components/utilities/ArtifactSelector.jsx
 * RESPONSABILIDAD: Explorador Universal de Jerarquías (Hierarchy Walker).
 *
 * DHARMA (Simplicidad Determinista):
 *   - Proyección Pura: Muestra lo que el Core entrega en el nivel actual.
 *   - Cero Burocracia: Filtros dinámicos basados en la realidad actual.
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../state/app_state.js';
import { useLexicon } from '../../services/lexicon.js';
import { DataProjector } from '../../services/DataProjector.js';
import { IndraIcon } from './IndraIcons.jsx';
import { ResonanceTuningPanel } from '../dashboard/ResonanceTuningPanel.jsx';
import { toastEmitter } from '../../services/toastEmitter.js';
import { useAtomCatalog } from '../../hooks/useAtomCatalog.js';
import { IndraFractalTree } from './IndraFractalTree.jsx';

export default function ArtifactSelector({ title = 'EXPLORE_ARTIFACTS', bridge, onSelect, onCancel, filter = {} }) {
    const { services: manifest = [], lang } = useAppState();
    const t = useLexicon(lang);

    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeClassFilter, setActiveClassFilter] = useState(null);
    const [tuningArtifact, setTuningArtifact] = useState(null);

    // ── Catálogo de Átomos Indra (PINS) ──
    const { 
        atoms: catalogAtoms, 
        isLoading: isCatalogLoading,
        importAtom: handleImportFromCosmos
    } = useAtomCatalog({ 
        atomClass: filter.class || null 
    });

    // ── GÉNESIS DEL ÁRBOL UNIFICADO (Axioma de Honestidad) ──
    const { workspaces, activeWorkspaceId } = useAppState();

    useEffect(() => {
        const activeWS = workspaces.find(w => w.id === activeWorkspaceId);
        const wsLabel = activeWS?.handle?.label || 'WORKSPACE_ANONYMOUS';
        const wsIdDisplay = activeWorkspaceId ? activeWorkspaceId.substring(0, 8).toUpperCase() : 'UNK';

        // 1. Proyectar PINS (Átomos anclados)
        const projectedPins = (catalogAtoms || []).map(a => ({
            ...DataProjector.projectArtifact(a),
            raw: a,
            isLeaf: true
        })).map(p => ({
            id: p.id,
            label: p.title,
            icon: p.theme.icon,
            isLeaf: true,
            raw: p.raw,
            class: p.class
        }));

        const pinsRoot = {
            id: 'root.pins',
            label: `PINS + ${wsIdDisplay} + ${wsLabel.toUpperCase()}`,
            icon: 'PIN',
            children: projectedPins,
            isExpanded: true
        };

        // 2. Proyectar REALIDAD (Servicios del Core)
        const projectedServices = manifest
            .filter(item => !item.raw?.needs_setup)
            .map(item => {
                const projection = DataProjector.projectArtifact(item);
                return {
                    id: projection.id,
                    label: projection.title,
                    icon: projection.theme.icon,
                    isLeaf: !projection.capabilities.raw.includes('HIERARCHY_TREE'),
                    raw: item,
                    provider: item.provider || item.id
                };
            });

        const realityRoot = {
            id: 'root.reality',
            label: 'REALITY / SERVICIOS',
            icon: 'COSMOS',
            children: projectedServices
        };

        setTreeData([pinsRoot, realityRoot]);
    }, [catalogAtoms, manifest, workspaces, activeWorkspaceId]);

    // ── NAVEGACIÓN ASÍNCRONA (Axioma de Exploración de Mundos) ──
    const handleExpandBranch = async (node) => {
        if (!bridge) return;

        try {
            const effectiveProvider = node.provider || node.raw?.provider || 'system';
            const result = await bridge.execute({
                provider: effectiveProvider,
                protocol: 'HIERARCHY_TREE',
                context_id: node.id === effectiveProvider ? null : node.id
            }, { vaultKey: `tree_${node.id}` });

            const rawItems = result.items || [];
            node.children = rawItems.map(item => {
                const projection = DataProjector.projectArtifact(item);
                return {
                    id: projection.id,
                    label: projection.title,
                    icon: projection.theme.icon,
                    isLeaf: !projection.capabilities.raw.includes('HIERARCHY_TREE'),
                    raw: item,
                    provider: effectiveProvider
                };
            });
            setTreeData([...treeData]);
        } catch (err) {
            console.error('[ArtifactSelector] Expansion failed:', err);
            toastEmitter.error("No se pudo expandir la rama de realidad.");
        }
    };

    const handleSelectNode = (node) => {
        const item = node.raw;
        if (!item) return;

        // AXIOMA DE RESONANCIA: Si es un objeto externo que puede proyectar datos 
        const isExternal = item.provider && !['system', 'native'].includes(item.provider);
        const isResonantType = ['DATA_SCHEMA', 'TABULAR', 'CALENDAR', 'DATABASE'].includes(item.class);
        const isAlreadyTuned = item.origin === 'RESONANT';

        if (isExternal && isResonantType && !isAlreadyTuned) {
            setTuningArtifact(item);
        } else {
            onSelect(item);
        }
    };

    const renderNode = ({ node, depth, isExpanded, hasChildren, isLoading, toggleExpand }) => {
        const isLeaf = node.isLeaf;
        const matchesSearch = !searchTerm || node.label.toUpperCase().includes(searchTerm.toUpperCase());
        const matchesClass = !activeClassFilter || node.class === activeClassFilter;

        if (!matchesSearch || (!isLeaf && !hasChildren && searchTerm)) return null;

        return (
            <div 
                className={`tree-node ${isLeaf ? 'tree-node--leaf' : 'tree-node--branch'} shelf--tight glass-hover`} 
                style={{ 
                    padding: '8px 12px',
                    marginLeft: `${depth * 8}px`,
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.1s ease',
                    minHeight: '36px'
                }}
                onClick={() => isLeaf ? handleSelectNode(node) : toggleExpand()}
            >
                <div style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isLoading ? (
                        <div className="indra-spin" style={{ width: '10px', height: '10px', border: '1px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    ) : !isLeaf && (
                        <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.4 }}>
                            <IndraIcon name="CHEVRON_RIGHT" size="10px" />
                        </div>
                    )}
                </div>

                <IndraIcon 
                    name={node.icon} 
                    size="16px" 
                    color={isLeaf ? 'var(--color-text-primary)' : 'var(--color-accent)'}
                    style={{ opacity: isLeaf ? 0.7 : 1 }}
                />
                
                <div className="stack--none fill" style={{ marginLeft: '8px' }}>
                    <span className="font-mono" style={{ 
                        fontSize: depth === 0 ? '10px' : '12px', 
                        fontWeight: (isLeaf || depth === 0) ? 'bold' : 'normal',
                        opacity: depth === 0 ? 0.5 : 1,
                        letterSpacing: depth === 0 ? '0.1em' : 'normal'
                    }}>
                        {node.label}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="indra-overlay" onClick={onCancel}>
                <div 
                    className="artifact-selector glass-chassis stack--loose" 
                    style={{ width: '520px', height: '640px', maxHeight: '85vh', padding: 'var(--space-6)', overflow: 'hidden' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <header className="stack--tight" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="spread">
                            <h2 style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.2em' }}>INSPECTOR_FRACTAL_DE_ENTIDADES</h2>
                            <button onClick={onCancel} className="btn-icon"><IndraIcon name="CLOSE" size="14px" /></button>
                        </div>
                    </header>

                    {/* Search & Modes */}
                    <div className="stack--tight" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="shelf--tight" style={{ width: '100%', gap: 'var(--space-2)' }}>
                            <div className="shelf--tight terminal-inset fill" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                                <IndraIcon name="SEARCH" size="14px" style={{ opacity: 0.4 }} />
                                <input
                                    type="text"
                                    placeholder={t('SEARCH_IN_CURRENT_PULSE')}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="fill"
                                    style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '13px', fontFamily: 'var(--font-mono)', outline: 'none' }}
                                />
                            </div>
                            
                            <div className="shelf--tight" style={{ gap: 'var(--space-1)' }}>
                                <button className="btn btn--ghost btn--mini resonance-glow-bridge" onClick={handleImportFromCosmos}>
                                    <IndraIcon name="LAYERS" size="12px" color="var(--color-accent)" />
                                    <span style={{ fontSize: '9px', fontWeight: 'bold' }}>COSMOS</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tree Discovery Area */}
                    <div className="fill scroll-y" style={{ minHeight: '300px', paddingRight: 'var(--space-2)' }}>
                        {(loading || isCatalogLoading) ? (
                            <div className="fill center" style={{ opacity: 0.2, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{t('PULSING_CORE')}</div>
                        ) : (
                            <IndraFractalTree 
                                data={treeData}
                                renderItem={renderNode}
                                onExpand={handleExpandBranch}
                            />
                        )}
                    </div>
                </div>
            </div>

            {tuningArtifact && (
                <ResonanceTuningPanel
                    artifact={tuningArtifact}
                    onConfirm={(resonantAtom) => {
                        setTuningArtifact(null);
                        onSelect(resonantAtom);
                    }}
                    onCancel={() => setTuningArtifact(null)}
                />
            )}
        </>
    );
}
