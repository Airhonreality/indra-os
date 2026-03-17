/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/inspector/EntityInspectorSection.jsx
 * RESPONSABILIDAD: Sección acordeón genérica del inspector paramétrico.
 * (ADR_018 §5.1 — Artefactos Nuevos)
 *
 * AXIOMA A4 (ADR_018): El estado open/closed persiste en localStorage
 * con clave: `indra_dd_inspector_sections`
 *
 * AXIOMA A6 (ADR_018): No usa style={{ ... }} para estados de selección.
 * Usa data-attributes para delegar el control visual al CSS.
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

// ── Persistencia de estado de acordeones (ADR_018 §A4) ──────────────────────

const STORAGE_KEY = 'indra_dd_inspector_sections';

function loadSectionStates() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveSectionState(sectionId, isOpen) {
    try {
        const current = loadSectionStates();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [sectionId]: isOpen }));
    } catch {
        // No rompemos el motor por falla de persistencia
    }
}

// ── Componente Principal ─────────────────────────────────────────────────────

/**
 * EntityInspectorSection
 *
 * @param {string}    sectionId    - ID único de la sección (para persistencia)
 * @param {string}    name         - Nombre de la sección (UPPER_SNAKE_CASE)
 * @param {boolean}   defaultOpen  - Estado inicial si no hay persistencia
 * @param {ReactNode} children     - Contenido de la sección (campos del inspector)
 */
export function EntityInspectorSection({ sectionId, name, defaultOpen = true, fields = [], renderField }) {
    const [isOpen, setIsOpen] = useState(() => {
        const saved = loadSectionStates();
        return sectionId in saved ? saved[sectionId] : defaultOpen;
    });

    const toggle = useCallback(() => {
        setIsOpen(prev => {
            const next = !prev;
            saveSectionState(sectionId, next);
            return next;
        });
    }, [sectionId]);

    return (
        <div
            className="inspector-section"
            data-open={isOpen}
            data-section-id={sectionId}
        >
            <style>{INSPECTOR_SECTION_STYLES}</style>
            {/* ── Header del acordeón ──────────────────────────────────── */}

            <button
                className="inspector-section__header"
                onClick={toggle}
                type="button"
            >
                <div className="shelf--tight fill">
                    <IndraIcon
                        name="CHEVRON_RIGHT"
                        size="8px"
                        style={{
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease',
                            opacity: 0.5
                        }}
                    />
                    <span className="inspector-section__title">
                        {name}
                    </span>
                </div>
            </button>

            {isOpen && (
                <div className="inspector-section__content">
                    <div className="inspector-grid">
                        {fields.map(field => (
                            <div
                                key={field.id}
                                className="inspector-field"
                                data-compact={field.compact || false}
                            >
                                <div className="inspector-field__label-row">
                                    {field.icon && (
                                        <span className="inspector-field__icon">
                                            <IndraIcon name={field.icon} size="8px" />
                                        </span>
                                    )}
                                    <label className="inspector-field__label">{field.label}</label>
                                </div>
                                {renderField && renderField(field)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


// ── Estilos encapsulados del componente ────────────────────────────────────

export const INSPECTOR_SECTION_STYLES = `
    .inspector-section {
        border-bottom: 1px solid var(--color-border);
    }

    .inspector-section__header {
        width: 100%;
        padding: 4px 8px;
        background: var(--color-bg-surface);
        border: none;
        border-bottom: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .inspector-section__header:hover {
        background: var(--color-bg-hover);
    }

    .inspector-section__title {
        font-size: 8px;
        font-family: var(--font-mono);
        font-weight: bold;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        flex: 1;
        text-align: left;
    }

    .inspector-section__content {
        padding: 6px;
        background: var(--color-bg-deep-trans);
        animation: sectionIn 0.2s ease-out;
    }

    .inspector-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px 6px;
    }

    .inspector-field {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .inspector-field[data-compact="false"] {
        grid-column: span 2;
    }

    .inspector-field__label-row {
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0.4;
    }

    .inspector-field__icon {
        display: flex;
        align-items: center;
        color: var(--color-text-secondary);
    }

    .inspector-field__label {
        font-size: 7px;
        font-family: var(--font-mono);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }


    .inspector-field__input {
        background: var(--color-bg-deep);
        border: 1px solid var(--color-border);
        border-radius: 3px;
        color: var(--color-text-primary);
        font-size: 10px;
        font-family: var(--font-mono);
        padding: 4px 6px;
        width: 100%;
        transition: all 0.1s;
    }

    .inspector-field__input:focus {
        border-color: var(--color-accent);
        outline: none;
        box-shadow: 0 0 0 1px var(--color-accent-dim);
    }

    .inspector-field__unit-wrapper {
        display: flex;
        align-items: center;
        background: var(--color-bg-deep);
        border: 1px solid var(--color-border);
        border-radius: 3px;
        overflow: hidden;
    }

    .inspector-field__unit-wrapper .inspector-field__input {
        border: none;
    }

    .inspector-field__unit-label {
        font-size: 7px;
        font-family: var(--font-mono);
        color: var(--color-text-secondary);
        padding: 0 6px;
        opacity: 0.5;
        background: var(--color-bg-elevated);
        height: 100%;
        display: flex;
        align-items: center;
        border-left: 1px solid var(--color-border);
    }

    .inspector-field__color-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .inspector-field__color-swatch {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 5px rgba(0,0,0,0.2);
        transition: transform 0.1s;
    }

    .inspector-field__color-swatch:hover {
        transform: scale(1.1);
    }
`;

