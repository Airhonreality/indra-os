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
import { executeDirective } from '../../services/directive_executor.js';
import { DataProjector } from '../../services/DataProjector.js';
import { IndraIcon } from './IndraIcons.jsx';
import { ResonanceTuningPanel } from '../dashboard/ResonanceTuningPanel.jsx';

export default function ArtifactSelector({ title = 'EXPLORE_ARTIFACTS', onSelect, onCancel, filter = {} }) {
    const { services: manifest, coreUrl, sessionSecret, pins } = useAppState();
    const { lang } = useAppState();
    const t = useLexicon(lang);

    const [browserMode, setBrowserMode] = useState('PINS'); // 'PINS' | 'REALITY'
    const [contextStack, setContextStack] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeClassFilter, setActiveClassFilter] = useState(null);
    const [tuningArtifact, setTuningArtifact] = useState(null);

    const currentContext = contextStack.length > 0 ? contextStack[contextStack.length - 1] : null;

    const loadLevel = useCallback(async () => {
        setLoading(true);
        try {
            if (!currentContext) {
                if (browserMode === 'PINS') {
                    setItems((pins || []).map(p => ({
                        ...p,
                        protocols: p.protocols || ['ATOM_READ']
                    })));
                } else {
                    // MODO REALIDAD: Solo servicios externos registrados
                    setItems(manifest || []);
                }
            } else {
                // Sinceridad de Fuente: El provider es o bien una propiedad del objeto o el objeto mismo si es un servicio raíz.
                const effectiveProvider = currentContext.provider || currentContext.id;
                const result = await executeDirective({
                    provider: effectiveProvider,
                    protocol: 'HIERARCHY_TREE',
                    context_id: currentContext.id === effectiveProvider ? null : currentContext.id
                }, coreUrl, sessionSecret);
                setItems(result.items || []);
            }
        } catch (err) {
            console.error('[Selector] Load failed:', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [currentContext, manifest, coreUrl, sessionSecret, pins, browserMode]);

    // AXIOMA DE TRANSICIÓN: Cambiar de realidad limpia las lentes de búsqueda
    useEffect(() => {
        setActiveClassFilter(null);
        setSearchTerm('');
        setContextStack([]);
    }, [browserMode]);

    useEffect(() => { loadLevel(); }, [loadLevel]);

    const handleDrillDown = (item) => {
        const protocols = item.protocols || [];
        // Sinceridad Operativa: Si permite navegación, entramos.
        if (protocols.includes('HIERARCHY_TREE')) {
            setContextStack([...contextStack, item]);
            setActiveClassFilter(null); // Reset filters on navigation
            setSearchTerm('');
        } else {
            // AXIOMA DE RESONANCIA: Si es un objeto externo que puede proyectar datos (TABULAR/CALENDAR/SCHEMA)
            const isExternal = item.provider && !['system', 'native'].includes(item.provider);
            const isResonantType = ['DATA_SCHEMA', 'TABULAR', 'CALENDAR', 'DATABASE'].includes(item.class);
            const isAlreadyTuned = item.origin === 'RESONANT';

            if (isExternal && isResonantType && !isAlreadyTuned) {
                setTuningArtifact(item);
            } else {
                onSelect(item);
            }
        }
    };

    const availableClasses = [...new Set(items.map(i => i.class).filter(Boolean))];

    return (
        <>
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

                        <div className="spread">
                            <div className="shelf--tight" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'nowrap', opacity: 0.8 }}>
                                <span onClick={() => { setContextStack([]); setActiveClassFilter(null); }} style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>{t('ROOT')}</span>
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

                            {/* SELECTOR DE MODO (COSMOS vs REALIDAD) */}
                            {contextStack.length === 0 && (
                                <div className="shelf--tight glass" style={{ padding: '2px', borderRadius: 'var(--radius-pill)' }}>
                                    <button 
                                        className={`btn btn--xs ${browserMode === 'PINS' ? 'btn--accent' : 'btn--ghost'}`} 
                                        onClick={() => setBrowserMode('PINS')}
                                        style={{ fontSize: '8px', padding: '2px 10px', borderRadius: 'var(--radius-pill)', border: 'none' }}
                                    >
                                        PINS
                                    </button>
                                    <button 
                                        className={`btn btn--xs ${browserMode === 'REALITY' ? 'btn--accent' : 'btn--ghost'}`} 
                                        onClick={() => setBrowserMode('REALITY')}
                                        style={{ fontSize: '8px', padding: '2px 10px', borderRadius: 'var(--radius-pill)', border: 'none' }}
                                    >
                                        SERVICIOS
                                    </button>
                                </div>
                            )}
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
                                placeholder={t('SEARCH_IN_CURRENT_PULSE')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '11px', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}
                            />
                        </div>

                        {availableClasses.length > 0 && (
                            <div className="shelf--tight" style={{ overflowX: 'auto', padding: 'var(--space-1) 0' }}>
                                <button
                                    onClick={() => setActiveClassFilter(null)}
                                    className={`chip ${!activeClassFilter ? 'active' : ''}`}
                                >{t('ALL')}</button>
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
                            <div className="fill center" style={{ opacity: 0.2, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{t('PULSING_CORE')}</div>
                        ) : (
                            items
                                .map((item, index) => {
                                    // Sinceridad Total: Extraer la materia cruda. 
                                    // Los servicios del manifest suelen venir ya 'proyectados', buscamos el original.
                                    const raw = item.raw || item;
                                    const projection = DataProjector.projectArtifact(raw);
                                    if (!projection) return null;
                                    
                                    const matchesSearch = !searchTerm ||
                                        (projection.title.toUpperCase().includes(searchTerm.toUpperCase())) ||
                                        (projection.id.toUpperCase().includes(searchTerm.toUpperCase()));
                                    const matchesClass = !activeClassFilter || projection.class === activeClassFilter;
                                    
                                    if (!matchesSearch || !matchesClass) return null;

                                    return (
                                        <button key={`${projection.provider}_${projection.class}_${projection.id}_${index}`} className="shelf--loose glass-hover-row" onClick={() => handleDrillDown(raw)}>
                                            <IndraIcon name={projection.theme.icon} size="16px" style={{ opacity: 0.6, color: projection.theme.color }} />
                                            <div className="stack--tight fill">
                                                <span style={{ fontSize: '13px', color: 'white' }}>{projection.title}</span>
                                                <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>{projection.subtitle}</span>
                                            </div>
                                            {projection.capabilities.raw.includes('HIERARCHY_TREE') && <IndraIcon name="CHEVRON_RIGHT" size="12px" style={{ opacity: 0.2 }} />}
                                        </button>
                                    );
                                })
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
        </>
    );
}
