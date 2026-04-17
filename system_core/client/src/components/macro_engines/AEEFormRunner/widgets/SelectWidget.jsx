import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * SelectWidget: Maneja opciones estáticas y selecciones de relación.
 */
export function SelectWidget({ field, value, onChange, disabled }) {
    const config = field.config || {};
    const options = config.options || [];

    const handleChange = (e) => {
        onChange(field.alias, e.target.value);
    };

    return (
        <div className="form-item stack--tight">
            <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>
            
            <div className="input-wrapper shelf--tight" style={{ position: 'relative' }}>
                <select
                    className="input-base"
                    value={value || ''}
                    onChange={handleChange}
                    disabled={disabled}
                    style={{ 
                        width: '100%',
                        paddingRight: '32px' 
                    }}
                >
                    <option value="">...</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label.toUpperCase()}
                        </option>
                    ))}
                </select>
                
                <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    opacity: 0.3 
                }}>
                    <IndraIcon name="CHEVRON_RIGHT" size="10px" style={{ transform: 'rotate(90deg)' }} />
                </div>
            </div>
        </div>
    );
}
