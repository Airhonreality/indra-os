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
import { executeDirective } from '../../services/directive_executor.js';
import { useAppState } from '../../state/app_state.js';
import { IndraIcon } from './IndraIcons.jsx';
import { useLexicon } from '../../services/lexicon.js';

export default function ArtifactSelector({ title = 'EXPLORE_ARTIFACTS', onSelect, onCancel, filter = {} }) {
    const { services: manifest, coreUrl, sessionSecret, pins } = useAppState();
    const { lang } = useAppState();
    const t = useLexicon(lang);

    const [contextStack, setContextStack] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeClassFilter, setActiveClassFilter] = useState(null);

    const currentContext = contextStack.length > 0 ? contextStack[contextStack.length - 1] : null;

    const loadLevel = useCallback(async () => {
        setLoading(true);
        try {
            if (!currentContext) {
                const pinItems = (pins || []).map(p => ({
                    ...p,
                    protocols: p.protocols || ['ATOM_READ']
                }));
                setItems([...pinItems, ...(manifest || [])]);
            } else {
                const result = await executeDirective({
                    provider: currentContext.provider,
                    protocol: 'HIERARCHY_TREE',
                    context_id: currentContext.id
                }, coreUrl, sessionSecret);
                setItems(result.items || []);
            }
        } catch (err) {
            console.error('[Selector] Load failed:', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [currentContext, manifest, coreUrl, sessionSecret]);

    useEffect(() => { loadLevel(); }, [loadLevel]);

    const handleDrillDown = (item) => {
        const protocols = item.protocols || [];
        if (protocols.includes('HIERARCHY_TREE')) {
            setContextStack([...contextStack, item]);
            setActiveClassFilter(null); // Reset filters on navigation
            setSearchTerm('');
        } else {
            onSelect(item);
        }
    };

    const availableClasses = [...new Set(items.map(i => i.class))];

    const getIcon = (cls) => {
        const map = {
            'FOLDER': 'FOLDER',
            'SILO': 'SERVICE',
            'DATA_SCHEMA': 'SCHEMA',
            'BRIDGE': 'BRIDGE',
            'DOCUMENT': 'DOCUMENT'
        };
        return map[cls] || 'ATOM';
    };

    return (
        <div className="selector-overlay center" style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000
        }} onClick={onCancel}>
            <div className="artifact-selector stack" style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                width: '480px',
                height: '600px',
                maxHeight: '85vh',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* ── HEADER ── */}
                <header className="stack--tight" style={{ marginBottom: 'var(--space-4)' }}>
                    <div className="spread">
                        <h2 style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.2em' }}>{title}</h2>
                        <button onClick={onCancel} className="btn-icon"><IndraIcon name="CLOSE" size="14px" /></button>
                    </div>

                    <div className="shelf--tight" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'nowrap', opacity: 0.8 }}>
                        <span onClick={() => { setContextStack([]); setActiveClassFilter(null); }} style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>ROOT</span>
                        {contextStack.map((ctx, i) => (
                            <React.Fragment key={ctx.id}>
                                <span>/</span>
                                <span
                                    onClick={() => { setContextStack(contextStack.slice(0, i + 1)); setActiveClassFilter(null); }}
                                    style={{ cursor: 'pointer', color: i === contextStack.length - 1 ? 'white' : 'var(--color-accent)' }}
                                >
                                    {ctx.handle?.label || ctx.id}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </header>

                {/* ── SEARCH & DYNAMIC FILTERS ── */}
                <div className="stack--tight" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="shelf--tight" style={{
                        background: 'var(--color-bg-void)',
                        border: '1px solid var(--color-border)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        <IndraIcon name="EYE" size="14px" style={{ opacity: 0.3 }} />
                        <input
                            type="text"
                            placeholder="SEARCH_IN_CURRENT_PULSE..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '11px', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}
                        />
                    </div>

                    {availableClasses.length > 1 && (
                        <div className="shelf--tight" style={{ overflowX: 'auto', padding: 'var(--space-1) 0' }}>
                            <button
                                onClick={() => setActiveClassFilter(null)}
                                className={`chip ${!activeClassFilter ? 'active' : ''}`}
                            >ALL</button>
                            {availableClasses.map(cls => (
                                <button
                                    key={cls}
                                    onClick={() => setActiveClassFilter(cls)}
                                    className={`chip ${activeClassFilter === cls ? 'active' : ''}`}
                                >{cls}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── BROWSER AREA ── */}
                <div className="fill stack" style={{ overflowY: 'auto', minHeight: '300px', gap: '2px', paddingRight: 'var(--space-2)' }}>
                    {loading ? (
                        <div className="fill center" style={{ opacity: 0.2, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>PULSING_CORE...</div>
                    ) : (
                        items
                            .filter(item => {
                                const matchesSearch = !searchTerm ||
                                    (item.handle?.label?.toUpperCase().includes(searchTerm.toUpperCase())) ||
                                    (item.id?.toUpperCase().includes(searchTerm.toUpperCase()));
                                const matchesClass = !activeClassFilter || item.class === activeClassFilter;
                                return matchesSearch && matchesClass;
                            })
                            .map(item => (
                                <button key={item.id} className="shelf--loose glass-hover-row" onClick={() => handleDrillDown(item)}>
                                    <IndraIcon name={getIcon(item.class)} size="16px" style={{ opacity: 0.6 }} />
                                    <div className="stack--tight fill">
                                        <span style={{ fontSize: '13px', color: 'white' }}>{item.handle?.label || item.id}</span>
                                        <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>{item.class}</span>
                                    </div>
                                    {item.protocols?.includes('HIERARCHY_TREE') && <IndraIcon name="CHEVRON_RIGHT" size="12px" style={{ opacity: 0.2 }} />}
                                </button>
                            ))
                    )}
                </div>
            </div>

            <style>{`
                .glass-hover-row { 
                    width: 100%; border: none; background: transparent; text-align: left; border-radius: var(--radius-sm);
                    cursor: pointer; transition: all 0.2s; display: flex; alignItems: center; gap: var(--space-3); padding: var(--space-3);
                }
                .glass-hover-row:hover { background: rgba(255,255,255,0.06); }
                .btn-icon { background: none; border: none; color: white; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; }
                .btn-icon:hover { opacity: 1; }
                .center { display: flex; align-items: center; justify-content: center; }
                
                .chip {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--color-border);
                    color: white;
                    font-size: 8px;
                    font-family: var(--font-mono);
                    padding: var(--space-1) var(--space-2);
                    border-radius: var(--radius-pill);
                    cursor: pointer;
                    opacity: 0.6;
                    transition: all 0.2s;
                }
                .chip.active {
                    background: var(--color-accent);
                    border-color: var(--color-accent);
                    opacity: 1;
                    color: black;
                }
                .chip:hover { opacity: 1; border-color: var(--color-accent); }
            `}</style>
        </div>
    );
}
