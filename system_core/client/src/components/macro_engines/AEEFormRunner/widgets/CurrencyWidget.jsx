import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * CurrencyWidget: Entrada numérica especializada para importes económicos.
 */
export function CurrencyWidget({ field, value, onChange, disabled }) {
    const config = field.config || {};
    const symbol = config.symbol || '€';
    
    const handleChange = (e) => {
        const val = e.target.value === '' ? null : Number(e.target.value);
        onChange(field.alias, val);
    };

    return (
        <div className="form-item stack--tight">
            <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>
            
            <div className="input-wrapper shelf--tight" style={{ position: 'relative' }}>
                <span style={{ 
                    position: 'absolute', 
                    left: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    opacity: 0.4,
                    fontFamily: 'var(--font-mono)'
                }}>
                    {symbol}
                </span>

                <input
                    className="input-base"
                    type="number"
                    step={config.step || "0.01"}
                    placeholder="0.00"
                    value={value || ''}
                    onChange={handleChange}
                    disabled={disabled}
                    style={{ 
                        width: '100%',
                        paddingLeft: '28px',
                        textAlign: 'right',
                        fontWeight: '600'
                    }}
                />
            </div>
        </div>
    );
}
