import React, { useState, useMemo } from 'react';
import { DataProjector } from '../../services/DataProjector';
import { AtomGlif } from './AtomGlif';
import { AgencyChassis } from './AgencyChassis';
import { ResultGalleryCard } from './ResultGalleryCard';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';
import { IndraIcon } from '../utilities/IndraIcons';
import { EmptyState } from '../utilities/primitives';
import { registry } from '../../services/EngineRegistry';
import { executeDirective } from '../../services/directive_executor';
import { toastEmitter } from '../../services/toastEmitter';

/**
 * ArtifactGrid: Implementación del Modelo Tríptico Áureo (28/44/28) de Mendoza-Collazos.
 * 🧬 AXIOMA DE RESONANCIA: El Grid inyecta la conciencia sistémica a través de data-attributes.
 */
export function ArtifactGrid({ pins, onResonate }) {
    const t = useLexicon();
    const [focusedEngineId, setFocusedEngineId] = useState(null);
    const pendingSyncs = useAppState(s => s.pendingSyncs);
    const pendingCreations = useAppState(s => s.pendingCreations);

    // Clasificación Semántica via DataProjector (Integrando creaciones optimistas)
    const { potency, agency, manifestation } = useMemo(() => {
        const allAtoms = [...(pins || []), ...(pendingCreations || [])];
        return DataProjector.projectAgenticWorkspace(allAtoms);
    }, [pins, pendingCreations]);

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
            <section className="triptych-col-potency no-scrollbar" style={{ display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-text-secondary)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_potency')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {potency.length} ]</span>
                    </div>
                    
                    <div className="shelf--tight" style={{ gap: '4px', position: 'relative' }}>
                        <CreationMenu 
                            category={t('ui_column_potency').replace('I. ', '')} 
                            options={[
                                { class: 'DATA_SCHEMA', label: t('DATA_SCHEMA'), icon: 'SCHEMA' },
                                { action: 'SCAN_VAULT', label: "IMPORTAR VAULT", icon: 'VAULT' }
                            ]} 
                        />
                    </div>
                </header>
                <div className="mobile-horizontal-shelf no-scrollbar" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-4)',
                    padding: '24px var(--space-4)',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    {potency.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            className="resonance-glow--potency"
                            style={{ transition: 'all 0.3s ease', borderRadius: 'var(--radius-sm)' }}
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
            <section className="triptych-col-agency no-scrollbar" style={{ display: 'flex', flexDirection: 'column', padding: '0 var(--space-4)' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-accent)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_agency')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {agency.length} ]</span>
                    </div>

                    <div className="shelf--tight" style={{ gap: '4px', position: 'relative' }}>
                        <CreationMenu 
                            category="LÓGICA" 
                            options={[
                                { class: 'LOGIC_BRIDGE', label: t('LOGIC_BRIDGE'), icon: 'BRIDGE' },
                                { class: 'WORKFLOW', label: t('WORKFLOW_DESIGNER'), icon: 'WORKFLOW' },
                                { class: 'AEE_RUNNER', label: t('AEE_RUNNER'), icon: 'PLAY' }
                            ]} 
                        />
                    </div>
                </header>
                <div className="mobile-horizontal-shelf no-scrollbar" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-8)',
                    padding: '24px var(--space-4)',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    {agency.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            className="resonance-glow--agency"
                            style={{ transition: 'all 0.3s ease', borderRadius: '8px' }}
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
            <section className="triptych-col-manifest no-scrollbar" style={{ display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-cold)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_manifestation')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {manifestation.length} ]</span>
                    </div>

                    <div className="shelf--tight" style={{ gap: '4px', position: 'relative' }}>
                        <CreationMenu 
                            category="RESULTADOS" 
                            options={[
                                { class: 'DOCUMENT', label: t('DOCUMENT_DESIGNER'), icon: 'DOCUMENT' },
                                { class: 'VIDEO_PROJECT', label: t('VIDEO_PROJECT'), icon: 'VIDEO_PROJECT' },
                                { class: 'CALENDAR_HIVE', label: t('CALENDAR_HIVE'), icon: 'CALENDAR' }
                            ]} 
                        />
                    </div>
                </header>
                <div className="mobile-horizontal-shelf no-scrollbar" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-4)',
                    padding: '24px var(--space-4)',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    {manifestation.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            className="resonance-glow--manifestation"
                            style={{ transition: 'all 0.3s ease', borderRadius: '4px' }}
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

/**
 * CreationMenu Component 
 * Un menú desplegable minimalista (Fractal Invocator)
 */
function CreationMenu({ category, options }) {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
        <div className="creation-invocator" style={{ position: 'relative' }}>
            <button 
                className={`btn btn--xs ${isOpen ? 'btn--active-glass' : 'btn-fractal-invocation'}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    padding: '4px 8px', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: 'var(--indra-ui-radius)',
                    background: isOpen ? 'var(--color-accent-dim)' : 'transparent'
                }}
            >
                <IndraIcon name={isOpen ? "CLOSE" : "PLUS"} size="14px" />
            </button>

            {isOpen && (
                <div className="glass shadow-glow" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 200,
                    marginTop: '8px',
                    minWidth: '180px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    animation: 'slideInDown 0.2s ease-out'
                }}>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '8px', fontWeight: '800', opacity: 0.5, letterSpacing: '0.1em' }}>{category}</span>
                    </div>
                    <div className="stack--tight" style={{ padding: '4px' }}>
                        {options.map(opt => (
                            <button 
                                key={opt.class}
                                className="btn btn--block btn--ghost shelf--tight"
                                style={{ justifyContent: 'flex-start', padding: '8px 12px', textAlign: 'left' }}
                                onClick={() => {
                                    if (opt.action === 'SCAN_VAULT') {
                                        executeDirective({
                                            provider: 'system',
                                            protocol: 'SYSTEM_BLUEPRINT_SYNC',
                                            data: { action: 'SCAN' }
                                        }, useAppState.getState().coreUrl, useAppState.getState().sessionSecret)
                                        .then(res => {
                                            if (res.items) toastEmitter.success("Blueprints detectados: " + res.items.length);
                                        });
                                    } else {
                                        const label = `${opt.label}_${Date.now().toString().slice(-4)}`;
                                        useAppState.getState().createArtifact(opt.class, label);
                                    }
                                    setIsOpen(false);
                                }}
                            >
                                <IndraIcon name={opt.icon} size="14px" style={{ opacity: 0.7, color: opt.action === 'SCAN_VAULT' ? 'var(--color-warm)' : 'inherit' }} />
                                <span style={{ fontSize: '10px', marginLeft: '10px', color: opt.action === 'SCAN_VAULT' ? 'var(--color-warm)' : 'inherit' }}>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
