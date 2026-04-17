/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/FilterConfig.jsx
 * RESPONSABILIDAD: Configuracion de filtrado de colecciones (vectores).
 * =============================================================================
 */

import { MappingSelect } from '../MappingSelect';

export function FilterConfig({ config, onUpdate, options = [] }) {
    const handleInputMapping = (key, value) => {
        const option = options.find(opt => opt.value === value);
        onUpdate({
            ...config,
            [key]: value,
            [key + '_label']: option?.label || value
        });
    };

    const criteria = [
        { code: '==', label: 'es igual a' },
        { code: '!=', label: 'es distinto de' },
        { code: '>', label: 'es mayor que' },
        { code: '<', label: 'es menor que' },
        { code: 'CONTAINS', label: 'contiene' }
    ];

    return (
        <div className="stack--tight">
            <div className="stack--tight">
                <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4, letterSpacing: '1px' }}>COLECCION_A_FILTRAR</span>
                <MappingSelect
                    value={config.input_a}
                    options={options}
                    onChange={(val) => handleInputMapping('input_a', val)}
                    placeholder="ELEGIR VECTOR (COLUMNA)..."
                />
            </div>

            <div className="shelf--tight" style={{ marginTop: 'var(--space-2)', gap: 'var(--space-2)' }}>
                <div className="stack--tight fill">
                    <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4 }}>PROPIEDAD</span>
                    <input 
                        className="input input--xs font-mono"
                        style={{ background: 'rgba(255,255,255,0.02)', fontSize: '10px' }}
                        value={config.property || ''}
                        onChange={(e) => onUpdate({ ...config, property: e.target.value })}
                        placeholder="ej: cat"
                    />
                </div>
                <div className="stack--tight">
                    <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4 }}>OP</span>
                    <select 
                        className="input input--xs font-mono"
                        style={{ background: 'rgba(255,255,255,0.02)', fontSize: '10px', minWidth: '80px' }}
                        value={config.criteria || '=='}
                        onChange={(e) => onUpdate({ ...config, criteria: e.target.value })}
                    >
                        {criteria.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                </div>
                <div className="stack--tight fill">
                    <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4 }}>VALOR_BUSCADO</span>
                    <input 
                        className="input input--xs font-mono"
                        style={{ background: 'rgba(255,255,255,0.02)', fontSize: '10px' }}
                        value={config.value || ''}
                        onChange={(e) => onUpdate({ ...config, value: e.target.value })}
                        placeholder="ej: PROD_01"
                    />
                </div>
            </div>
        </div>
    );
}
