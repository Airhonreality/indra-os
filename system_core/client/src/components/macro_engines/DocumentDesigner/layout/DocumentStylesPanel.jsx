/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/DocumentStylesPanel.jsx
 * RESPONSABILIDAD: Gestión de variables globales de diseño del documento 2D.
 * (Axioma: Doble de variable para cada parámetro).
 * =============================================================================
 */

import { useAST } from '../context/ASTContext';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { EntityInspectorSection } from '../inspector/EntityInspectorSection';

export function DocumentStylesPanel() {
    const { docVariables, updateVariable } = useAST();

    if (!docVariables) return null;

    return (
        <div className="styles-panel stack--none fill overflow-y-auto">
            <header className="navigator-header">
                <IndraIcon name="PALETTE" size="10px" />
                <span>DOCUMENT_DESIGN_SYSTEM</span>
            </header>

            {/* ── 1. PALETA DE COLORES DEL DOCUMENTO ── */}
            <EntityInspectorSection 
                sectionId="global_colors" 
                name="DOCUMENT_COLOR_GENOME" 
                defaultOpen={true}
                fields={docVariables.colors}
                renderField={(color) => (
                    <div className="shelf--tight fill inspector-field-row" style={{ padding: '4px', background: 'var(--color-bg-surface)', borderRadius: '4px', marginBottom: '2px' }}>
                        <div style={{ position: 'relative', width: '28px', height: '18px' }}>
                            <input 
                                type="color" 
                                value={color.value} 
                                onChange={(e) => updateVariable('colors', color.id, e.target.value)}
                                style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                    opacity: 0, cursor: 'pointer', zIndex: 2 
                                }}
                            />
                            <div style={{ 
                                width: '100%', height: '100%', background: color.value, 
                                borderRadius: '2px', border: '1px solid var(--color-border-strong)' 
                            }} />
                        </div>
                        <span className="font-mono" style={{ fontSize: '8px', opacity: 0.4, minWidth: '40px' }}>{color.id}</span>
                        <input 
                            type="text" 
                            value={color.name} 
                            onChange={(e) => {
                                // En una fase futura aquí actualizamos el nombre del token en el diccionario
                            }}
                            className="inspector-field__input fill"
                            style={{ fontSize: '9px', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                            placeholder="COLOR_ALIAS..."
                        />
                        <span className="font-mono" style={{ fontSize: '8px', opacity: 0.5 }}>{color.value.toUpperCase()}</span>
                    </div>
                )}
            />

            {/* ── 2. TIPOGRAFÍAS (PRESETS H1-H7 / SYSTEM) ── */}
            <header className="navigator-header" style={{ marginTop: 'var(--space-4)' }}>
                <IndraIcon name="TEXT_SIZE" size="10px" />
                <span>TYPOGRAPHIC_CONSTITUTION</span>
            </header>
            
            <div className="stack--none" style={{ gap: '1px' }}>
                {Object.entries(docVariables.typography).map(([preset, values]) => (
                    <EntityInspectorSection 
                        key={preset}
                        sectionId={`type_${preset}`} 
                        name={`${preset.toUpperCase()}_RULES`} 
                        defaultOpen={false}
                        fields={[
                            { id: 'fontSize', label: 'SIZE', type: 'unit', icon: 'TEXT_SIZE', compact: true },
                            { id: 'lineHeight', label: 'LEADING', type: 'unit', icon: 'L_HEIGHT', compact: true },
                            { id: 'letterSpacing', label: 'TRACKING', type: 'unit', icon: 'L_SPACING', compact: true },
                            { id: 'fontWeight', label: 'WGHT', type: 'select', options: ['100','200','300','400','500', '600','700','900'], compact: true },
                            { id: 'fontFamily', label: 'FAMILY', type: 'text', icon: 'TEXT', compact: false }
                        ]}
                        renderField={(field) => (
                            <div className="shelf--tight fill">
                                <span style={{ fontSize: '7px', width: '30px', opacity: 0.4 }}>{field.label}</span>
                                <input 
                                    className="inspector-field__input fill"
                                    value={values[field.id]}
                                    onChange={(e) => updateVariable('typography', `${preset}.${field.id}`, e.target.value)}
                                    style={{ fontSize: '9px', padding: '2px 4px' }}
                                />
                            </div>
                        )}
                    />
                ))}
            </div>

            {/* ── 3. ESPACIADO GLOBAL ── */}
            <EntityInspectorSection 
                sectionId="global_spacing" 
                name="GLOBAL_GEOMETRY" 
                defaultOpen={false}
                fields={Object.keys(docVariables.spacing).map(k => ({ id: k, label: k.toUpperCase(), icon: 'SPACING' }))}
                renderField={(field) => (
                    <input 
                        className="inspector-field__input"
                        value={docVariables.spacing[field.id]}
                        onChange={(e) => updateVariable('spacing', field.id, e.target.value)}
                    />
                )}
            />

            <style>{`
                .styles-panel {
                    padding: var(--space-2);
                    background: var(--color-bg-deep-trans);
                }
            `}</style>
        </div>
    );
}
