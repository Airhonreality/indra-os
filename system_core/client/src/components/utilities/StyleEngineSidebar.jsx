import { useState, useEffect, useMemo } from 'react';
import { IndraMicroHeader } from './IndraMicroHeader';
import { IndraIcon } from './IndraIcons';
import { useShell } from '../../context/ShellContext';
import { useAppState } from '../../state/app_state';
import { TokenDiscovery } from '../../services/TokenDiscovery';
import { AxiomRegistry } from '../../services/AxiomRegistry';
import './StyleEngineSidebar.css';

/**
 * =============================================================================
 * UTILIDAD COGNITIVA: StyleEngineSidebar (v2 Industrial)
 * RESPONSABILIDAD: El "Panel 1/3", un Global Style Engine dinámico.
 * AXIOMA: No contiene una lista de estilos; los "descubre" del CSS.
 * =============================================================================
 */

// ----- CONTROLES INDIVIDUALES -----

const StyleSlider = ({ label, desc, val, min, max, unit, onChange, isDirty }) => {
    const numVal = parseInt(val) || 0;
    
    return (
        <div className={`se-param ${isDirty ? 'se-param--dirty' : ''}`}>
            <div className="se-param__header">
                <span className="se-param__label">{label}</span>
                <span className="se-param__val">{numVal}{unit}</span>
            </div>
            <p className="se-param__desc">{desc}</p>
            <input 
                type="range" 
                className="se-slider" 
                min={min} 
                max={max} 
                value={numVal}
                onChange={(e) => onChange(`${e.target.value}${unit}`)}
            />
        </div>
    );
};

const StyleColor = ({ label, desc, val, onChange, isDirty }) => {
    const isHex = val.startsWith('#');
    
    return (
        <div className={`se-param ${isDirty ? 'se-param--dirty' : ''}`}>
            <div className="se-param__header">
                <span className="se-param__label">{label}</span>
                {isHex && (
                    <input 
                        type="color" 
                        value={val} 
                        onChange={(e) => onChange(e.target.value)}
                        className="se-color-picker"
                    />
                )}
            </div>
            <p className="se-param__desc">{desc}</p>
            <input 
                type="text" 
                className="se-text-input" 
                value={val}
                onChange={(e) => onChange(e.target.value)}
                placeholder="rgba(0,0,0,1) o #hex"
            />
        </div>
    );
};

const StyleTextInput = ({ label, desc, val, onChange, isDirty }) => (
    <div className={`se-param ${isDirty ? 'se-param--dirty' : ''}`}>
        <div className="se-param__header">
            <span className="se-param__label">{label}</span>
        </div>
        <p className="se-param__desc">{desc}</p>
        <input 
            type="text" 
            className="se-text-input" 
            value={val}
            onChange={(e) => onChange(e.target.value)}
            placeholder=""
        />
    </div>
);

