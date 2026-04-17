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

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { blockManifests } from './inspectorManifests';
import { EntityInspectorSection } from './EntityInspectorSection';
import { IndraIcon } from '../../../utilities/IndraIcons';

const OPEN_SOURCE_FONTS = [
    { value: 'Inter', label: 'Inter', google: 'Inter:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Roboto', label: 'Roboto', google: 'Roboto:wght@100;300;400;500;700;900' },
    { value: 'Open Sans', label: 'Open Sans', google: 'Open+Sans:wght@300;400;500;600;700;800' },
    { value: 'Lato', label: 'Lato', google: 'Lato:wght@100;300;400;700;900' },
    { value: 'Montserrat', label: 'Montserrat', google: 'Montserrat:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Poppins', label: 'Poppins', google: 'Poppins:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Raleway', label: 'Raleway', google: 'Raleway:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Nunito', label: 'Nunito', google: 'Nunito:wght@200;300;400;500;600;700;800;900' },
    { value: 'Merriweather', label: 'Merriweather', google: 'Merriweather:wght@300;400;700;900' },
    { value: 'Playfair Display', label: 'Playfair Display', google: 'Playfair+Display:wght@400;500;600;700;800;900' },
    { value: 'Source Serif 4', label: 'Source Serif 4', google: 'Source+Serif+4:wght@200;300;400;500;600;700;800;900' },
    { value: 'Source Sans 3', label: 'Source Sans 3', google: 'Source+Sans+3:wght@200;300;400;500;600;700;800;900' },
    { value: 'Ubuntu', label: 'Ubuntu', google: 'Ubuntu:wght@300;400;500;700' },
    { value: 'Fira Sans', label: 'Fira Sans', google: 'Fira+Sans:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Space Grotesk', label: 'Space Grotesk', google: 'Space+Grotesk:wght@300;400;500;600;700' },
    { value: 'IBM Plex Sans', label: 'IBM Plex Sans', google: 'IBM+Plex+Sans:wght@100;200;300;400;500;600;700' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', google: 'JetBrains+Mono:wght@100;200;300;400;500;600;700;800' },
    { value: 'Work Sans', label: 'Work Sans', google: 'Work+Sans:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Manrope', label: 'Manrope', google: 'Manrope:wght@200;300;400;500;600;700;800' },
    { value: 'DM Sans', label: 'DM Sans', google: 'DM+Sans:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Archivo', label: 'Archivo', google: 'Archivo:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Cabin', label: 'Cabin', google: 'Cabin:wght@400;500;600;700' },
    { value: 'Noto Sans', label: 'Noto Sans', google: 'Noto+Sans:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Noto Serif', label: 'Noto Serif', google: 'Noto+Serif:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Bitter', label: 'Bitter', google: 'Bitter:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'M PLUS 1p', label: 'M PLUS 1p', google: 'M+PLUS+1p:wght@100;300;400;500;700;800;900' },
    { value: 'Quicksand', label: 'Quicksand', google: 'Quicksand:wght@300;400;500;600;700' },
    { value: 'Karla', label: 'Karla', google: 'Karla:wght@200;300;400;500;600;700;800' },
    { value: 'Rubik', label: 'Rubik', google: 'Rubik:wght@300;400;500;600;700;800;900' },
    { value: 'Barlow', label: 'Barlow', google: 'Barlow:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Mulish', label: 'Mulish', google: 'Mulish:wght@200;300;400;500;600;700;800;900' },
    { value: 'Asap', label: 'Asap', google: 'Asap:wght@100;200;300;400;500;600;700;800;900' },
    { value: 'Hind', label: 'Hind', google: 'Hind:wght@300;400;500;600;700' },
    { value: 'Titillium Web', label: 'Titillium Web', google: 'Titillium+Web:wght@200;300;400;600;700;900' },
    { value: 'PT Sans', label: 'PT Sans', google: 'PT+Sans:wght@400;700' },
    { value: 'PT Serif', label: 'PT Serif', google: 'PT+Serif:wght@400;700' },
    { value: 'Lora', label: 'Lora', google: 'Lora:wght@400;500;600;700' },
    { value: 'Crimson Pro', label: 'Crimson Pro', google: 'Crimson+Pro:wght@200;300;400;500;600;700;800;900' },
    { value: 'Libre Baskerville', label: 'Libre Baskerville', google: 'Libre+Baskerville:wght@400;700' },
    { value: 'Cormorant Garamond', label: 'Cormorant Garamond', google: 'Cormorant+Garamond:wght@300;400;500;600;700' },
    { value: 'Inconsolata', label: 'Inconsolata', google: 'Inconsolata:wght@200;300;400;500;600;700;800;900' },
    { value: 'Fira Code', label: 'Fira Code', google: 'Fira+Code:wght@300;400;500;600;700' },
    { value: 'Source Code Pro', label: 'Source Code Pro', google: 'Source+Code+Pro:wght@200;300;400;500;600;700;800;900' },
    { value: 'IBM Plex Mono', label: 'IBM Plex Mono', google: 'IBM+Plex+Mono:wght@100;200;300;400;500;600;700' },
    { value: 'Space Mono', label: 'Space Mono', google: 'Space+Mono:wght@400;700' }
];

const ensureGoogleFontLoaded = (fontFamily) => {
    if (!fontFamily || typeof document === 'undefined') return;
    const font = OPEN_SOURCE_FONTS.find((f) => f.value === fontFamily);
    if (!font?.google) return;

    const id = `indra-font-${font.value.toLowerCase().replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
    document.head.appendChild(link);
};

const ensureFontBundleLoaded = () => {
    if (typeof document === 'undefined') return;
    const id = 'indra-font-bundle-open-source';
    if (document.getElementById(id)) return;

    const families = OPEN_SOURCE_FONTS.map((font) => `family=${font.google}`).join('&');
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
};

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
            { id: 'unit', label: 'UNIDAD', type: 'select', icon: 'ALIGN', options: ['mm', 'pt', 'px'], compact: true },
            { id: 'mediaPreset', label: 'SOPORTE', type: 'select', icon: 'LAYOUT', options: ['PRINT', 'SCREEN', 'PRESENTATION'], compact: true },
            { id: 'gridSize', label: 'GRID', type: 'unit', icon: 'GAP', compact: true, defaultUnit: '' },
            { id: 'showRulers', label: 'REGLAS', type: 'boolean', icon: 'TARGET', compact: true },
            { id: 'showGuides', label: 'GUIAS', type: 'boolean', icon: 'TARGET', compact: true },
            { id: 'showGrid', label: 'GRID_ON', type: 'boolean', icon: 'TARGET', compact: true },
            { id: 'snapToGrid', label: 'AJUSTE', type: 'boolean', icon: 'TARGET', compact: true }
        ];
        const paginationFields = [
            { id: 'mode', label: 'MODO', type: 'select', icon: 'REPEATER', options: ['hybrid', 'auto', 'manual'], compact: true },
            { id: 'startAt', label: 'INICIO', type: 'unit', icon: 'TEXT_SIZE', compact: true, defaultUnit: '' },
            { id: 'showNumbers', label: 'NUMERACION', type: 'boolean', icon: 'TEXT', compact: true },
            { id: 'autoFlow', label: 'AUTO_FLUJO', type: 'boolean', icon: 'TARGET', compact: true }
        ];
        const masterFields = [
            { id: 'mode', label: 'MODO', type: 'select', icon: 'LAYOUT', options: ['global', 'mixed', 'per-page'], compact: true },
            { id: 'headerEnabled', label: 'ENCABEZADO', type: 'boolean', icon: 'TEXT', compact: true },
            { id: 'footerEnabled', label: 'PIE_PAGINA', type: 'boolean', icon: 'TEXT', compact: true },
            { id: 'allowPerPageOverride', label: 'SOBRESCRIBIR', type: 'boolean', icon: 'LINK', compact: true },
            { id: 'headerTemplate', label: 'TEXTO_ENCABEZADO', type: 'text', icon: 'TEXT', compact: false },
            { id: 'footerTemplate', label: 'TEXTO_PIE', type: 'text', icon: 'TEXT', compact: false }
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
                        name="CONFIGURACION_CANVAS"
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
                        name="PAGINACION"
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
                        name="PLANTILLAS_GLOBALES"
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
                                            disabled={
                                                ['top', 'left', 'right', 'bottom', 'zIndex'].includes(field.id)
                                                && selectedNode.props.layoutMode !== 'absolute'
                                            }
                                            isLinked={isLinked}
                                            onChange={(val) => {
                                                const shouldSnap = field.type === 'unit' && shouldSnapUnits && field.id !== 'zIndex';
                                                const snappedValue = shouldSnap
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

function FieldRenderer({ field, value, onChange, disabled = false }) {
    switch (field.type) {
        case 'text':
            return (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="inspector-field__input"
                    disabled={disabled}
                    rows={2}
                    style={{ minHeight: '40px', resize: 'vertical', lineHeight: '1.4', opacity: disabled ? 0.45 : 1 }}
                />
            );

        case 'unit':
            return <ScrubbableUnitInput value={value} onChange={onChange} defaultUnit={field.defaultUnit} disabled={disabled} />;

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
                        disabled={disabled}
                    />
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="inspector-field__input fill"
                        disabled={disabled}
                        placeholder="#HEX"
                        style={{ lineHeight: '1.4', opacity: disabled ? 0.45 : 1 }}
                    />
                </div>
            );

        case 'select':
            return (
                <select
                    value={value || (field.options?.[0] || '')}
                    onChange={(e) => onChange(e.target.value)}
                    className="inspector-field__input"
                    disabled={disabled}
                    style={{ lineHeight: '1.4', opacity: disabled ? 0.45 : 1 }}
                >
                    {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                </select>
            );

        case 'font_select':
            return <FontSelectField value={value} onChange={onChange} />;

        case 'boolean':
            return (
                <button
                    type="button"
                    className={`inspector-field__input ${value ? 'is-boolean-on' : ''}`}
                    onClick={() => onChange(!value)}
                    disabled={disabled}
                    style={{
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        opacity: disabled ? 0.45 : 1
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
                    onChange={(e) => {
                        if (field.id === 'zIndex') {
                            const parsed = Number.parseInt(e.target.value, 10);
                            onChange(Number.isFinite(parsed) ? parsed : 1);
                            return;
                        }
                        onChange(e.target.value);
                    }}
                    className="inspector-field__input"
                    disabled={disabled}
                    style={{ lineHeight: '1.4', opacity: disabled ? 0.45 : 1 }}
                />
            );
    }
}

function FontSelectField({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef(null);

    const currentValue = value || OPEN_SOURCE_FONTS[0].value;
    const isKnown = OPEN_SOURCE_FONTS.some((font) => font.value === currentValue);

    const filteredFonts = OPEN_SOURCE_FONTS.filter((font) =>
        font.label.toLowerCase().includes(query.trim().toLowerCase())
    );

    useEffect(() => {
        ensureGoogleFontLoaded(currentValue);
    }, [currentValue]);

    useEffect(() => {
        ensureFontBundleLoaded();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectFont = (fontName) => {
        ensureGoogleFontLoaded(fontName);
        onChange(fontName);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <button
                type="button"
                className="inspector-field__input"
                onClick={() => setIsOpen((prev) => !prev)}
                style={{
                    textAlign: 'left',
                    lineHeight: '1.4',
                    fontFamily: currentValue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isKnown ? currentValue : `PERSONALIZADA: ${currentValue}`}
                </span>
                <span style={{ opacity: 0.7 }}>▾</span>
            </button>

            {isOpen && (
                <div
                    className="glass"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-bg-surface)',
                        zIndex: 50,
                        padding: '6px'
                    }}
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar fuente..."
                        className="inspector-field__input"
                        style={{ marginBottom: '6px' }}
                    />

                    <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '2px' }}>
                        {filteredFonts.length === 0 && (
                            <div style={{ fontSize: '10px', opacity: 0.6, padding: '8px' }}>SIN RESULTADOS</div>
                        )}

                        {filteredFonts.map((font) => (
                            <button
                                key={font.value}
                                type="button"
                                onClick={() => handleSelectFont(font.value)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: '1px solid transparent',
                                    background: font.value === currentValue ? 'var(--color-accent-dim)' : 'transparent',
                                    color: 'var(--color-text-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    marginBottom: '2px',
                                    fontFamily: font.value,
                                    fontSize: '12px'
                                }}
                            >
                                {font.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * ScrubbableUnitInput: Permite arrastrar sobre el campo para cambiar el valor numérico.
 */
function ScrubbableUnitInput({ value, onChange, defaultUnit = '', disabled = false }) {
    const isDragging = useRef(false);
    const wrapperRef = useRef(null);
    const startValue = useRef(0);
    const unitRef = useRef('');
    const [draftValue, setDraftValue] = useState(value || '');

    useEffect(() => {
        if (!isDragging.current) {
            setDraftValue(value || '');
        }
    }, [value]);

    // Extraer número y unidad del valor (ej. "18px" -> [18, "px"])
    const parseValue = useCallback((val) => {
        if (!val) return [0, defaultUnit || 'px'];
        const num = parseFloat(val);
        const unit = String(val).replace(String(num), '').trim();
        return [isNaN(num) ? 0 : num, unit || defaultUnit || 'px'];
    }, [defaultUnit]);

    const normalizeTypedValue = useCallback((raw) => {
        const text = String(raw || '').trim();
        if (!text) return '';

        const numericOnly = /^-?\d+(?:\.\d+)?$/.test(text);
        if (numericOnly) {
            const fallbackUnit = unitRef.current || defaultUnit || 'px';
            return `${text}${fallbackUnit}`;
        }

        return text;
    }, [defaultUnit]);

    const commitDraft = useCallback(() => {
        const normalized = normalizeTypedValue(draftValue);
        setDraftValue(normalized);
        onChange(normalized);
    }, [draftValue, normalizeTypedValue, onChange]);

    const handleMouseDown = (e) => {
        if (disabled) return;
        isDragging.current = true;
        const [num, unit] = parseValue(value);
        startValue.current = num;
        unitRef.current = unit;

        if (wrapperRef.current?.requestPointerLock) {
            wrapperRef.current.requestPointerLock();
        }
        
        document.body.style.cursor = 'ew-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const delta = document.pointerLockElement === wrapperRef.current
            ? e.movementX
            : e.movementX;
        const sensitivity = e.shiftKey ? 10 : 1; // Shift para incremento rápido
        startValue.current = startValue.current + (delta / sensitivity);
        const newValue = Math.round(startValue.current);
        const composed = `${newValue}${unitRef.current}`;
        setDraftValue(composed);
        onChange(composed);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        if (document.pointerLockElement === wrapperRef.current && document.exitPointerLock) {
            document.exitPointerLock();
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        return () => {
            if (document.pointerLockElement === wrapperRef.current && document.exitPointerLock) {
                document.exitPointerLock();
            }
        };
    }, []);

    return (
        <div ref={wrapperRef} className="inspector-field__unit-wrapper" onMouseDown={(e) => {
            // Solo activar scrub si el click es en el label lateral o cerca del borde
            // Pero para máxima ergonomía, lo permitimos en todo el wrapper menos el input enfocado
            handleMouseDown(e);
        }} style={{ cursor: disabled ? 'default' : 'ew-resize' }}>
            <input
                type="text"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()} // Permitir edit de texto normal
                onBlur={commitDraft}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commitDraft();
                        e.currentTarget.blur();
                    }
                }}
                className="inspector-field__input"
                disabled={disabled}
                style={{ opacity: disabled ? 0.45 : 1, cursor: 'text' }}
            />
            {defaultUnit && (
                <span className="inspector-field__unit-label">
                    {defaultUnit}
                </span>
            )}
        </div>
    );
}
