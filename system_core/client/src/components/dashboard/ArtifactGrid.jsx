import React, { useState, useMemo } from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { useAppState } from '../../state/app_state';
import { DataProjector } from '../../services/DataProjector';
import { useLexicon } from '../../services/lexicon';
import { executeDirective } from '../../services/directive_executor';
import { toastEmitter } from '../../services/toastEmitter';
import { registry } from '../../services/EngineRegistry';
import { ArtifactCard } from './ArtifactCard';
import { PotencyCard } from './PotencyCard';
import { AgencyChassis } from './AgencyChassis';
import { EmptyState } from '../utilities/primitives';

/**
 * ArtifactGrid: Implementación del Modelo Tríptico Áureo (28/44/28) de Mendoza-Collazos.
 * 🧬 AXIOMA DE RESONANCIA: El Grid inyecta la conciencia sistémica a través de data-attributes.
 * ☯️ DIFERENCIACIÓN POLIMÓRFICA: Cada columna proyecta una naturaleza distinta (Potencia/Agencia/Manifestación).
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

    // DHARMA (Autodescubrimiento): Filtrar motores del EngineRegistry por su categoría agentic
    const allEngines = registry.getAll();
    const creatableEngines = allEngines.filter(e => e.manifest?.canCreate);

    const getOptionsForCategory = (catKey) => {
        const classesForCat = DataProjector.getAgenticCategories()[catKey] || [];
        const dynamicOptions = creatableEngines
            .filter(e => classesForCat.includes(e.atomClass))
            .map(e => ({
                class: e.atomClass,
                label: e.manifest.label || e.atomClass,
                icon: e.manifest.icon || 'ATOM'
            }));

        // Inyectar acciones especiales por columna
        if (catKey === 'POTENCY') {
            dynamicOptions.push({ action: 'OPEN_INSPECTOR', label: "INSPECCIONAR SILOS", icon: 'SEARCH' });
            dynamicOptions.push({ action: 'SCAN_VAULT', label: "IMPORTAR VAULT", icon: 'VAULT' });
        }

        return dynamicOptions;
    };

    return (
        <div 
            className="artifact-grid-triptych indra-grid-governor" 
            style={{ 
                display: 'flex',
                height: '100%', 
                overflow: 'hidden',
                padding: 'var(--indra-ui-margin)',
                background: 'var(--color-bg-void)',
                gap: 'var(--space-4)'
            }}
            onMouseLeave={() => setFocusedEngineId(null)}
        >
            {/* Columna I: POTENCIA (28%) - Reserva Sistémica */}
            <section className="triptych-col-potency no-scrollbar" style={{ display: 'flex', flexDirection: 'column', width: '28%' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-text-secondary)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_potency')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {potency.length} ]</span>
                    </div>
                    
                    <div className="shelf--tight" style={{ gap: '4px', position: 'relative' }}>
                        <CreationMenu 
                            category={t('ui_column_potency').replace('I. ', '')} 
                            options={getOptionsForCategory('POTENCY')} 
                            onAction={(action) => {
                                if (action === 'OPEN_INSPECTOR' && onResonate) onResonate();
                            }}
                        />
                    </div>
                </header>
                <div className="column-content no-scrollbar" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-3)',
                    overflowY: 'auto'
                }}>
                    {potency.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            style={{ transition: 'all 0.3s ease' }}
                        >
                            <PotencyCard 
                                atom={atom.raw} 
                                onHoverStart={(id) => setFocusedEngineId(id)}
                                onHoverEnd={() => setFocusedEngineId(null)}
                            />
                        </div>
                    ))}
                    {potency.length === 0 && (
                        <EmptyState icon="SCHEMA" title="SIN POTENCIA" description="No hay materia prima activa." size="sm" />
                    )}
                </div>
            </section>

            {/* Columna II: AGENCIA (44%) - Núcleo de Transformación */}
            <section className="triptych-col-agency no-scrollbar" style={{ display: 'flex', flexDirection: 'column', width: '44%', padding: '0 var(--space-2)' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-accent)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_agency')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {agency.length} ]</span>
                    </div>

                    <div className="shelf--tight" style={{ gap: '4px', position: 'relative' }}>
                        <CreationMenu 
                            category={t('ui_column_agency').replace('II. ', '')} 
                            options={getOptionsForCategory('AGENCY')} 
                        />
                    </div>
                </header>
                <div className="column-content no-scrollbar" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-3)',
                    overflowY: 'auto'
                }}>
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

            {/* Columna III: MANIFESTACIÓN (28%) - Teleología Industrial */}
            <section className="triptych-col-manifestation no-scrollbar" style={{ display: 'flex', flexDirection: 'column', width: '28%' }}>
                <header style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="shelf--tight">
                        <div style={{ width: '4px', height: '4px', background: 'var(--color-cold)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>{t('ui_column_manifestation')}</span>
                        <span style={{ fontSize: '9px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>[ {manifestation.length} ]</span>
                    </div>

                    <div className="shelf--tight" style={{ gap: '4px', position: 'relative' }}>
                        <CreationMenu 
                            category={t('ui_column_manifestation').replace('III. ', '')} 
                            options={getOptionsForCategory('MANIFESTATION')} 
                        />
                    </div>
                </header>
                <div className="column-content no-scrollbar" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-3)',
                    overflowY: 'auto'
                }}>
                    {manifestation.map(atom => (
                        <div key={atom.id} 
                            data-resonance={pendingSyncs[atom.id] ? "active" : "idle"}
                            data-highlighted={getHighlightState(atom.id)}
                            style={{ transition: 'all 0.3s ease' }}
                        >
                            <ArtifactCard 
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
function CreationMenu({ category, options, onAction }) {
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
                        {options.map((opt, i) => (
                            <button 
                                key={opt.class || opt.action || i}
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
                                    } else if (opt.action && onAction) {
                                        onAction(opt.action);
                                    } else if (opt.class) {
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
