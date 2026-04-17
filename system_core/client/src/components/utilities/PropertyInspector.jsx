/**
 * =============================================================================
 * UTILIDAD: PropertyInspector.jsx
 * RESPONSABILIDAD: Inspector genérico de propiedades clave:valor.
 *
 * Componente universal para mostrar/editar propiedades de cualquier entidad.
 * Es distinto del DNAInspector del SchemaDesigner (que es específico de campos).
 *
 * DHARMA:
 *   - Agnosticismo: No sabe qué tipo de entidad está inspeccionando.
 *   - Sinceridad Estructural: Solo proyecta propiedades que recibe.
 *
 * PROPS:
 *   properties  — Array<{ key, label, value, type, onChange?, readOnly? }>
 *                 type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'readonly'
 *   title       — string: título del panel. Default: 'INSPECTOR'
 *   icon        — string: ícono del panel. Default: 'SETTINGS'
 *
 * USO:
 *   <PropertyInspector
 *       title="NODE_PROPERTIES"
 *       icon="LOGIC"
 *       properties={[
 *           { key: 'name', label: 'Nombre', value: node.name, type: 'text', onChange: v => update('name', v) },
 *           { key: 'type', label: 'Tipo', value: node.type, type: 'readonly' },
 *       ]}
 *   />
 * =============================================================================
 */
import { IndraMicroHeader } from './IndraMicroHeader';

const INPUT_BASE = {
    background: 'var(--color-bg-void)',
    border: '1px solid var(--color-border)',
    borderRadius: '3px',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    padding: '4px 8px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s ease',
};

function PropertyRow({ prop }) {
    const { key, label, value, type = 'text', onChange, readOnly } = prop;
    const isReadOnly = readOnly || type === 'readonly' || !onChange;

    const renderControl = () => {
        if (isReadOnly) {
            return (
                <span style={{
                    ...INPUT_BASE,
                    display: 'inline-block',
                    opacity: 0.5,
                    cursor: 'default',
                    border: '1px solid transparent',
                    padding: '4px 8px',
                }}>
                    {String(value ?? '—')}
                </span>
            );
        }

        if (type === 'boolean') {
            return (
                <button
                    onClick={() => onChange(!value)}
                    style={{
                        ...INPUT_BASE,
                        width: 'auto',
                        background: value ? 'rgba(var(--color-accent-rgb), 0.15)' : 'var(--color-bg-void)',
                        borderColor: value ? 'var(--color-accent)' : 'var(--color-border)',
                        color: value ? 'var(--color-accent)' : 'var(--color-text-dim)',
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                    }}
                >
                    {value ? 'TRUE' : 'FALSE'}
                </button>
            );
        }

        if (type === 'number') {
            return (
                <input
                    type="number"
                    value={value ?? ''}
                    onChange={e => onChange(Number(e.target.value))}
                    style={{ ...INPUT_BASE }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
            );
        }

        return (
            <input
                type="text"
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                style={{ ...INPUT_BASE }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
        );
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            padding: 'var(--space-2) 0',
            borderBottom: '1px solid var(--color-border)',
        }}>
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-dim)',
                opacity: 0.6,
            }}>
                {label || key}
            </span>
            {renderControl()}
        </div>
    );
}

export function PropertyInspector({ properties = [], title = 'INSPECTOR', icon = 'SETTINGS' }) {
    return (
        <aside style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
        }}>
            <IndraMicroHeader title={title} icon={icon} />
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
            }}>
                {properties.length === 0 ? (
                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        opacity: 0.3,
                        padding: 'var(--space-4) 0',
                    }}>
                        NO_PROPERTIES
                    </span>
                ) : (
                    properties.map(prop => (
                        <PropertyRow key={prop.key} prop={prop} />
                    ))
                )}
            </div>
        </aside>
    );
}
