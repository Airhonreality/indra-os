/**
 * =============================================================================
 * UTILIDAD: ColorPicker.jsx
 * RESPONSABILIDAD: Selector de color HSL agnóstico con presets del sistema.
 * =============================================================================
 */


const PRESETS = [
    { label: 'Void', value: 'var(--color-bg-void)' },
    { label: 'Accent', value: 'var(--color-accent)' },
    { label: 'Danger', value: 'var(--color-danger)' },
    { label: 'Text', value: 'var(--color-text)' },
    { label: 'White', value: '#ffffff' },
    { label: 'Glass', value: 'rgba(255,255,255,0.05)' }
];

export function ColorPicker({ label, value, onChange }) {
    return (
        <div className="stack--tight">
            <label style={{ fontSize: '9px', opacity: 0.5 }}>{label || 'COLOR'}</label>
            <div className="shelf--tight" style={{ flexWrap: 'wrap', gap: '4px' }}>
                {PRESETS.map(preset => (
                    <div
                        key={preset.value}
                        onClick={() => onChange(preset.value)}
                        title={preset.label}
                        style={{
                            width: '16px',
                            height: '16px',
                            background: preset.value.startsWith('var') ? preset.value : preset.value,
                            border: value === preset.value ? '2px solid white' : '1px solid var(--color-border)',
                            borderRadius: '2px',
                            cursor: 'pointer'
                        }}
                    />
                ))}
            </div>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="HEX / var(...)"
                className="util-input--sm"
                style={{ marginTop: '2px', height: '20px', fontSize: '9px' }}
            />
        </div>
    );
}
