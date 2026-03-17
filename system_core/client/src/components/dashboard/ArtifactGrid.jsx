import React, { useState, useMemo } from 'react';
import { DataProjector } from '../../services/DataProjector';
import { AtomGlif } from './AtomGlif';
import { AgencyChassis } from './AgencyChassis';
import { ResultGalleryCard } from './ResultGalleryCard';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';
import { IndraIcon } from '../utilities/IndraIcons';
import { EmptyState } from '../utilities/primitives';

/**
 * ArtifactGrid: Implementación del Modelo Tríptico (20/50/30) de Mendoza-Collazos.
 * 🧬 AXIOMA DE RESONANCIA: El Grid inyecta la conciencia sistémica a través de data-attributes.
 */
export function ArtifactGrid({ pins }) {
    const t = useLexicon();
    const [focusedEngineId, setFocusedEngineId] = useState(null);
    const pendingSyncs = useAppState(s => s.pendingSyncs);

    // Clasificación Semántica via DataProjector
    const { potency, agency, manifestation } = useMemo(() => {
        return DataProjector.projectAgenticWorkspace(pins || []);
    }, [pins]);

    // Lógica de Iluminación por Relatividad (Resonancia Universal)
    const resonatesWith = useMemo(() => {
        if (!focusedEngineId) return new Set();
        
        const focused = (pins || []).find(a => a.id === focusedEngineId);
        if (!focused) return new Set();

        const links = new Set();
        
        // REGLA 1: Si es un MOTOR (AGENCIA)
        if (focused.payload?.sources) focused.payload.sources.forEach(id => links.add(id));
        (pins || []).filter(a => a._origin === focused.id).forEach(a => links.add(a.id));

        // REGLA 2: Si es un ESQUEMA (POTENCIA) -> Iluminar motores que lo usan
        (pins || []).filter(a => a.payload?.sources?.includes(focused.id)).forEach(a => links.add(a.id));

        // REGLA 3: Si es una MANIFESTACIÓN -> Iluminar motor origen
        if (focused._origin) links.add(focused._origin);

        return links;
    }, [focusedEngineId, pins]);

    const getHighlightState = (id) => {
        if (!focusedEngineId) return "idle";
        if (id === focusedEngineId) return "selective";
        if (resonatesWith.has(id)) return "relational";
        return "dimmed";
    };

    return (
        <div 
            className="artifact-grid-triptych indra-grid-governor" 
            style={{ 
                display: 'flex',
                height: 'var(--dashboard-grid-height)', 
                overflow: 'hidden',
                padding: 'var(--indra-ui-margin)',
                background: 'var(--color-bg-void)',
                gap: 'var(--space-4)'
            }}
            onMouseLeave={() => setFocusedEngineId(null)}
        >
            {/* Columna I: POTENCIA (28%) - Reserva Sistémica */}
            <section className="triptych-col-potency no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-text-secondary)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_potency')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {potency.length} ]</span>
                    </div>
                    
                    {/* Fractal Invocation: SIEMBRA */}
                    <button 
                        className="btn btn--xs btn-fractal-invocation" 
                        onClick={() => useAppState.getState().createArtifact('DATA_SCHEMA', 'NUEVO_ESQUEMA')}
                        style={{ padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: '2px' }}
                    >
                        <IndraIcon name="PLUS" size="10px" />
                        <span style={{ fontSize: '8px', marginLeft: '4px' }}>{t('action_seed_potency').toUpperCase().split(' ')[0]}</span>
                    </button>
                </header>
                <div className="stack--1 mobile-horizontal-shelf" style={{ flex: 1 }}>
                    {potency.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            style={{ transition: 'all 0.3s ease' }}
                        >
                            <AtomGlif 
                                atom={atom.raw} 
                                onHoverStart={(id) => setFocusedEngineId(id)}
                                onHoverEnd={() => setFocusedEngineId(null)}
                            />
                        </div>
                    ))}
                    {potency.length === 0 && (
                        <EmptyState 
                            icon="SCHEMA" 
                            title={t('ui_empty_potency')} 
                            description={t('ui_empty_potency_desc') || 'No hay esquemas de datos activos.'} 
                            size="sm"
                        />
                    )}
                </div>
            </section>

            {/* Columna II: AGENCIA (44%) - Núcleo de Transformación */}
            <section className="triptych-col-agency no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '0 var(--space-4)' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-accent)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_agency')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {agency.length} ]</span>
                    </div>

                    {/* Fractal Invocation: IGNICIÓN */}
                    <div className="shelf--tight">
                        <button 
                            className="btn btn--xs btn-fractal-invocation" 
                            onClick={() => useAppState.getState().createArtifact('BRIDGE', 'NUEVO_PUENTE')}
                            style={{ padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: '2px' }}
                        >
                            <IndraIcon name="BRIDGE" size="10px" />
                            <span style={{ fontSize: '8px', marginLeft: '4px' }}>{t('ui_bridge').toUpperCase() || 'PUENTE'}</span>
                        </button>
                        <button 
                            className="btn btn--xs btn-fractal-invocation" 
                            onClick={() => useAppState.getState().createArtifact('WORKFLOW', 'NUEVO_FLUJO')}
                            style={{ padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: '2px' }}
                        >
                            <IndraIcon name="WORKFLOW" size="10px" />
                            <span style={{ fontSize: '8px', marginLeft: '4px' }}>{t('ui_workflow').toUpperCase() || 'FLUJO'}</span>
                        </button>
                    </div>
                </header>
                <div className="stack--md mobile-horizontal-shelf" style={{ flex: 1 }}>
                    {agency.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            style={{ transition: 'all 0.3s ease' }}
                        >
                            <AgencyChassis 
                                atom={atom.raw} 
                                onHoverStart={(id) => setFocusedEngineId(id)}
                                onHoverEnd={() => setFocusedEngineId(null)}
                            />
                        </div>
                    ))}
                    {agency.length === 0 && (
                        <EmptyState 
                            icon="BRIDGE" 
                            title={t('ui_empty_agency')} 
                            description={t('ui_empty_agency_desc') || 'Los motores de transformación aparecerán aquí.'} 
                            size="md"
                        />
                    )}
                </div>
            </section>

            {/* Columna III: MANIFESTACIÓN (28%) - Prisma de Resultados */}
            <section className="triptych-col-manifest no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-warm)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_manifestation')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {manifestation.length} ]</span>
                    </div>

                    {/* Fractal Invocation: COSECHA */}
                    <button 
                        className="btn btn--xs btn-fractal-invocation" 
                        onClick={() => useAppState.getState().createArtifact('DOCUMENT', 'NUEVO_LOGRO')}
                        style={{ padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: '2px' }}
                    >
                        <IndraIcon name="TARGET" size="10px" />
                        <span style={{ fontSize: '8px', marginLeft: '4px' }}>{t('action_harvest').toUpperCase() || 'COSECHA'}</span>
                    </button>
                </header>
                <div className="mobile-horizontal-shelf" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)', flex: 1 }}>
                    {manifestation.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            style={{ transition: 'all 0.3s ease' }}
                        >
                            <ResultGalleryCard 
                                atom={atom.raw} 
                                onHoverStart={(id) => setFocusedEngineId(id)}
                                onHoverEnd={() => setFocusedEngineId(null)}
                            />
                        </div>
                    ))}
                    {manifestation.length === 0 && (
                        <EmptyState 
                            icon="TARGET" 
                            title={t('ui_empty_manifestation')} 
                            description={t('ui_empty_manifestation_desc') || 'Las cosechas y logros se listarán en esta columna.'} 
                            size="sm"
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
