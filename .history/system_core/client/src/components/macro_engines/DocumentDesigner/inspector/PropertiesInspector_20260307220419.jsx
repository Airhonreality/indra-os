/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/RightPanel.jsx
 * RESPONSABILIDAD: Inspector paramétrico dinámico.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { FrameBlock } from '../blocks/FrameBlock';
import { TextBlock } from '../blocks/TextBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { IteratorBlock } from '../blocks/IteratorBlock';
import ArtifactSelector from '../../utilities/ArtifactSelector';

const BLOCK_COMPONENTS = {
    'FRAME': FrameBlock,
    'TEXT': TextBlock,
    'IMAGE': ImageBlock,
    'ITERATOR': IteratorBlock
};

const FieldRenderer = ({ field, value, onChange }) => {
    const [showSelector, setShowSelector] = React.useState(false);

    switch (field.type) {
        case 'vault_artifact':
            return (
                <>
                    <div className="shelf--tight" style={{ width: '100%' }}>
                        <div className="util-input--sm fill shelf--tight" style={{ opacity: value ? 1 : 0.4 }}>
                            <IndraIcon name="VAULT" size="10px" />
                            <span style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {value || 'SELECT_FROM_VAULT...'}
                            </span>
                        </div>
                        <button className="btn btn--xs btn--accent" onClick={() => setShowSelector(true)} style={{ padding: '4px 8px' }}>
                            PICK
                        </button>
                    </div>
                    {showSelector && (
                        <ArtifactSelector
                            onSelect={(artifact) => {
                                // Buscamos si tiene un blob o URL de imagen
                                const src = artifact.payload?.url || artifact.payload?.src || artifact.id;
                                onChange(src);
                                setShowSelector(false);
                            }}
                            onCancel={() => setShowSelector(false)}
                            filter={field.filter || {}}
                        />
                    )}
                </>
            );
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

import { DataProjector } from '../../../../services/DataProjector';

const PAGE_PRESETS = {
    A4: { width: '210mm', height: '297mm', label: 'ISO A4' },
    LETTER: { width: '215.9mm', height: '279.4mm', label: 'US LETTER' },
    SQUARE: { width: '200mm', height: '200mm', label: 'SQUARE' }
};

export function PropertiesInspector() {
    const { blocks, findNode, updateNode, removeNode } = useAST();
    const { selectedId } = useSelection();

    const node = selectedId ? findNode(selectedId) : null;
    const projection = DataProjector.projectDocumentBlock(node);

    const onUpdate = (newData) => updateNode(selectedId, newData);
    const onRemove = () => removeNode(selectedId);

    const applyPreset = (presetKey) => {
        const preset = PAGE_PRESETS[presetKey];
        if (preset) {
            onUpdate({
                props: {
                    ...node.props,
                    width: preset.width,
                    minHeight: preset.height
                }
            });
        }
    };

    if (!node || !projection) {
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
                    <IndraIcon name={projection.icon} size="12px" style={{ color: projection.color || 'var(--color-accent)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{projection.label}</span>
                </div>
                <div className="badge badge--ghost" style={{ fontSize: '9px', borderColor: projection.color }}>{node.id.substring(0, 8)}</div>
            </header>

            <div className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-4)' }}>

                {node.id === 'root' && (
                    <div className="stack--tight" style={{ marginBottom: 'var(--space-6)' }}>
                        <span className="util-label">PAGE_FORMAT_PRESETS</span>
                        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                            {Object.keys(PAGE_PRESETS).map(key => (
                                <button
                                    key={key}
                                    className="btn btn--xs btn--ghost"
                                    style={{
                                        fontSize: '9px',
                                        background: node.props.width === PAGE_PRESETS[key].width ? 'var(--color-accent-dim)' : 'transparent',
                                        color: node.props.width === PAGE_PRESETS[key].width ? 'var(--color-accent)' : 'inherit'
                                    }}
                                    onClick={() => applyPreset(key)}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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

