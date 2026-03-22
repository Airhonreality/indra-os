/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/LookupConfig.jsx
 * RESPONSABILIDAD: Configuracion de busquedas cruzadas (referencia de datos).
 * =============================================================================
 */

import React from 'react';
import { MappingSelect } from '../MappingSelect';

export function LookupConfig({ config, onUpdate, options = [] }) {
    const handleInputMapping = (key, value) => {
        const option = options.find(opt => opt.value === value);
        onUpdate({
            ...config,
            [key]: value,
            [key + '_label']: option?.label || value
        });
    };

    return (
        <div className="stack--tight">
            <div className="shelf--tight" style={{ gap: 'var(--space-2)' }}>
                <div className="stack--tight fill">
                    <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4, letterSpacing: '1px' }}>CLAVE_BUSQUEDA</span>
                    <MappingSelect
                        value={config.input_a}
                        options={options}
                        onChange={(val) => handleInputMapping('input_a', val)}
                        placeholder="VALOR BUSCADO..."
                    />
                </div>
                <div className="stack--tight fill">
                    <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4, letterSpacing: '1px' }}>TABLA_VALORES</span>
                    <MappingSelect
                        value={config.input_b}
                        options={options}
                        onChange={(val) => handleInputMapping('input_b', val)}
                        placeholder="LISTADO..."
                    />
                </div>
            </div>

            <div className="shelf--tight" style={{ marginTop: 'var(--space-2)', gap: 'var(--space-4)' }}>
                <div className="stack--tight fill">
                    <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4 }}>CAMPO_CLAVE (DB)</span>
                    <input 
                        className="input input--xs font-mono"
                        style={{ background: 'rgba(255,255,255,0.02)', fontSize: '10px' }}
                        value={config.search_field || ''}
                        onChange={(e) => onUpdate({ ...config, search_field: e.target.value })}
                        placeholder="ej: id_referencia"
                    />
                </div>
                <div className="stack--tight fill">
                    <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.4 }}>RETORNO (PROPIEDAD)</span>
                    <input 
                        className="input input--xs font-mono"
                        style={{ background: 'rgba(255,255,255,0.02)', fontSize: '10px' }}
                        value={config.return_field || ''}
                        onChange={(e) => onUpdate({ ...config, return_field: e.target.value })}
                        placeholder="ej: monto_fijo"
                    />
                </div>
            </div>
        </div>
    );
}
