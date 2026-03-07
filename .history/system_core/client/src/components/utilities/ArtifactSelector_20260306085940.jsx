/**
 * =============================================================================
 * ARTEFACTO: components/utilities/ArtifactSelector.jsx
 * RESPONSABILIDAD: Explorador Universal de Jerarquías (Hierarchy Walker).
 *
 * DHARMA (Simplicidad Determinista):
 *   - Proyección Pura: Muestra lo que el Core entrega en el nivel actual.
 *   - Cero Burocracia: Sin pestañas, sin mapas de clase externos.
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { executeDirective } from '../../services/directive_executor.js';
import { useAppState } from '../../state/app_state.js';
import { IndraIcon } from './IndraIcons.jsx';
import { useLexicon } from '../../services/lexicon.js';

export default function ArtifactSelector({ title = 'EXPLORE_ARTIFACTS', onSelect, onCancel, filter = {} }) {
    const { services: manifest, coreUrl, sessionSecret } = useAppState();
    const { lang } = useAppState();
    const t = useLexicon(lang);

    const [contextStack, setContextStack] = useState([]); // Stack de navegación
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const currentContext = contextStack.length > 0 ? contextStack[contextStack.length - 1] : null;

    // Carga recursiva determinista
    const loadLevel = useCallback(async () => {
        setLoading(true);
        try {
            if (!currentContext) {
                // Nivel Raíz: Providers del Manifiesto
                setItems(manifest || []);
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
        } else {
            onSelect(item);
        }
    };

    const goBack = () => setContextStack(contextStack.slice(0, -1));

    // Mapeo determinista de iconos (Sincero)
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
            background: 'var(--color-void-overlay)',
            backdropFilter: 'var(--blur-glass)',
            zIndex: 1000
        }} onClick={onCancel}>
            <div className="artifact-selector stack" style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                width: '450px',
                maxHeight: '80vh',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>
                {/* Header / Breadcrumbs */}
                <header className="stack--tight" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div className="spread">
                        <h2 style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.2em' }}>{title}</h2>
                        <button onClick={onCancel} className="btn-icon"><IndraIcon name="CLOSE" size="14px" /></button>
                    </div>

                    <div className="shelf--tight" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                        <span onClick={() => setContextStack([])} style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>ROOT</span>
                        {contextStack.map((ctx, i) => (
                            <React.Fragment key={ctx.id}>
                                <span>/</span>
                                <span
                                    onClick={() => setContextStack(contextStack.slice(0, i + 1))}
                                    style={{ cursor: 'pointer', color: i === contextStack.length - 1 ? 'white' : 'var(--color-accent)' }}
                                >
                                    {ctx.handle?.label || ctx.id}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </header>

                {/* Search Bar / Filter Area */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
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
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                width: '100%',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Browser Area */}
                <div className="fill stack" style={{ overflowY: 'auto', minHeight: '300px', gap: '2px' }}>
                    {loading ? (
                        <div className="fill center" style={{ opacity: 0.3, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>PULSING_CORE...</div>
                    ) : (
                        items
                            .filter(item => {
                                if (!searchTerm) return true;
                                const label = item.handle?.label?.toUpperCase() || '';
                                const id = item.id?.toUpperCase() || '';
                                return label.includes(searchTerm.toUpperCase()) || id.includes(searchTerm.toUpperCase());
                            })
                            .map(item => (
                                <button
                                    key={item.id}
                                    className="shelf--loose glass-hover"
                                    onClick={() => handleDrillDown(item)}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)'
                                    }}
                                >
                                    <IndraIcon name={getIcon(item.class)} size="16px" style={{ opacity: 0.7 }} />
                                    <div className="stack--tight fill">
                                        <span style={{ fontSize: '13px', color: 'white' }}>{item.handle?.label || item.id}</span>
                                        <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>{item.class}</span>
                                    </div>
                                    {item.protocols?.includes('HIERARCHY_TREE') && <IndraIcon name="CHEVRON_RIGHT" size="12px" style={{ opacity: 0.3 }} />}
                                </button>
                            ))
                    )}
                </div>
            </div>

            <style>{`
                .glass-hover:hover { background: rgba(255,255,255,0.05); }
                .btn-icon { background: none; border: none; color: white; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; }
                .btn-icon:hover { opacity: 1; }
                .center { display: flex; align-items: center; justify-content: center; }
            `}</style>
        </div>
    );
}
