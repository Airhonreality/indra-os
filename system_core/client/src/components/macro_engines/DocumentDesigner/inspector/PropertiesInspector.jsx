/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/inspector/PropertiesInspector.jsx
 * RESPONSABILIDAD: Renderizado de propiedades de la entidad seleccionada.
 *
 * REFACTOR (QUALITY_CONTROL):
 * - Implementa ScrubbableInput para campos numéricos/unit.
 * - Soporta multi-columna (vía EntityInspectorSection).
 * =============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { blockManifests } from './inspectorManifests';
import { EntityInspectorSection } from './EntityInspectorSection';
import { IndraIcon } from '../../../utilities/IndraIcons';

const PAGE_PRESETS = {
    A4: { width: '210mm', height: '297mm' },
    LETTER: { width: '215.9mm', height: '279.4mm' },
    SQUARE: { width: '200mm', height: '200mm' }
};

const resolvePageDimensions = (preset, orientation) => {
    const base = PAGE_PRESETS[preset] || PAGE_PRESETS.A4;
    if (orientation === 'landscape') {
        return { width: base.height, minHeight: base.width };
    }
    return { width: base.width, minHeight: base.height };
};

const parseUnitValue = (value) => {
    if (typeof value !== 'string') return null;
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)([a-zA-Z%]*)$/);
    if (!match) return null;
    return {
        numeric: Number.parseFloat(match[1]),
        unit: match[2] || ''
    };
};

const snapUnitToGrid = (value, gridSize) => {
    const parsed = parseUnitValue(value);
    if (!parsed || !Number.isFinite(parsed.numeric)) return value;
    const step = Math.max(1, Number.parseFloat(gridSize) || 1);
    const snapped = Math.round(parsed.numeric / step) * step;
    return `${snapped}${parsed.unit}`;
};

