import React from 'react';
import useCoreStore from '../../core/state/CoreStore';
import { OntologyService } from '../../core/integrity/OntologyService';
import { Box, Plus } from 'lucide-react';

/**
 * 🎨 NodePalette: Archetype Spawner
 * Provides draggable/clickable templates for creating new workspace nodes.
 */
const NodePalette = () => {
    const { contracts } = useCoreStore();

    // Whitelist: Only show ADAPTERS and logic nodes as draggable atoms
    // Axiom: We spawn specific tools, not generic categories.
    const draggableAtoms = Object.entries(contracts).filter(([key, data]) => {
        return data.archetype === 'ADAPTER' || data.archetype === 'LOGIC_NODE' || data.archetype === 'ENTRY_POINT';
    });

    return (
        <div className="panel node-palette" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: 'var(--border-thick)',
            background: 'var(--color-surface)'
        }}>
            <header className="panel-header" style={{
                padding: 'var(--space-sm)',
                borderBottom: '1px solid var(--color-surface-bright)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-surface-soft)'
            }}>
                <Box size={14} className="text-primary" />
                <span className="mono-bold text-xs" style={{ letterSpacing: '1px' }}>COMPONENT_PALETTE</span>
            </header>

            <div className="palette-items" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '10px', opacity: 0.5, marginBottom: '8px' }}>Drag available adapters and logic atoms into the workspace.</p>

                {draggableAtoms.length === 0 && (
                    <div className="code-block" style={{ fontSize: '10px', opacity: 0.4, textAlign: 'center' }}>
                        [WAIT] Awaiting Node Discovery...
                    </div>
                )}

                {draggableAtoms.map(([key, data]) => {
                    const meta = OntologyService.getArchetype(data.archetype || 'DEFAULT');
                    const Icon = meta.icon || Box;

                    return (
                        <div
                            key={key}
                            className="palette-item hover-bg"
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/x-core-node-key', key);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px',
                                border: `1px solid ${meta.color}40`,
                                borderLeft: `4px solid ${meta.color}`,
                                borderRadius: '2px',
                                cursor: 'grab',
                                background: 'var(--color-surface-soft)'
                            }}
                        >
                            <div style={{ padding: '6px', background: 'var(--color-surface)', borderRadius: '4px' }}>
                                <Icon size={14} color={meta.color} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span className="mono-bold" style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {key.toUpperCase()}
                                </span>
                                <span style={{ fontSize: '8px', opacity: 0.4 }}>{data.archetype}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <footer style={{ padding: 'var(--space-sm)', borderTop: '1px solid var(--color-surface-bright)' }}>
                <button className="mono w-full text-xs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: 0.6 }}>
                    <Plus size={12} /> CUSTOM ATOM
                </button>
            </footer>
        </div>
    );
};

export default NodePalette;