export function StyleEngineSidebar() {
    const { isStyleEngineOpen, setIsStyleEngineOpen, activeArtifact } = useShell();
    const { updateArtifact } = useAppState();
    
    const [styleModules, setStyleModules] = useState([]);
    const [liveVars, setLiveVars] = useState({});
    const [dirtyVars, setDirtyVars] = useState(new Set());
    const [isFixating, setIsFixating] = useState(false);

    // ── DESCUBRIMIENTO DINÁMICO ──
    useEffect(() => {
        if (!isStyleEngineOpen) return;
        
        async function boot() {
            const discovered = await TokenDiscovery.discover();
            AxiomRegistry.init(discovered);
            setStyleModules(discovered);
            
            const rootStyle = getComputedStyle(document.documentElement);
            const initialVars = {};
            discovered.forEach(group => {
                group.params.forEach(p => {
                    initialVars[p.key] = rootStyle.getPropertyValue(p.key).trim();
                });
            });
            setLiveVars(initialVars);
        }
        
        boot();
    }, [isStyleEngineOpen]);

    const handleVarChange = (key, newValue) => {
        setLiveVars(prev => ({ ...prev, [key]: newValue }));
        setDirtyVars(prev => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });
        document.documentElement.style.setProperty(key, newValue);
    };

    const hasChanges = dirtyVars.size > 0;

    if (!isStyleEngineOpen) return null;

    return (
        <>
            <div className="style-engine-backdrop" onClick={() => setIsStyleEngineOpen(false)} />
            <aside className="style-engine-sidebar">
                
                <div className="micro-header">
                    <div className="shelf--tight">
                        <IndraIcon name="SETTINGS" color="var(--color-accent)" />
                        <div className="stack--tight">
                            <h3 className="micro-header__title" style={{ fontSize: '13px' }}>UI AUTODISCOVERY ENGINE</h3>
                            <span className="micro-header__description">
                                {hasChanges ? '⚠️ RESONANCIA DE SOMBRA ACTIVA' : 'Sincronía estática estable'}
                            </span>
                        </div>
                    </div>
                    <button className="btn btn--white" onClick={() => setIsStyleEngineOpen(false)}>DONE</button>
                </div>

                <div className="style-engine-sidebar__scroll">
                    
                    {/* ── ALERTA DE RESONANCIA DE SOMBRA ── */}
                    {hasChanges && (
                        <div className="se-alert stack--tight">
                            <div className="shelf--tight">
                                <IndraIcon name="SYNC" size="12px" color="var(--color-warm)" />
                                <strong>REALIDAD VOLÁTIL</strong>
                            </div>
                            <p>Has modificado {dirtyVars.size} parámetros. Estos cambios se perderán al recargar si no se sinceran en el Core.</p>
                        </div>
                    )}

                    {/* ── CURRENT ACTIVE UNIVERSE ── */}
                    {activeArtifact && (
                        <div className="se-module" style={{ 
                            borderColor: 'var(--indra-dynamic-accent)', 
                            background: 'var(--color-bg-deep)',
                            boxShadow: '0 0 15px var(--indra-dynamic-bg)'
                        }}>
                            <div className="se-module__header">
                                <IndraIcon name={activeArtifact.class || 'ATOM'} size="10px" color="var(--indra-dynamic-accent)" />
                                <span className="se-module__title" style={{ color: 'var(--indra-dynamic-accent)' }}>
                                    ACTIVE UNIVERSE: {activeArtifact.class || 'ENGINE'}
                                </span>
                            </div>
                            
                            <div className="se-module__params">
                                <StyleColor 
                                    label="Universe Accent Identity" 
                                    desc="Color inyectado por cascada en este macro-engine." 
                                    val={liveVars['--indra-dynamic-accent'] || activeArtifact.color || '#00f5d4'} 
                                    onChange={(v) => handleVarChange('--indra-dynamic-accent', v)}
                                    isDirty={dirtyVars.has('--indra-dynamic-accent')}
                                />

                                <div className="mt-3">
                                    <button 
                                        className="btn btn--xs btn--ghost w-100 shelf--tight" 
                                        style={{ border: '1px solid var(--indra-dynamic-accent)', color: 'var(--indra-dynamic-accent)' }}
                                        disabled={isFixating}
                                        onClick={async () => {
                                            setIsFixating(true);
                                            try {
                                                await updateArtifact(activeArtifact.id, activeArtifact.provider, {
                                                    color: liveVars['--indra-dynamic-accent']
                                                });
                                                setDirtyVars(prev => {
                                                    const next = new Set(prev);
                                                    next.delete('--indra-dynamic-accent');
                                                    return next;
                                                });
                                            } finally {
                                                setIsFixating(false);
                                            }
                                        }}
                                    >
                                        <IndraIcon name="SAVE" size="10px" /> 
                                        {isFixating ? 'SINCERANDO...' : 'SINCERAR IDENTIDAD'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── DYNAMICALLY DISCOVERED MODULES ── */}
                    {styleModules.map(module => (
                        <div key={module.id} className="se-module">
                            <div className="se-module__header">
                                <IndraIcon name={module.icon || "LAYERS"} size="10px" color="var(--color-text-tertiary)" />
                                <span className="se-module__title">{module.title}</span>
                            </div>
                            <p className="se-module__desc">{module.desc}</p>
                            
                            <div className="se-module__params">
                                {module.params.map(param => {
                                    const val = liveVars[param.key] || '';
                                    const props = { ...param, val, isDirty: dirtyVars.has(param.key), onChange: (v) => handleVarChange(param.key, v) };
                                    
                                    if (param.type === 'slider') return <StyleSlider key={param.key} {...props} />;
                                    if (param.type === 'color') return <StyleColor key={param.key} {...props} />;
                                    return <StyleTextInput key={param.key} {...props} />;
                                })}
                            </div>
                        </div>
                    ))}
                </div>

            </aside>
        </>
    );
}