export function PropertiesInspector() {
    const { findNode, updateNode, duplicateNode, removeNode, docVariables, layoutMeta, updateLayoutMeta } = useAST();
    const { selectedId } = useSelection();

    const selectedNode = selectedId ? findNode(selectedId) : null;
    const blockManifest = selectedNode ? blockManifests[selectedNode.type] : null;

    if (!selectedNode) {
        const canvasFields = [
            { id: 'zoom', label: 'ZOOM', type: 'unit', icon: 'EXPAND', compact: true, defaultUnit: '' },
            { id: 'unit', label: 'UNIT', type: 'select', icon: 'ALIGN', options: ['mm', 'pt', 'px'], compact: true },
            { id: 'mediaPreset', label: 'MEDIA', type: 'select', icon: 'LAYOUT', options: ['PRINT', 'SCREEN', 'PRESENTATION'], compact: true },
            { id: 'gridSize', label: 'GRID', type: 'unit', icon: 'GAP', compact: true, defaultUnit: '' },
            { id: 'showRulers', label: 'RULERS', type: 'boolean', icon: 'TARGET', compact: true },
            { id: 'showGuides', label: 'GUIDES', type: 'boolean', icon: 'TARGET', compact: true },
            { id: 'showGrid', label: 'GRID_ON', type: 'boolean', icon: 'TARGET', compact: true },
            { id: 'snapToGrid', label: 'SNAP', type: 'boolean', icon: 'TARGET', compact: true }
        ];
        const paginationFields = [
            { id: 'mode', label: 'MODE', type: 'select', icon: 'REPEATER', options: ['hybrid', 'auto', 'manual'], compact: true },
            { id: 'startAt', label: 'START', type: 'unit', icon: 'TEXT_SIZE', compact: true, defaultUnit: '' },
            { id: 'showNumbers', label: 'NUMBERS', type: 'boolean', icon: 'TEXT', compact: true },
            { id: 'autoFlow', label: 'AUTO_FLOW', type: 'boolean', icon: 'TARGET', compact: true }
        ];
        const masterFields = [
            { id: 'mode', label: 'MODE', type: 'select', icon: 'LAYOUT', options: ['global', 'mixed', 'per-page'], compact: true },
            { id: 'headerEnabled', label: 'HEADER_ON', type: 'boolean', icon: 'TEXT', compact: true },
            { id: 'footerEnabled', label: 'FOOTER_ON', type: 'boolean', icon: 'TEXT', compact: true },
            { id: 'allowPerPageOverride', label: 'OVERRIDE', type: 'boolean', icon: 'LINK', compact: true },
            { id: 'headerTemplate', label: 'HEADER_TXT', type: 'text', icon: 'TEXT', compact: false },
            { id: 'footerTemplate', label: 'FOOTER_TXT', type: 'text', icon: 'TEXT', compact: false }
        ];

        const canvasValues = layoutMeta?.canvas || {};
        const paginationValues = layoutMeta?.pagination || {};
        const masterValues = layoutMeta?.masters || {};

        return (
            <div className="properties-inspector fill stack overflow-hidden">
                <header className="inspector-header shelf--tight" style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-bg-surface)',
                    flexShrink: 0
                }}>
                    <IndraIcon name="TARGET" size="10px" color="var(--color-accent)" />
                    <div className="stack--none fill">
                        <span style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                            CANVAS_ENGINE
                        </span>
                    </div>
                </header>

                <main className="fill overflow-y-auto">
                    <EntityInspectorSection
                        sectionId="CANVAS_GLOBAL"
                        name="CANVAS_TECHNICAL"
                        fields={canvasFields}
                        renderField={(field) => (
                            <FieldRenderer
                                field={field}
                                value={canvasValues[field.id]}
                                onChange={(val) => updateLayoutMeta({
                                    canvas: {
                                        [field.id]: field.id === 'zoom' || field.id === 'gridSize'
                                            ? Number.parseFloat(val) || 0
                                            : val
                                    }
                                })}
                            />
                        )}
                    />

                    <EntityInspectorSection
                        sectionId="PAGINATION_GLOBAL"
                        name="PAGINATION_GLOBAL"
                        fields={paginationFields}
                        renderField={(field) => (
                            <FieldRenderer
                                field={field}
                                value={paginationValues[field.id]}
                                onChange={(val) => updateLayoutMeta({
                                    pagination: {
                                        [field.id]: field.id === 'startAt'
                                            ? Math.max(1, Number.parseInt(val, 10) || 1)
                                            : val
                                    }
                                })}
                            />
                        )}
                    />

                    <EntityInspectorSection
                        sectionId="MASTERS_GLOBAL"
                        name="MASTERS_GLOBAL"
                        fields={masterFields}
                        renderField={(field) => (
                            <FieldRenderer
                                field={field}
                                value={masterValues[field.id]}
                                onChange={(val) => updateLayoutMeta({
                                    masters: {
                                        [field.id]: val
                                    }
                                })}
                            />
                        )}
                    />
                </main>
            </div>
        );
    }

    const isRoot = selectedNode.id === 'root' || selectedNode.type === 'PAGE';
    const shouldSnapUnits = layoutMeta?.canvas?.snapToGrid === true;
    const gridSize = layoutMeta?.canvas?.gridSize || 1;

    const handleUpdateField = (id, value) => {
        let nextProps = { ...selectedNode.props, [id]: value };

        // Parametrización determinista de formato de página.
        if (selectedNode.type === 'PAGE') {
            if (id === 'preset' || id === 'orientation') {
                const nextPreset = id === 'preset' ? value : (nextProps.preset || 'A4');
                const nextOrientation = id === 'orientation' ? value : (nextProps.orientation || 'portrait');

                if (nextPreset !== 'CUSTOM') {
                    const dims = resolvePageDimensions(nextPreset, nextOrientation);
                    nextProps = {
                        ...nextProps,
                        width: dims.width,
                        minHeight: dims.minHeight
                    };
                }
            }

            if (id === 'width' || id === 'minHeight') {
                nextProps = {
                    ...nextProps,
                    preset: 'CUSTOM'
                };
            }
        }

        updateNode(selectedId, {
            props: nextProps
        });
    };

    // Función para resolver el valor real (Axioma de Resonancia)
    const resolveValue = (val) => {
        if (typeof val === 'string' && val.startsWith('@var:')) {
            const [_, category, path] = val.split(':');
            if (category === 'typography') {
                const [preset, param] = path.split('.');
                return docVariables.typography[preset]?.[param];
            }
            if (category === 'colors') {
                return docVariables.colors.find(c => c.id === path)?.value;
            }
            if (category === 'spacing') {
                return docVariables.spacing[path];
            }
        }
        return val;
    };

    return (
        <div className="properties-inspector fill stack overflow-hidden">
            <header className="inspector-header shelf--tight" style={{ 
                padding: '6px 8px', 
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-surface)',
                flexShrink: 0
            }}>
                <IndraIcon name={blockManifest?.icon || 'ATOM'} size="10px" color="var(--color-accent)" />
                <div className="stack--none fill">
                    <div className="shelf--tight">
                        <span style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                            {selectedNode.type}_ENGINE
                        </span>
                        <span style={{ fontSize: '7px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>#{selectedNode.id}</span>
                    </div>
                </div>
                
                <div className="shelf--tight">
                    <button 
                        className="btn btn--xs btn--ghost" 
                        onClick={() => duplicateNode(selectedId)}
                        title="DUPLICATE"
                        style={{ padding: '4px' }}
                    >
                        <IndraIcon name="COPY" size="10px" />
                    </button>
                    {!isRoot && (
                        <button 
                            className="btn btn--xs btn--ghost color-error" 
                            onMouseDown={() => {
                                const timer = setTimeout(() => removeNode(selectedId), 800);
                                window.addEventListener('mouseup', () => clearTimeout(timer), { once: true });
                            }}
                            title="HOLD_TO_DELETE"
                            style={{ padding: '4px' }}
                        >
                            <IndraIcon name="TRASH" size="10px" />
                        </button>
                    )}
                </div>
            </header>

            <main className="fill overflow-y-auto">
                {blockManifest?.sections.map(section => (
                    <EntityInspectorSection 
                        key={section.id}
                        sectionId={section.id}
                        name={section.name}
                        fields={section.fields}
                        values={selectedNode.props}
                        onChange={handleUpdateField}
                        renderField={(field) => {
                            const rawValue = selectedNode.props[field.id];
                            const isLinked = typeof rawValue === 'string' && rawValue.startsWith('@var:');
                            const resolvedValue = resolveValue(rawValue);

                            return (
                                <div className="shelf--tight fill">
                                    <div className="fill stack--none">
                                        <FieldRenderer 
                                            field={field} 
                                            value={resolvedValue} 
                                            isLinked={isLinked}
                                            onChange={(val) => {
                                                const snappedValue = field.type === 'unit' && shouldSnapUnits
                                                    ? snapUnitToGrid(val, gridSize)
                                                    : val;
                                                handleUpdateField(field.id, snappedValue);
                                            }} 
                                        />
                                    </div>
                                    <button 
                                        className={`btn btn--xs ${isLinked ? 'btn--accent' : 'btn--ghost'}`}
                                        style={{ padding: '2px', opacity: isLinked ? 1 : 0.2 }}
                                        onClick={() => {
                                            if (isLinked) {
                                                // Desvincular: copiar valor resuelto a local
                                                handleUpdateField(field.id, resolvedValue);
                                            } else {
                                                // Vincular (Lógica automática por tipo de campo)
                                                if (field.id === 'color') handleUpdateField(field.id, '@var:colors.var_col_1');
                                                if (field.id === 'fontSize') handleUpdateField(field.id, `@var:typography.${selectedNode.props.textPreset || 'paragraph'}.fontSize`);
                                                // etc...
                                            }
                                        }}
                                        title={isLinked ? 'UNLINK_FROM_GLOBAL' : 'LINK_TO_DESIGN_SYSTEM'}
                                    >
                                        <IndraIcon name="LINK" size="8px" />
                                    </button>
                                </div>
                            );
                        }}
                    />
                ))}
            </main>
        </div>
    );
}

