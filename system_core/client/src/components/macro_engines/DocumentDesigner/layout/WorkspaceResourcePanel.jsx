/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/WorkspaceResourcePanel.jsx
 * RESPONSABILIDAD: Explorador de recursos del workspace para reclutamiento.
 * (ADR_018 §3.1.4 — Fase 3)
 *
 * Divide los recursos en 3 sub-tabs:
 * - SCHEMA: Schemas para insertar iteradores.
 * - SLOTS: Variables para insertar textos {{}}.
 * - OBJECTS: Silos y assets multimedia.
 * =============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { IndraLoadingBar } from './IndraLoadingBar';
import { useAppState } from '../../../../state/app_state';
import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { useDocumentHydration } from '../hooks/useDocumentHydration';
import { SchemaMicroExplorer } from '../../../utilities/SchemaMicroExplorer';
import { useShell } from '../../../../context/ShellContext';
import { SchemaActionService } from '../../../../services/SchemaActionService';
import { useAtomCatalog } from '../../../../hooks/useAtomCatalog';
import ArtifactSelector from '../../../utilities/ArtifactSelector';

const SHAPE_TEMPLATES = [
    {
        id: 'shape-rect',
        icon: 'FRAME',
        label: 'RECTANGULO',
        props: {
            kind: 'SHAPE',
            layoutMode: 'flow',
            direction: 'column',
            width: '140px',
            height: '90px',
            minHeight: '90px',
            padding: '0px',
            gap: '0px',
            background: 'var(--color-accent-dim)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            overflow: 'hidden'
        }
    },
    {
        id: 'shape-circle',
        icon: 'TARGET',
        label: 'CIRCULO',
        props: {
            kind: 'SHAPE',
            layoutMode: 'flow',
            direction: 'column',
            width: '110px',
            height: '110px',
            minHeight: '110px',
            padding: '0px',
            gap: '0px',
            background: 'var(--color-accent-dim)',
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            overflow: 'hidden'
        }
    },
    {
        id: 'shape-line',
        icon: 'LINE',
        label: 'LINEA',
        props: {
            kind: 'SHAPE',
            layoutMode: 'flow',
            direction: 'column',
            width: '180px',
            height: '2px',
            minHeight: '2px',
            padding: '0px',
            gap: '0px',
            background: 'var(--color-border)',
            border: 'none',
            borderRadius: '0px',
            overflow: 'hidden'
        }
    },
    {
        id: 'shape-pill',
        icon: 'LAYOUT',
        label: 'PILDORA',
        props: {
            kind: 'SHAPE',
            layoutMode: 'flow',
            direction: 'column',
            width: '180px',
            height: '48px',
            minHeight: '48px',
            padding: '0px',
            gap: '0px',
            background: 'var(--color-accent-dim)',
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            overflow: 'hidden'
        }
    }
];

const getAtomLabel = (atom) => {
    return atom?.handle?.label || atom?.label || atom?.handle?.alias || atom?.id || 'SIN_ETIQUETA';
};

const projectCompatibleMediaObject = (pin) => {
    const isMultimedia = ['MEDIA', 'FOLDER', 'SILO', 'IMAGE', 'VIDEO'].includes(pin.class);
    if (!isMultimedia) return null;

    return {
        ...pin,
        label: getAtomLabel(pin),
        insertProps: {
            kind: 'IMAGE',
            src: ''
        }
    };
};

