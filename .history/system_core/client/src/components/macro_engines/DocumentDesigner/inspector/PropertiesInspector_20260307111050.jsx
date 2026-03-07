/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/RightPanel.jsx
 * RESPONSABILIDAD: Inspector paramétrico dinámico.
 * =============================================================================
 */

import { useSelection } from '../context/SelectionContext';
import { FrameBlock } from '../blocks/FrameBlock';
import { TextBlock } from '../blocks/TextBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { IteratorBlock } from '../blocks/IteratorBlock';

const BLOCK_COMPONENTS = {
    'FRAME': FrameBlock,
    'TEXT': TextBlock,
    'IMAGE': ImageBlock,
    'ITERATOR': IteratorBlock
};

const FieldRenderer = ({ field, value, onChange }) => {
    switch (field.type) {
        case 'text':
            return field.multiLine ? (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="util-input--sm"
                    style={{ minHeight: '60px', fontFamily: 'var(--font-mono)' }}
                />
            ) : (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="util-input--sm"
                />
            );
        case 'unit':
            return (
                <div className="shelf--tight">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="util-input--sm fill"
                    />
                    <span style={{ fontSize: '8px', opacity: 0.5 }}>{field.defaultUnit || 'px'}</span>
                </div>
            );
        case 'color':
            return (
                <div className="shelf--tight">
                    <input
                        type="color"
                        value={value?.startsWith('#') ? value : '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ width: '24px', height: '24px', border: 'none', background: 'none' }}
                    />
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="util-input--sm fill"
                        placeholder="#HEX..."
                    />
                </div>
            );
        case 'select':
            return (
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="util-input--sm"
                >
                    {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                </select>
            );
        case 'boolean':
            return (
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                />
            );
        default:
            return <span style={{ color: 'red', fontSize: '10px' }}>UNKNOWN_FIELD_TYPE: {field.type}</span>;
    }
};

export function PropertiesInspector() {
    const { blocks, findNode, updateNode, removeNode } = useAST();
    const { selectedId } = useSelection();

    const node = selectedId ? findNode(selectedId) : null;

    const onUpdate = (newData) => updateNode(selectedId, newData);
    const onRemove = () => removeNode(selectedId);

    if (!node) {
        return (
            <div className="center fill stack" style={{ padding: 'var(--space-8)', opacity: 0.2 }}>
                <IndraIcon name="ATOM" size="32px" />
                <div className="stack--tight center">
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>GLOBAL_PROPERTIES</span>
                    <span style={{ fontSize: '8px' }}>SELECT_BLOCK_TO_INSPECT</span>
                </div>
            </div>
        );
    }

    const Manifest = BLOCK_COMPONENTS[node.type]?.manifest;

    return (
        <aside style={{
            flex: 1,
            background: 'var(--color-bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <header className="spread" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="shelf--tight">
                    <IndraIcon name="SETTINGS" size="12px" style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{Manifest?.displayName || 'BLOCK_INSPECTOR'}</span>
                </div>
                <div className="badge badge--ghost" style={{ fontSize: '9px' }}>{node.type}</div>
            </header>

            <div className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-4)' }}>

                {Manifest?.sections.map((section, idx) => (
                    <div key={section.name || idx} className="stack--tight">
                        <span className="util-label">{section.name}</span>
                        <div className="stack--tight" style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--space-3)'
                        }}>
                            {section.fields.map(field => (
                                <div key={field.id} className="stack--tight">
                                    <label style={{ fontSize: '9px', opacity: 0.5 }}>{field.label}</label>
                                    <FieldRenderer
                                        field={field}
                                        value={node.props[field.id]}
                                        onChange={(newVal) => onUpdate({ props: { ...node.props, [field.id]: newVal } })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="fill" />

                <button
                    className="btn btn--xs btn--ghost"
                    style={{ color: 'var(--color-danger)', borderColor: 'rgba(255, 70, 85, 0.2)', marginTop: 'var(--space-4)' }}
                    onClick={() => { if (confirm('DELETE_BLOCK?')) onRemove(); }}
                >
                    <IndraIcon name="DELETE" size="10px" /> DELETE_BLOCK
                </button>
            </div>
        </aside>
    );
}

