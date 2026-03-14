import React, { useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { LayerTree } from './LayerTree';
import { useAST } from '../context/ASTContext';
import { useDocumentHydration } from '../hooks/useDocumentHydration';

export function NavigatorPanel({ atom }) {
    const { blocks } = useAST();
    const [tab, setTab] = useState('LAYERS'); // 'LAYERS' | 'DATA'
    const { slots, isLoading } = useDocumentHydration(atom);

    return (
        <aside style={{
            flex: 1,
            background: 'var(--color-bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* TABS ENAV */}
            <div className="shelf" style={{ borderBottom: '1px solid var(--color-border)', padding: '0 var(--space-2)' }}>
                <button
                    onClick={() => setTab('LAYERS')}
                    className={`btn btn--xs ${tab === 'LAYERS' ? 'btn--accent' : 'btn--ghost'}`}
                    style={{ flex: 1, borderRadius: 0, border: 'none' }}
                >
                    LAYERS
                </button>
                <button
                    onClick={() => setTab('DATA')}
                    className={`btn btn--xs ${tab === 'DATA' ? 'btn--accent' : 'btn--ghost'}`}
                    style={{ flex: 1, borderRadius: 0, border: 'none' }}
                >
                    DATA_SOURCE
                </button>
            </div>

            <div className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-2)' }}>
                {tab === 'LAYERS' ? (
                    <div className="stack--tight">
                        <header className="shelf--tight" style={{ padding: 'var(--space-2)', opacity: 0.4 }}>
                            <IndraIcon name="ATOM" size="10px" />
                            <span style={{ fontSize: '9px', fontWeight: 'bold' }}>DOCUMENT_HIERARCHY</span>
                        </header>
                        {blocks.map(node => (
                            <LayerTree
                                key={node.id}
                                node={node}
                                depth={0}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="stack--tight">
                        <header className="shelf--tight" style={{ padding: 'var(--space-2)', opacity: 0.4 }}>
                            <IndraIcon name="LINK" size="10px" />
                            <span style={{ fontSize: '9px', fontWeight: 'bold' }}>DATA_SLOTS_AVAILABLE</span>
                        </header>

                        {isLoading && <div className="center" style={{ padding: 'var(--space-8)', opacity: 0.3, fontSize: '10px' }}>HYDRATING_CONTEXT...</div>}

                        {!isLoading && slots.map(slot => (
                            <div
                                key={slot.id}
                                className="shelf--tight glass-hover"
                                style={{
                                    padding: 'var(--space-2) var(--space-4)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--color-border)'
                                }}
                                onClick={() => {
                                    const slotTag = `{{${slot.label}}}`;

                                    // 1. Si hay un bloque seleccionado y es de texto, lo inyectamos
                                    if (selectedId) {
                                        const node = findNode(selectedId);
                                        if (node && node.type === 'TEXT') {
                                            const currentContent = node.props.content || '';
                                            updateNode(selectedId, {
                                                props: { ...node.props, content: currentContent + slotTag }
                                            });
                                            if (onNotify) onNotify(`SLOT_INSERTED: ${slotTag}`);
                                            return;
                                        }
                                    }

                                    // 2. Fallback: Copiar al portapapeles
                                    navigator.clipboard.writeText(slotTag);
                                    if (onNotify) onNotify(`SLOT_COPIED: ${slotTag}`);
                                }}
                            >
                                <IndraIcon name="LOGIC" size="10px" style={{ opacity: 0.5 }} />
                                <div className="stack--tight fill" style={{ gap: '2px' }}>
                                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{slot.label}</span>
                                    <span style={{ fontSize: '7px', opacity: 0.3 }}>origin: {slot.origin}</span>
                                </div>
                                <div className="badge badge--ghost" style={{ fontSize: '7px', opacity: 0.5 }}>{slot.type}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
