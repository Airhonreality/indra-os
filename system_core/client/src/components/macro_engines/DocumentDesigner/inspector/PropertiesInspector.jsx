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

export function PropertiesInspector() {
    const { findNode, updateNode, duplicateNode, removeNode } = useAST();
    const { selectedId } = useSelection();

    const selectedNode = selectedId ? findNode(selectedId) : null;
    const blockManifest = selectedNode ? blockManifests[selectedNode.type] : null;

    if (!selectedNode) {
        return (
            <div className="center fill stack--tight text-hint" style={{ opacity: 0.3, padding: '40px' }}>
                <IndraIcon name="TARGET" size="32px" />
                <span className="font-mono" style={{ fontSize: '9px' }}>SELECT_ENTITY_TO_INSPECT</span>
            </div>
        );
    }

    const isRoot = selectedNode.id === 'root' || selectedNode.type === 'PAGE';

    const handleUpdateField = (id, value) => {
        updateNode(selectedId, {
            props: { ...selectedNode.props, [id]: value }
        });
    };

    return (
        <div className="properties-inspector fill stack--none overflow-hidden">
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
                        section={section}
                        fields={section.fields}
                        values={selectedNode.props}
                        onChange={handleUpdateField}
                        renderField={(field) => (
                            <FieldRenderer 
                                field={field} 
                                value={selectedNode.props[field.id]} 
                                onChange={(val) => handleUpdateField(field.id, val)} 
                            />
                        )}
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