function FieldRenderer({ field, value, onChange }) {
    switch (field.type) {
        case 'text':
            return (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="inspector-field__input"
                    rows={2}
                    style={{ minHeight: '40px', resize: 'vertical', lineHeight: '1.4' }}
                />
            );

        case 'unit':
            return <ScrubbableUnitInput value={value} onChange={onChange} defaultUnit={field.defaultUnit} />;

        case 'color':
            return (
                <div className="inspector-field__color-wrapper">
                    <div 
                        className="inspector-field__color-swatch" 
                        style={{ backgroundColor: value?.startsWith('#') ? value : 'transparent', border: !value ? '1px dashed var(--color-border)' : 'none' }}
                        onClick={(e) => e.currentTarget.nextSibling.click()}
                    />
                    <input
                        type="color"
                        value={value?.startsWith('#') ? value : '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="util-hidden"
                    />
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="inspector-field__input fill"
                        placeholder="#HEX"
                        style={{ lineHeight: '1.4' }}
                    />
                </div>
            );

        case 'select':
            return (
                <select
                    value={value || (field.options?.[0] || '')}
                    onChange={(e) => onChange(e.target.value)}
                    className="inspector-field__input"
                    style={{ lineHeight: '1.4' }}
                >
                    {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                </select>
            );

        case 'boolean':
            return (
                <button
                    type="button"
                    className={`inspector-field__input ${value ? 'is-boolean-on' : ''}`}
                    onClick={() => onChange(!value)}
                    style={{
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: value ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                    }}
                >
                    {value ? 'ON' : 'OFF'}
                </button>
            );

        default:
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="inspector-field__input"
                    style={{ lineHeight: '1.4' }}
                />
            );
    }
}

/**
 * ScrubbableUnitInput: Permite arrastrar sobre el campo para cambiar el valor numérico.
 */
function ScrubbableUnitInput({ value, onChange, defaultUnit = '' }) {
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startValue = useRef(0);
    const unitRef = useRef('');

    // Extraer número y unidad del valor (ej. "18px" -> [18, "px"])
    const parseValue = useCallback((val) => {
        if (!val) return [0, defaultUnit || 'px'];
        const num = parseFloat(val);
        const unit = String(val).replace(String(num), '').trim();
        return [isNaN(num) ? 0 : num, unit || defaultUnit || 'px'];
    }, [defaultUnit]);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        startX.current = e.clientX;
        const [num, unit] = parseValue(value);
        startValue.current = num;
        unitRef.current = unit;
        
        document.body.style.cursor = 'ew-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const delta = e.clientX - startX.current;
        const sensitivity = e.shiftKey ? 10 : 1; // Shift para incremento rápido
        const newValue = Math.round(startValue.current + (delta / sensitivity));
        onChange(`${newValue}${unitRef.current}`);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="inspector-field__unit-wrapper" onMouseDown={(e) => {
            // Solo activar scrub si el click es en el label lateral o cerca del borde
            // Pero para máxima ergonomía, lo permitimos en todo el wrapper menos el input enfocado
            handleMouseDown(e);
        }}>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()} // Permitir edit de texto normal
                className="inspector-field__input"
            />
            {defaultUnit && (
                <span className="inspector-field__unit-label">
                    {defaultUnit}
                </span>
            )}
        </div>
    );
}
