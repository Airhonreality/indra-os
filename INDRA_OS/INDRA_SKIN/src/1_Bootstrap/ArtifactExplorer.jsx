/**
 * MÓDULO TEMPORAL DE DIAGNÓSTICO
 * ArtifactExplorer.jsx
 * 
 * Explorador de artefactos JSON en la carpeta FLOWS
 * Basado en OMD-05.2 (Vault Navigator) y OMD-07 (Project Explorer)
 */

import React, { useState, useEffect } from 'react';
import adapter from '../core/Sovereign_Adapter';
import useAxiomaticState from '../core/state/AxiomaticState';

const ArtifactExplorer = () => {
    const [artifacts, setArtifacts] = useState([]);
    const [groupedArtifacts, setGroupedArtifacts] = useState({});
    const [selectedArtifact, setSelectedArtifact] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});
    const hashInitialized = useAxiomaticState(s => s.session.hashInitialized);
    const globalLoading = useAxiomaticState(s => s.session.isLoading);

    const isSystemLoading = globalLoading || isLoading;

    useEffect(() => {
        if (hashInitialized) {
            loadAllArtifacts();
        }
    }, [hashInitialized]);

    const loadAllArtifacts = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Llamar al backend con modo diagnóstico (includeAll: true)
            const response = await adapter.call('cosmos', 'listAvailableCosmos', { includeAll: true });

            if (response && response.artifacts) {
                setArtifacts(response.artifacts);
                groupArtifactsByType(response.artifacts);
            }
        } catch (err) {
            console.error('[ArtifactExplorer] Error loading artifacts:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const groupArtifactsByType = (artifacts) => {
        const groups = {
            'COSMOS_V1': [],
            'FLOW_V1': [],
            'LAYOUT_V1': [],
            'SYSTEM_V1': [],
            'UNDEFINED': []
        };

        artifacts.forEach(artifact => {
            const schema = artifact.indx_schema || 'UNDEFINED';

            if (groups[schema]) {
                groups[schema].push(artifact);
            } else {
                // Fallback por nombre para arqueología de archivos
                if (artifact.name?.includes('.flow.') || artifact.name?.includes('.logic.') || artifact.name?.includes('.rule.')) {
                    groups.FLOW_V1.push(artifact);
                } else if (artifact.name?.includes('.layout.')) {
                    groups.LAYOUT_V1.push(artifact);
                } else if (artifact.name?.includes('.sys.') || artifact.name?.includes('.config.')) {
                    groups.SYSTEM_V1.push(artifact);
                } else {
                    groups.UNDEFINED.push(artifact);
                }
            }
        });

        setGroupedArtifacts(groups);

        // Auto-expandir grupos con contenido
        const initialExpanded = {};
        Object.keys(groups).forEach(key => {
            if (groups[key].length > 0) {
                initialExpanded[key] = true;
            }
        });
        setExpandedGroups(initialExpanded);
    };

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const handleSelectArtifact = async (artifact) => {
        setSelectedArtifact(artifact);
    };

    const getGroupIcon = (groupName) => {
        const icons = {
            'COSMOS_V1': '🌌',
            'FLOW_V1': '⚡',
            'LAYOUT_V1': '🎨',
            'SYSTEM_V1': '⚙️',
            'UNDEFINED': '❓'
        };
        return icons[groupName] || '📄';
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'monospace'
        }}>
            {/* Panel Izquierdo: Árbol de Artefactos */}
            <div style={{
                width: '350px',
                borderRight: '1px solid #333',
                overflowY: 'auto',
                padding: '20px'
            }}>
                <div style={{
                    marginBottom: '20px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#00ff88' }}>
                        🔍 Artifact Explorer
                    </h2>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                        Total: {artifacts.length} artifacts
                    </p>
                </div>

                {isSystemLoading && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        Loading artifacts...
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#ff000020',
                        border: '1px solid #ff0000',
                        borderRadius: '4px',
                        marginBottom: '10px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Grupos Colapsables */}
                {Object.entries(groupedArtifacts).map(([groupName, items]) => (
                    items.length > 0 && (
                        <div key={groupName} style={{ marginBottom: '15px' }}>
                            <div
                                onClick={() => toggleGroup(groupName)}
                                style={{
                                    padding: '8px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '5px'
                                }}
                            >
                                <span>
                                    {getGroupIcon(groupName)} {groupName}
                                </span>
                                <span style={{
                                    backgroundColor: 'var(--bg-deep)',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px'
                                }}>
                                    {items.length}
                                </span>
                            </div>

                            {expandedGroups[groupName] && (
                                <div style={{ paddingLeft: '15px' }}>
                                    {items.map((artifact, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectArtifact(artifact)}
                                            style={{
                                                padding: '6px 8px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedArtifact?.id === artifact.id ? '#00ff8820' : 'transparent',
                                                borderLeft: selectedArtifact?.id === artifact.id ? '2px solid #00ff88' : '2px solid transparent',
                                                marginBottom: '2px',
                                                fontSize: '12px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            📄 {artifact.identity?.label || artifact.name || 'Unnamed'}
                                            {artifact.discovery?.status === 'ARTIFACT_RAW' && <span style={{ color: '#ff8800', fontSize: '10px', marginLeft: '5px' }}>[RAW]</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                ))}
            </div>

            {/* Panel Derecho: Visor JSON */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto'
            }}>
                {selectedArtifact ? (
                    <>
                        <div style={{
                            marginBottom: '20px',
                            paddingBottom: '10px',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <h3 style={{ margin: 0, color: '#00ff88' }}>
                                {selectedArtifact.name || selectedArtifact.identity?.label || 'Unnamed Artifact'}
                            </h3>
                            <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                                ID: {selectedArtifact.id}
                            </p>
                            <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                                Schema: {selectedArtifact.indx_schema || 'UNDEFINED'}
                            </p>
                        </div>

                        <pre style={{
                            backgroundColor: 'var(--bg-secondary)',
                            padding: '15px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            overflow: 'auto',
                            border: '1px solid var(--border-color)'
                        }}>
                            {JSON.stringify(selectedArtifact, null, 2)}
                        </pre>
                    </>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#555',
                        fontSize: '14px'
                    }}>
                        Select an artifact to view its content
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArtifactExplorer;