export function WorkspaceResourcePanel({ atom, bridge, onNotify }) {
    const [subTab, setSubTab] = useState('SLOTS');
    const [showCosmos, setShowCosmos] = useState(false);
    const { pins } = useAppState();
    const { addNode, updateNode, findNode } = useAST();
    const { selectedId } = useSelection();
    const { openContextMenu } = useShell();
    const { slots, isLoading } = useDocumentHydration(atom, bridge);

    // ── Lógica de inserción (ADR_018 §A2) ───────────────────────────────────
    const insertResource = (type, props) => {
        let targetId = selectedId;
        // Si no hay seleccion o el target no es un contenedor, insertamos en root
        if (!targetId) targetId = 'root';
        
        const newId = addNode(type, targetId);
        if (props) {
            updateNode(newId, { props });
        }
        
        if (onNotify) onNotify(`INSERTED: ${type}`);
    };

    const copyToClipboard = (value, message) => {
        const content = String(value || '');
        if (!content) return;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(content);
        }
        if (onNotify) onNotify(message || `COPIED: ${content}`);
    };

    const appendToSelectedText = (value) => {
        if (!selectedId) return false;
        const node = findNode(selectedId);
        if (!node || node.type !== 'TEXT') return false;

        const current = node.props?.content || '';
        updateNode(selectedId, {
            props: {
                ...node.props,
                content: `${current}${value}`
            }
        });

        if (onNotify) onNotify('INSERTED_IN_SELECTED_TEXT');
        return true;
    };

    const insertTextContextual = (value) => {
        if (!appendToSelectedText(value)) {
            insertResource('TEXT', { content: value });
        }
    };

    const copyPlaceholder = (label) => {
        const tag = `{{${label}}}`;
        copyToClipboard(tag, `COPIED: ${tag}`);
    };

    const getObjectReference = (obj) => {
        if (obj?.insertProps?.asset_id) return `{{MEDIA:${obj.insertProps.asset_id}}}`;
        if (obj?.insertProps?.container_ref) return `{{MEDIA_CONTAINER:${obj.insertProps.container_ref}}}`;
        return `{{OBJECT:${obj.id}}}`;
    };

    const insertObjectContextual = (obj) => {
        const reference = getObjectReference(obj);
        const insertedInText = appendToSelectedText(reference);
        if (!insertedInText) {
            insertResource('IMAGE', obj.insertProps);
        }
    };

    const normalizeSchemaTokenPart = (value) => {
        return String(value || '')
            .trim()
            .replace(/\s+/g, ' ');
    };

    const getSchemaFieldRef = (schema, field) => {
        const schemaLabel = normalizeSchemaTokenPart(
            schema?.handle?.label || schema?.label || schema?.handle?.alias || schema?.id
        );
        const fieldLabel = normalizeSchemaTokenPart(
            field?.handle?.label || field?.label || field?.alias || field?.id
        );
        return `${schemaLabel}.${fieldLabel}`;
    };

    const insertSchemaFieldContextual = (schema, field) => {
        const ref = getSchemaFieldRef(schema, field);
        insertTextContextual(`{{${ref}}}`);
    };

    const copySchemaFieldPlaceholder = (schema, field) => {
        const ref = getSchemaFieldRef(schema, field);
        copyPlaceholder(ref);
    };

    const insertShape = (shapeProps) => {
        insertResource('FRAME', shapeProps);
    };

    const insertShapeAbsolute = (shapeProps) => {
        insertResource('FRAME', {
            ...shapeProps,
            layoutMode: 'absolute',
            top: shapeProps.top || '24px',
            left: shapeProps.left || '24px',
            right: '',
            bottom: '',
            zIndex: 3
        });
    };

    // ── Filtrado de artefactos del Workspace ────────────────────────────────
    const { 
        atoms: availableSchemas, 
        isLoading: isSchemasLoading,
        importAtom: handleImportSchema
    } = useAtomCatalog({ atomClass: 'DATA_SCHEMA' });

    const schemas = useMemo(() => {
        return (availableSchemas || []).map((schemaAtom) => ({
            ...schemaAtom,
            displayLabel: getAtomLabel(schemaAtom)
        }));
    }, [availableSchemas]);

    const objects = pins
        .map(projectCompatibleMediaObject)
        .filter(Boolean);

    return (
        <div className="workspace-resource-panel fill stack--none">
            
            {/* PANEL HEADER WITH COSMOS TRIGGER */}
            <div className="shelf--tight" style={{ 
                padding: '8px 12px', 
                borderBottom: '1px solid var(--color-border)', 
                justifyContent: 'space-between', 
                background: 'var(--color-bg-deep)' 
            }}>
                <div className="shelf--tight" style={{ opacity: 0.5 }}>
                    <IndraIcon name="VAULT" size="12px" />
                    <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold' }}>RECURSOS_SINCERADOS</span>
                </div>
                <button 
                    className="btn btn--xs btn--ghost resonance-glow-bridge" 
                    onClick={() => setShowCosmos(true)}
                    title="IMPORTAR_DEL_COSMOS"
                    style={{ 
                        border: '1px solid var(--color-border)', 
                        background: 'var(--color-bg-void)', 
                        borderRadius: '4px',
                        padding: '4px 8px',
                        display: 'flex',
                        gap: '6px',
                        height: '24px'
                    }}
                >
                    <IndraIcon name="LAYERS" size="10px" color="var(--color-accent)" />
                    <span style={{ fontSize: '8px', fontWeight: 'bold' }}>COSMOS</span>
                </button>
            </div>

            {/* SUB-TABS (Minimalist TabBar) */}
            <div className="sub-tab-bar">
                {['SCHEMA', 'SLOTS', 'OBJECTS', 'SHAPES'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setSubTab(t)}
                        className="sub-tab-btn"
                        data-active={subTab === t}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="panel-content fill stack--tight" style={{ overflowY: 'auto', padding: 'var(--space-2)' }}>
                {isLoading && (
                    <div className="center fill" style={{ padding: 'var(--space-10)' }}>
                        <IndraLoadingBar width="120px" height="4px" />
                    </div>
                )}

                {!isLoading && subTab === 'SCHEMA' && (
                    <div className="stack--tight">
                        {schemas.length === 0 && (
                            <div className="text-hint center stack--tight" style={{padding: '40px 20px'}}>
                                <IndraIcon name="SCHEMA" size="24px" style={{ opacity: 0.1, marginBottom: '8px' }} />
                                <div style={{ fontSize: '10px' }}>NO_HAY_CONTRATOS_VINCULADOS</div>
                                <button 
                                    className="btn btn--mini btn--ghost" 
                                    style={{ marginTop: '12px', color: 'var(--color-accent)' }}
                                    onClick={() => setShowCosmos(true)}
                                >
                                    IMPORTAR_DEL_COSMOS
                                </button>
                            </div>
                        )}
                        {schemas.map(s => (
                            <div key={s.id} className="stack--tight glass" style={{ padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                <div className="shelf--tight" style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-border)', opacity: 0.6 }}>
                                    <IndraIcon name="SCHEMA" size="10px" />
                                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{s.displayLabel}</span>
                                    <div className="fill" />
                                    <button 
                                        className="btn btn--xs btn--ghost" 
                                        onClick={() => insertResource('ITERATOR', { source: s.id })}
                                        title="INSERT_ITERATOR"
                                    >
                                        <IndraIcon name="PLUS" size="10px" color="var(--color-accent)" />
                                    </button>
                                </div>
                                <SchemaMicroExplorer 
                                    schema={s}
                                    onInsertField={(field) => insertSchemaFieldContextual(s, field)}
                                    onCopyField={(field) => copySchemaFieldPlaceholder(s, field)}
                                    // ...
                                />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && subTab === 'SLOTS' && (
                    <div className="stack--tight">
                        {slots.length === 0 && <div className="text-hint center" style={{padding: '20px'}}>NO_SLOTS_AVAILABLE</div>}
                        {slots.map(s => (
                            <ResourceRow 
                                key={s.id}
                                icon="LOGIC"
                                label={s.label}
                                sublabel={s.origin}
                                badge={s.type}
                                actions={[
                                    { icon: 'COPY', onClick: () => copyPlaceholder(s.label), title: 'COPY_PLACEHOLDER' },
                                    { icon: 'PLUS', onClick: () => insertTextContextual(`{{${s.label}}}`), title: 'INSERT_TEXT_NODE', color: 'var(--color-accent)' }
                                ]}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && subTab === 'OBJECTS' && (
                    <div className="stack--tight">
                        {objects.length === 0 && (
                             <div className="text-hint center stack--tight" style={{padding: '40px 20px'}}>
                                <IndraIcon name="VAULT" size="24px" style={{ opacity: 0.1, marginBottom: '8px' }} />
                                <div style={{ fontSize: '10px' }}>NO_HAY_RECURSOS_VINCULADOS</div>
                                <button 
                                    className="btn btn--mini btn--ghost" 
                                    style={{ marginTop: '12px', color: 'var(--color-accent)' }}
                                    onClick={() => setShowCosmos(true)}
                                >
                                    EXPLORAR_MULTIMEDIA
                                </button>
                            </div>
                        )}
                        <div className="objects-strip">
                            {objects.map(o => (
                                <ObjectCard
                                    key={o.id}
                                    icon={o.class === 'FOLDER' ? 'FOLDER' : 'VAULT'}
                                    label={o.label}
                                    onCopy={() => copyToClipboard(getObjectReference(o), 'COPIED_OBJECT_REFERENCE')}
                                    onInsert={() => insertObjectContextual(o)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && subTab === 'SHAPES' && (
                    <div className="stack--tight">
                        <div className="objects-strip">
                            {SHAPE_TEMPLATES.map((shape) => (
                                <ObjectCard
                                    key={shape.id}
                                    icon={shape.icon}
                                    label={shape.label}
                                    onCopy={() => copyToClipboard(JSON.stringify(shape.props), 'COPIED_SHAPE_TEMPLATE')}
                                    onInsert={() => insertResource('FRAME', shape.props)}
                                    onInsertAbsolute={() => insertShapeAbsolute(shape.props)}
                                    insertTitle="INSERT_SHAPE"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* UNIVERSAL COSMOS SELECTOR */}
            {showCosmos && (
                <ArtifactSelector 
                    title="EXPLORAR_RECURSOS_COSMICOS"
                    filter={{ class: subTab === 'SCHEMA' ? 'DATA_SCHEMA' : null }}
                    onCancel={() => setShowCosmos(false)}
                    onSelect={(item) => {
                        handleImportSchema(item);
                        setShowCosmos(false);
                        onNotify('IMPORTING_FROM_COSMOS');
                    }}
                />
            )}

            <style>{`
                .sub-tab-bar {
                    display: flex;
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-bg-deep);
                }
                .sub-tab-btn {
                    flex: 1;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--color-text-secondary);
                    font-size: 8px;
                    font-family: var(--font-mono);
                    padding: 8px 0;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.05em;
                }
                .sub-tab-btn:hover {
                    background: var(--color-bg-hover);
                    color: var(--color-text-primary);
                }
                .sub-tab-btn[data-active="true"] {
                    color: var(--color-accent);
                    border-bottom-color: var(--color-accent);
                    background: var(--color-accent-dim);
                }
                .objects-strip {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                }
            `}</style>
        </div>
    );
}

function ResourceRow({ icon, label, sublabel, badge, actions }) {
    return (
        <div className="resource-row shelf--tight glass-hover">
            <IndraIcon name={icon} size="10px" style={{ opacity: 0.5 }} />
            <div className="stack--none fill overflow-hidden">
                <div className="shelf--tight">
                    <span className="resource-row__label">{label}</span>
                    {badge && <span className="resource-row__badge">{badge}</span>}
                </div>
                {sublabel && <span className="resource-row__sublabel">{sublabel}</span>}
            </div>
            <div className="shelf--tight">
                {actions.map((a, i) => (
                    <button 
                        key={i}
                        className="btn btn--xs btn--ghost"
                        onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                        title={a.title}
                        style={{ border: 'none', padding: '4px', color: a.color || 'inherit' }}
                    >
                        <IndraIcon name={a.icon} size="10px" />
                    </button>
                ))}
            </div>

            <style>{`
                .resource-row {
                    padding: 6px 8px;
                    border-radius: var(--radius-sm);
                    cursor: default;
                    border: 1px solid transparent;
                    transition: all 0.1s;
                }
                .resource-row:hover {
                    border-color: var(--color-border);
                    background: var(--color-bg-hover);
                }
                .resource-row__label {
                    font-size: 10px;
                    font-family: var(--font-mono);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .resource-row__sublabel {
                    font-size: 7px;
                    opacity: 0.3;
                    font-family: var(--font-mono);
                }
                .resource-row__badge {
                    font-size: 7px;
                    padding: 0 4px;
                    border: 1px solid var(--color-border);
                    border-radius: 2px;
                    opacity: 0.5;
                }
            `}</style>
        </div>
    );
}

function ObjectCard({ icon, label, onCopy, onInsert, onInsertAbsolute, insertTitle = 'INSERT_IN_TEXT_OR_CANVAS' }) {
    return (
        <div
            className="glass stack--tight"
            style={{
                minWidth: '148px',
                maxWidth: '148px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px'
            }}
        >
            <div className="shelf--tight">
                <IndraIcon name={icon} size="14px" style={{ opacity: 0.75 }} />
                <span className="resource-row__label" style={{ fontSize: '9px' }}>{label}</span>
            </div>
            <div className="shelf--tight" style={{ justifyContent: 'flex-end' }}>
                <button
                    className="btn btn--xs btn--ghost"
                    onClick={(e) => { e.stopPropagation(); onCopy(); }}
                    title="COPY_REFERENCE"
                    style={{ border: 'none', padding: '5px' }}
                >
                    <IndraIcon name="COPY" size="12px" />
                </button>
                <button
                    className="btn btn--xs btn--ghost"
                    onClick={(e) => { e.stopPropagation(); onInsert(); }}
                    title={insertTitle}
                    style={{ border: 'none', padding: '5px', color: 'var(--color-accent)' }}
                >
                    <IndraIcon name="PLUS" size="12px" />
                </button>
                {onInsertAbsolute && (
                    <button
                        className="btn btn--xs btn--ghost"
                        onClick={(e) => { e.stopPropagation(); onInsertAbsolute(); }}
                        title="INSERT_SHAPE_ABSOLUTE"
                        style={{ border: 'none', padding: '5px', color: 'var(--color-accent)' }}
                    >
                        <IndraIcon name="MOVE" size="12px" />
                    </button>
                )}
            </div>
        </div>
    );
}
