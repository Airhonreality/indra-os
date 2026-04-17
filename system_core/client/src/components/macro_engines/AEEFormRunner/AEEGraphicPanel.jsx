import { IndraIcon } from '../../utilities/IndraIcons';

// Subcomponente simplificado de EntityInspectorSection para no depender del DocumentDesigner
function GraphicSection({ name, icon, defaultOpen, children }) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    return (
        <div style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div 
                className="shelf--tight glass-hover" 
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', padding: '6px 4px', borderRadius: '4px' }}
            >
                <div style={{ 
                    transform: isOpen ? 'rotate(90deg)' : 'none', 
                    transition: 'transform 0.2s', 
                    display: 'flex', 
                    opacity: 0.5 
                }}>
                    <IndraIcon name="CHEVRON_RIGHT" size="8px" />
                </div>
                <IndraIcon name={icon || 'PALETTE'} size="10px" style={{ opacity: 0.6 }} />
                <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold' }}>{name}</span>
            </div>
            {isOpen && (
                <div className="stack--tight" style={{ padding: '8px 4px', paddingLeft: '16px' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

export function AEEGraphicPanel({ config, onChange }) {
    // defaults
    const graphics = config?.graphics || {
        colors: {
            bg_surface: '#ffffff',
            primary: '#00f5d4',
            text: '#1a1a1a'
        },
        typography: {
            fontFamily: 'Inter',
            radius: '8px'
        }
    };

    const updateGraphics = (category, key, value) => {
        onChange?.({
            ...config,
            graphics: {
                ...graphics,
                [category]: {
                    ...graphics[category],
                    [key]: value
                }
            }
        });
    };

    return (
        <div className="stack--tight">
            {/* COLORS */}
            <GraphicSection name="GLOBAL_COLORS" icon="PALETTE" defaultOpen={true}>
                {[
                    { id: 'bg_surface', label: 'FONDO' },
                    { id: 'primary', label: 'ACENTO/BOTÓN' },
                    { id: 'text', label: 'TINTA_PRIMARIA' }
                ].map((color) => (
                    <div key={color.id} className="shelf--tight fill" style={{ padding: '4px', background: 'var(--color-bg-base)', borderRadius: '4px', marginBottom: '2px' }}>
                        <div style={{ position: 'relative', width: '28px', height: '18px' }}>
                            <input 
                                type="color" 
                                value={graphics.colors[color.id] || '#000000'} 
                                onChange={(e) => updateGraphics('colors', color.id, e.target.value)}
                                style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                    opacity: 0, cursor: 'pointer', zIndex: 2 
                                }}
                            />
                            <div style={{ 
                                width: '100%', height: '100%', background: graphics.colors[color.id] || '#000000', 
                                borderRadius: '2px', border: '1px solid var(--color-border-strong)' 
                            }} />
                        </div>
                        <span className="font-mono" style={{ fontSize: '9px', marginLeft: '6px', flex: 1, fontWeight: 'bold' }}>
                            {color.label}
                        </span>
                        <span className="font-mono" style={{ fontSize: '8px', opacity: 0.5 }}>
                            {(graphics.colors[color.id] || '#000000').toUpperCase()}
                        </span>
                    </div>
                ))}
            </GraphicSection>

            {/* TYPOGRAPHY & GEOMETRY */}
            <GraphicSection name="TYPOGRAPHY_&_GEOMETRY" icon="TEXT_SIZE" defaultOpen={true}>
                <div className="shelf--tight fill">
                    <span style={{ fontSize: '8px', width: '40px', opacity: 0.5 }} className="font-mono">FUENTE</span>
                    <select 
                        className="input-base font-mono fill"
                        value={graphics.typography.fontFamily || 'Inter'}
                        onChange={(e) => updateGraphics('typography', 'fontFamily', e.target.value)}
                        style={{ fontSize: '9px', padding: '4px' }}
                    >
                        <option value="Inter">Inter (Sans)</option>
                        <option value="Roboto">Roboto (Sans)</option>
                        <option value="Outfit">Outfit (Display)</option>
                        <option value="Courier New">Courier New (Mono)</option>
                        <option value="Georgia">Georgia (Serif)</option>
                    </select>
                </div>
                <div className="shelf--tight fill" style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '8px', width: '40px', opacity: 0.5 }} className="font-mono">RADIO</span>
                    <input 
                        className="input-base font-mono fill"
                        value={graphics.typography.radius || '8px'}
                        onChange={(e) => updateGraphics('typography', 'radius', e.target.value)}
                        style={{ fontSize: '9px', padding: '4px' }}
                    />
                </div>
            </GraphicSection>
        </div>
    );
}
