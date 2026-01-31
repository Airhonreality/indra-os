import React, { useState } from 'react';
import useCoreStore from '../core/state/CoreStore';
import { OntologyService } from '../core/integrity/OntologyService';
import { ChevronRight, ChevronDown, Zap, Book } from 'lucide-react';

/**
 * 📚 ContractExplorer: Engineering Node Navigator
 * Axiom: Schematic Hierarchy. High contrast, zero distraction.
 */

const ContractExplorer = () => {
    const { contracts, selectedMethod, setSelectedMethod } = useCoreStore();
    const [expanded, setExpanded] = useState({});

    const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const grouped = Object.entries(contracts).reduce((acc, [name, data]) => {
        const archetype = data.archetype || 'DEFAULT';
        if (!acc[archetype]) acc[archetype] = [];
        acc[archetype].push({ name, ...data });
        return acc;
    }, {});

    // Pure dynamic sorting based on registry existence + generic fallback
    const archetypeKeys = Object.keys(grouped).sort((a, b) => {
        const order = ['SYSTEM_INFRA', 'LOGIC_NODE', 'STATE_NODE', 'ADAPTER'];
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <div className="panel-header" style={{ marginBottom: 'var(--space-lg)' }}>
                <Book size={14} /> <span>NODES_PROTOCOLS</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', opacity: 0.5 }}>
                    {Object.keys(contracts).length}_NODES
                </span>
            </div>

            <div className="explorer-tree">
                {Object.keys(contracts).length === 0 ? (
                    <div className="code-block" style={{ fontSize: '10px', opacity: 0.5 }}>
                        [WAIT] Awaiting synchronization...
                    </div>
                ) : (
                    archetypeKeys.map(archKey => {
                        const meta = OntologyService.getArchetype(archKey);
                        const items = grouped[archKey].sort((a, b) => a.name.localeCompare(b.name));
                        const ArchetypeIcon = meta.icon;

                        return (
                            <div key={archKey} style={{ marginBottom: 'var(--space-lg)' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 0',
                                    fontSize: '9px',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    borderBottom: `2px solid ${meta.color}`,
                                    color: meta.color,
                                    marginBottom: 'var(--space-sm)'
                                }}>
                                    <ArchetypeIcon size={10} />
                                    {meta.label}
                                </div>

                                {items.map(adapter => {
                                    const isExpanded = expanded[adapter.name];
                                    const methods = adapter.methods || [];

                                    return (
                                        <div key={adapter.name} style={{ marginBottom: '2px' }}>
                                            <div
                                                onClick={() => toggle(adapter.name)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    background: isExpanded ? 'var(--text-primary)' : 'transparent',
                                                    color: isExpanded ? 'var(--color-bg)' : 'inherit',
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    border: 'var(--border-thin)',
                                                    marginBottom: '1px'
                                                }}
                                            >
                                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                {adapter.visualIntent && (
                                                    <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                                                        {React.createElement(OntologyService.getIntentIcon(adapter.visualIntent), { size: 11 })}
                                                    </span>
                                                )}
                                                <span className="mono" style={{ marginLeft: '4px' }}>
                                                    {adapter.name.toUpperCase()}
                                                </span>
                                            </div>

                                            {isExpanded && (
                                                <div style={{ marginLeft: '8px', borderLeft: 'var(--border-thin)', paddingLeft: '4px' }}>
                                                    {methods.map(methodName => {
                                                        const isSelected = selectedMethod?.adapter === adapter.name && selectedMethod?.method === methodName;
                                                        const schema = adapter.schemas?.[methodName];

                                                        return (
                                                            <div
                                                                key={methodName}
                                                                onClick={() => setSelectedMethod({ adapter: adapter.name, method: methodName, schema })}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '10.5px',
                                                                    background: isSelected ? 'var(--text-primary)' : 'transparent',
                                                                    color: isSelected ? 'var(--color-bg)' : 'inherit',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    marginTop: '1px',
                                                                    border: isSelected ? 'var(--border-thin)' : 'none'
                                                                }}
                                                            >
                                                                <Zap size={10} style={{ opacity: isSelected ? 1 : 0.4 }} />
                                                                <span className="mono">{methodName}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ContractExplorer;
