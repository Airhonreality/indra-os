/**
 * =============================================================================
 * PRIMITIVA: EditableLabel.jsx
 * RESPONSABILIDAD: Texto inline editable con un solo clic.
 *
 * Consolida BridgeDesigner/Utilities.jsx > EditableAlias y todos los
 * inputs de alias/nombre inline dispersos en los motores.
 *
 * PROPS:
 *   value       — string: valor actual (controlled)
 *   onCommit    — fn(string): se dispara al perder foco o presionar Enter
 *   placeholder — string: texto cuando está vacío
 *   style       — object: estilos adicionales al contenedor
 *   className   — string: clases adicionales
 *   readOnly    — boolean: bloquea la edición
 * =============================================================================
 */
import React, { useState, useRef, useEffect } from 'react';

export function EditableLabel({ value, onCommit, placeholder = 'UNTITLED', style = {}, className = '', readOnly = false }) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef(null);

    // Sincronizar si el valor cambia desde afuera
    useEffect(() => { setDraft(value); }, [value]);

    const startEdit = () => {
        if (readOnly) return;
        setIsEditing(true);
        setDraft(value);
    };

    const commit = () => {
        setIsEditing(false);
        const trimmed = draft.trim();
        if (trimmed && trimmed !== value) onCommit(trimmed);
        else setDraft(value); // revertir si vacío
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setIsEditing(false); setDraft(value); }
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const baseStyle = {
        fontFamily: 'var(--font-mono)',
        fontSize: 'inherit',
        color: 'inherit',
        cursor: readOnly ? 'default' : 'text',
        ...style,
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                spellCheck={false}
                className={`editable-label editable-label--active ${className}`}
                style={{
                    ...baseStyle,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-accent)',
                    outline: 'none',
                    padding: 0,
                    width: '100%',
                    minWidth: '60px',
                }}
                onClick={e => e.stopPropagation()}
            />
        );
    }

    return (
        <span
            className={`editable-label ${className}`}
            onDoubleClick={startEdit}
            onClick={e => { e.stopPropagation(); startEdit(); }}
            title={readOnly ? value : 'Click para editar'}
            style={{
                ...baseStyle,
                padding: 0,
                opacity: value ? 1 : 0.4,
            }}
        >
            {value || placeholder}
        </span>
    );
}
