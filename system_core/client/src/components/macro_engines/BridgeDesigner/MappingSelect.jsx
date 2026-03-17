/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/MappingSelect.jsx
 * RESPONSABILIDAD: Selector industrial para mapeo de datos.
 * 
 * DHARMA:
 *   - Estética Stark: Fondo profundo, bordes neón, tipografía mono.
 *   - Limpieza Visual: Evita el look de "browser default" a toda costa.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export function MappingSelect({ value, options = [], onChange, placeholder = "SELECCIONAR FUENTE..." }) {
    return (
        <div className="shelf--tight fill" style={{ position: 'relative', width: '100%' }}>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    background: 'var(--color-bg-void)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 28px 4px 8px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all var(--transition-fast)',
                    boxShadow: value ? 'inset 0 0 5px var(--color-accent-dim)' : 'none',
                    borderColor: value ? 'var(--color-accent)' : 'var(--color-border)'
                }}
                className="indra-select-industrial"
            >
                <option value="" disabled style={{ background: 'var(--color-bg-deep)', color: 'var(--color-text-tertiary)' }}>
                    -- {placeholder} --
                </option>
                
                {/* Agrupación lógica por tipo */}
                {['SOURCE', 'OPERATOR'].map(groupType => {
                    const groupOptions = options.filter(opt => opt.type === groupType);
                    if (groupOptions.length === 0) return null;
                    
                    return (
                        <optgroup 
                            key={groupType} 
                            label={groupType === 'SOURCE' ? 'FUENTES (SCHEMAS)' : 'OPERACIONES (PIPELINE)'}
                            style={{ background: 'var(--color-bg-deep)', color: 'var(--color-accent)', fontSize: '9px' }}
                        >
                            {groupOptions.map(opt => (
                                <option 
                                    key={opt.value} 
                                    value={opt.value}
                                    style={{ background: 'var(--color-bg-surface)', color: 'white' }}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </optgroup>
                    );
                })}
            </select>
            
            <div style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                opacity: 0.5,
                color: value ? 'var(--color-accent)' : 'inherit'
            }}>
                <IndraIcon name="CHEVRON_DOWN" size="8px" />
            </div>

            <style>{`
                .indra-select-industrial:hover {
                    border-color: var(--color-accent) !important;
                    background: var(--color-bg-deep) !important;
                }
                .indra-select-industrial:focus {
                    border-color: var(--color-accent) !important;
                    box-shadow: 0 0 10px var(--color-accent-glow) !important;
                }
            `}</style>
        </div>
    );
}
