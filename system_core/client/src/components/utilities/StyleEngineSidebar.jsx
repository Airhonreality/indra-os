import React, { useState, useEffect } from 'react';
import { IndraMicroHeader } from './IndraMicroHeader';
import { IndraIcon } from './IndraIcons';
import { useShell } from '../../context/ShellContext';
import './StyleEngineSidebar.css';

/**
 * =============================================================================
 * UTILIDAD COGNITIVA: StyleEngineSidebar
 * RESPONSABILIDAD: El "Panel 1/3", un Global Style Engine que acompaña cualquier
 * Macro o Nexus view y permite editar el AST CSS en tiempo real con herramientas
 * ergonómicas (Sliders, Swatches, etc.).
 * =============================================================================
 */

const STYLE_MODULES = [
    {
        id: 'chromatics',
        title: 'CHROMATICS & IDENTITY',
        desc: 'Variables de Colorización Central',
        icon: 'LAYERS',
        params: [
            { key: '--color-accent', label: 'Accent Palette', desc: 'Identidad y acento primario (Botones, Destellos)', type: 'color' },
            { key: '--color-bg-void', label: 'Void Abyss', desc: 'El fondo absoluto más oscuro', type: 'color' },
            { key: '--color-bg-surface', label: 'Floating Surface', desc: 'Fondo de los paneles y cajas (Engines, Modales)', type: 'color' },
            { key: '--color-text-primary', label: 'Primary Typography', desc: 'Acento del texto más legible', type: 'color' }
        ]
    },
    {
        id: 'topology',
        title: 'TOPOLOGY & METRICS',
        desc: 'Variables de Diagramación, Paddings y Margins',
        icon: 'FRAME',
        params: [
            { key: '--indra-ui-margin', label: 'Outer Padding Margin', desc: 'Margen exterior canónico de la UI (El respiro)', type: 'slider', min: 0, max: 64, unit: 'px' },
            { key: '--indra-ui-gap', label: 'Modular Inter-Gap', desc: 'Distancia entre los flexboxes y motores (Grid System)', type: 'slider', min: 0, max: 32, unit: 'px' },
            { key: '--indra-ui-radius', label: 'Global Border Radius', desc: 'Redondez canónica estructural', type: 'slider', min: 0, max: 24, unit: 'px' },
            { key: '--space-4', label: 'Standard Padding', desc: 'Espacio de separación interno estándar', type: 'slider', min: 0, max: 48, unit: 'px' }
        ]
    },
    {
        id: 'atmosphere',
        title: 'ATMOSPHERE & GLASS',
        desc: 'Opacidades, Blur y HUD Holografics',
        icon: 'EYE',
        params: [
            { key: '--glass-bg', label: 'Glass Material Opacity', desc: 'Nivel de opacidad rgba para superficies tipo blur/glass', type: 'text' },
            { key: '--blur-glass', label: 'Atmospheric Blur', desc: 'Nivel de difuminado canónico (ej. blur(16px))', type: 'text' }
        ]
    }
];

// ----- CONTROLES INDIVIDUALES -----

const StyleSlider = ({ label, desc, val, min, max, unit, onChange }) => {
    const numVal = parseInt(val) || 0;
    
    return (
        <div className="se-param">
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

const StyleColor = ({ label, desc, val, onChange }) => {
    // Basic hex support for color inputs, else fallback to text
    const isHex = val.startsWith('#');
    
    return (
        <div className="se-param">
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

const StyleTextInput = ({ label, desc, val, onChange }) => (
    <div className="se-param">
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
    const [liveVars, setLiveVars] = useState({});

    useEffect(() => {
        if (!isStyleEngineOpen) return;
        const rootStyle = getComputedStyle(document.documentElement);
        const initialVars = {};
        
        STYLE_MODULES.forEach(group => {
            group.params.forEach(p => {
                initialVars[p.key] = rootStyle.getPropertyValue(p.key).trim();
            });
        });
        
        setLiveVars(initialVars);
    }, [isStyleEngineOpen]);

    const handleVarChange = (key, newValue) => {
        setLiveVars(prev => ({ ...prev, [key]: newValue }));
        document.documentElement.style.setProperty(key, newValue);
    };

    if (!isStyleEngineOpen) return null;

    return (
        <>
            <div className="style-engine-backdrop" onClick={() => setIsStyleEngineOpen(false)} />
            <aside className="style-engine-sidebar">
                
                {/* ── MACRO/MICRO HEADER DEL KINETICS ENGINE ── */}
                <div className="micro-header">
                    <div className="shelf--tight">
                        <IndraIcon name="SETTINGS" color="var(--color-accent)" />
                        <div className="stack--tight">
                            <h3 className="micro-header__title" style={{ fontSize: '13px' }}>GLOBAL STYLE ENGINE</h3>
                            <span className="micro-header__description">Administración de Estética Global e Interfaces</span>
                        </div>
                    </div>
                    <button className="btn btn--white" onClick={() => setIsStyleEngineOpen(false)}>DONE</button>
                </div>

                <div className="style-engine-sidebar__scroll">
                    
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
                            <p className="se-module__desc">
                                Parámetros locales del entorno activo en ejecución.
                            </p>
                            
                            <div className="se-module__params">
                                <StyleColor 
                                    label="Universe Accent Identity" 
                                    desc="Color representativo que se inyecta por cascada en toda la UI de este macro-engine." 
                                    val={liveVars['--indra-dynamic-accent'] || activeArtifact.color || '#00f5d4'} 
                                    onChange={(v) => handleVarChange('--indra-dynamic-accent', v)} 
                                />
                            </div>
                        </div>
                    )}

                    {/* ── GLOBAL CANONICAL PARAMETERS ── */}
                    {STYLE_MODULES.map(module => (
                        <div key={module.id} className="se-module">
                            <div className="se-module__header">
                                <IndraIcon name={module.icon} size="10px" color="var(--color-text-tertiary)" />
                                <span className="se-module__title">{module.title}</span>
                            </div>
                            <p className="se-module__desc">{module.desc}</p>
                            
                            <div className="se-module__params">
                                {module.params.map(param => {
                                    const val = liveVars[param.key] || '';
                                    
                                    if (param.type === 'slider') {
                                        return <StyleSlider key={param.key} {...param} val={val} onChange={(v) => handleVarChange(param.key, v)} />;
                                    }
                                    if (param.type === 'color') {
                                        return <StyleColor key={param.key} {...param} val={val} onChange={(v) => handleVarChange(param.key, v)} />;
                                    }
                                    return <StyleTextInput key={param.key} {...param} val={val} onChange={(v) => handleVarChange(param.key, v)} />;
                                })}
                            </div>
                        </div>
                    ))}
                </div>

            </aside>
        </>
    );
}
