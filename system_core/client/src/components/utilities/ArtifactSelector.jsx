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
import { toastEmitter } from '../../services/toastEmitter.js';

export default function ArtifactSelector({ title = 'EXPLORE_ARTIFACTS', onSelect, onCancel, filter = {} }) {
    const { services: manifest = [], coreUrl, sessionSecret, pins = [] } = useAppState();
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
            let rawItems = [];
            if (!currentContext) {
                if (browserMode === 'PINS') {
                    rawItems = pins || [];
                } else {
                    // MODO REALIDAD: Usamos los servicios del manifiesto (átomos crudos)
                    rawItems = manifest;
                }
            } else {
                const effectiveProvider = currentContext.provider || currentContext.id;
                const result = await executeDirective({
                    provider: effectiveProvider,
                    protocol: 'HIERARCHY_TREE',
                    context_id: currentContext.id === effectiveProvider ? null : currentContext.id
                }, coreUrl, sessionSecret);
                rawItems = result.items || [];
            }

            // AXIOMA DE SINCERIDAD: Todo item en el selector debe ser un Artefacto Proyectado
            const projected = rawItems
                .map(item => DataProjector.projectArtifact(item))
                .filter(Boolean);

            setItems(projected);
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

    const handleImportVault = async () => {
        setLoading(true);
        try {
            const res = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_BLUEPRINT_SYNC',
                data: { action: 'SCAN' }
            }, coreUrl, sessionSecret);
            
            if (res.items && res.items.length > 0) {
                toastEmitter.success(`${res.items.length} entidades detectadas y listas para resonar.`);
                await loadLevel(); // Recargamos para ver los nuevos pins si es modo PINS
            } else {
                toastEmitter.warn("No se detectaron nuevas entidades en el Vault.");
            }
        } catch (err) {
            toastEmitter.error("Fallo al escanear el Vault: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const availableClasses = [...new Set(items.map(i => i.class).filter(Boolean))];

    return (
        <>
            <div className="indra-overlay" onClick={onCancel}>
                <div 
                    className="artifact-selector glass-chassis stack--loose" 
                    style={{ width: '520px', height: '640px', maxHeight: '85vh', padding: 'var(--space-6)' }}
                    onClick={e => e.stopPropagation()}
                >

                    {/* ── HEADER ── */}
                    <header className="stack--tight" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="spread">
                            <h2 style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.2em' }}>INSPECTOR DE ENTIDADES</h2>
                            <button onClick={onCancel} className="btn-icon"><IndraIcon name="CLOSE" size="14px" /></button>
                        </div>

                        <div className="spread">
                            <div className="shelf--tight" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'nowrap', opacity: 0.8 }}>
                                <span onClick={() => { setContextStack([]); setActiveClassFilter(null); }} style={{ cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 'bold' }}>{t('ROOT')}</span>
                                {contextStack.map((ctx, i) => (
                                    <React.Fragment key={ctx.id}>
                                        <span style={{ color: 'var(--color-text-dim)' }}>/</span>
                                        <span
                                            onClick={() => { setContextStack(contextStack.slice(0, i + 1)); setActiveClassFilter(null); }}
                                            style={{ cursor: 'pointer', color: i === contextStack.length - 1 ? 'var(--color-text-primary)' : 'var(--color-accent)' }}
                                        >
                                            {ctx.handle?.label || ctx.id}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>

                        </div>
                    </header>

                    {/* ── SEARCH & DYNAMIC FILTERS ── */}
                    <div className="stack--tight" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="shelf--tight" style={{ width: '100%', gap: 'var(--space-2)' }}>
                            {contextStack.length > 0 && (
                                <button 
                                    onClick={() => setContextStack(contextStack.slice(0, -1))}
                                    className="btn btn--mini btn--ghost"
                                    title={t('GO_BACK')}
                                >
                                    <IndraIcon name="CHEVRON_LEFT" size="14px" />
                                </button>
                            )}
                            <div className="shelf--tight terminal-inset fill" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                                <IndraIcon name="SEARCH" size="14px" style={{ opacity: 0.4 }} />
                                <input
                                    type="text"
                                    placeholder={t('SEARCH_IN_CURRENT_PULSE')}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="fill"
                                    style={{ 
                                        background: 'transparent', border: 'none', 
                                        color: 'inherit', 
                                        fontSize: '13px', fontFamily: 'var(--font-mono)', 
                                        outline: 'none' 
                                    }}
                                />
                            </div>
                            <button 
                                className="btn btn--ghost btn--mini resonance-glow-bridge"
                                onClick={handleImportVault}
                                disabled={loading}
                                style={{ 
                                    height: '34px',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0 12px',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    gap: '8px'
                                }}
                            >
                                <IndraIcon name="VAULT" size="12px" color="var(--color-accent)" />
                                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>IMPORTAR</span>
                            </button>
                        </div>

                        <div className="spread" style={{ marginTop: 'var(--space-2)' }}>
                            {/* SELECTOR DE MODO (COSMOS vs REALIDAD) */}
                            {contextStack.length === 0 ? (
                                <div className="shelf--tight glass" style={{ padding: '3px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-void)' }}>
                                    <button 
                                        className={`btn btn--xs ${browserMode === 'PINS' ? 'btn--active-glass' : 'btn--ghost'}`} 
                                        onClick={() => setBrowserMode('PINS')}
                                        style={{ fontSize: '9px', padding: '4px 12px', borderRadius: '6px', border: 'none', background: browserMode === 'PINS' ? 'var(--color-accent)' : 'transparent', color: browserMode === 'PINS' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)' }}
                                    >
                                        PINS
                                    </button>
                                    <button 
                                        className={`btn btn--xs ${browserMode === 'REALITY' ? 'btn--active-glass' : 'btn--ghost'}`} 
                                        onClick={() => setBrowserMode('REALITY')}
                                        style={{ fontSize: '9px', padding: '4px 12px', borderRadius: '6px', border: 'none', background: browserMode === 'REALITY' ? 'var(--color-accent)' : 'transparent', color: browserMode === 'REALITY' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)' }}
                                    >
                                        SERVICIOS
                                    </button>
                                </div>
                            ) : <div />}

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
                    </div>

                    {/* ── BROWSER AREA ── */}
                    <div className="fill stack" style={{ overflowY: 'auto', minHeight: '300px', gap: '2px', paddingRight: 'var(--space-2)' }}>
                        {loading ? (
                            <div className="fill center" style={{ opacity: 0.2, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{t('PULSING_CORE')}</div>
                        ) : (
                            items
                                .map((projection, index) => {
                                    if (!projection) return null;
                                    const titleStr = String(projection.title || 'SIN_TITULO');
                                    const idStr = String(projection.id || 'SIN_ID');
                                    const searchStr = String(searchTerm || '').toUpperCase();

                                    const matchesSearch = !searchTerm ||
                                        (titleStr.toUpperCase().includes(searchStr)) ||
                                        (idStr.toUpperCase().includes(searchStr));
                                    const matchesClass = !activeClassFilter || projection.class === activeClassFilter;
                                    
                                    if (!matchesSearch || !matchesClass) return null;

                                    return (
                                        <button 
                                            key={`${projection.provider}_${projection.class}_${projection.id}_${index}`} 
                                            className="shelf--loose glass-hover" 
                                            onClick={() => handleDrillDown(projection.raw)}
                                            style={{ borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}
                                        >
                                            <IndraIcon name={projection.theme.icon} size="16px" style={{ opacity: 1, color: projection.theme.color }} />
                                            <div className="stack--tight fill" style={{ textAlign: 'left' }}>
                                                <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>{projection.title}</span>
                                                <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{projection.subtitle}</span>
                                            </div>
                                            {projection.capabilities.raw.includes('HIERARCHY_TREE') && <IndraIcon name="CHEVRON_RIGHT" size="12px" style={{ opacity: 0.3 }} />}
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
        </>
    );
}
