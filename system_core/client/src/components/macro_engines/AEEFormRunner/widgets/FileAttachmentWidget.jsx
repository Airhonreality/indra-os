import React, { useState, useRef } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * FileAttachmentWidget — ADR-023
 *
 * Widget para el tipo FILE_ATTACHMENT: acepta cualquier tipo de archivo binario
 * (SKP, CDR, PDF, ZIP, DWG, etc.), no solo imágenes.
 *
 * Modos de entrada:
 *   1. UPLOAD    → archivo local → INDRA_MEDIA { storage: 'base64' | 'upload' }
 *      (solo recomendado para archivos pequeños — el Bridge lo maneja)
 *   2. DRIVE_ID  → Drive File ID → INDRA_MEDIA { storage: 'drive' }
 *   3. URL       → URL pública o firmada → INDRA_MEDIA { storage: 'url' }
 *
 * El widget emite siempre un objeto INDRA_MEDIA. El receptor (Bridge/Workflow)
 * decide cómo procesar el archivo.
 */
export function FileAttachmentWidget({ field, value, onChange, disabled }) {
    const config = field.config || {};
    const [mode, setMode] = useState('DRIVE_ID'); // Default: Drive ID (más común para binarios pesados)
    const [textInput, setTextInput] = useState('');
    const [error, setError] = useState(null);
    const fileRef = useRef(null);

    const maxSizeMb = config.max_size_mb || 50;
    const allowedExts = config.allowed_extensions || []; // [] = cualquier ext
    const allowedStr = allowedExts.length > 0 ? allowedExts.join(', ') : 'Cualquier tipo';

    // Resolver el valor actual para display
    const getCurrentMedia = () => {
        if (!value) return null;
        if (typeof value === 'object' && value.type === 'INDRA_MEDIA') return value;
        if (typeof value === 'string') return { canonical_url: value, alt: value, storage: 'url', type: 'INDRA_MEDIA', mime_type: null };
        return null;
    };
    const current = getCurrentMedia();

    // ── Extensión del archivo ──────────────────────────────────────
    const getExt = (nameOrUrl) => {
        if (!nameOrUrl) return '?';
        const parts = nameOrUrl.split('.');
        return parts.length > 1 ? parts.pop().toUpperCase() : '?';
    };

    // ── Validar extensión ──────────────────────────────────────────
    const validateExt = (filename) => {
        if (allowedExts.length === 0) return true;
        const ext = filename.split('.').pop().toLowerCase();
        return allowedExts.map(e => e.toLowerCase()).includes(ext);
    };

    // ── MODO UPLOAD ────────────────────────────────────────────────
    const handleFile = (file) => {
        if (!file) return;
        if (!validateExt(file.name)) {
            setError(`Formato no permitido. Permitidos: ${allowedStr}`);
            return;
        }
        if (file.size > maxSizeMb * 1024 * 1024) {
            setError(`Archivo demasiado grande. Máximo ${maxSizeMb}MB.`);
            return;
        }
        setError(null);

        // Para archivos grandes usar solo metadatos (el upload real va via Backend)
        // Para archivos pequeños (<5MB) se puede incluir base64
        const isSmall = file.size < 5 * 1024 * 1024;
        if (isSmall) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onChange(field.alias, {
                    type: 'INDRA_MEDIA',
                    storage: 'base64',
                    canonical_url: e.target.result,
                    file_id: null,
                    mime_type: file.type,
                    expires_at: null,
                    alt: file.name
                });
            };
            reader.readAsDataURL(file);
        } else {
            // Para archivos grandes: solo emitir metadatos, sin base64
            // El Bridge debe solicitar al usuario que lo suba a Drive primero
            setError(`Archivo grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Súbelo a Drive y usa el modo Drive ID.`);
        }
    };

    // ── MODO DRIVE_ID / URL ────────────────────────────────────────
    const handleTextConfirm = () => {
        const trimmed = textInput.trim();
        if (!trimmed) { setError('Ingresa un valor válido.'); return; }
        setError(null);

        if (mode === 'DRIVE_ID') {
            onChange(field.alias, {
                type: 'INDRA_MEDIA',
                storage: 'drive',
                canonical_url: `https://drive.google.com/file/d/${trimmed}/view`,
                file_id: trimmed,
                mime_type: null,
                expires_at: null,
                alt: field.label
            });
        } else {
            const ext = getExt(trimmed);
            onChange(field.alias, {
                type: 'INDRA_MEDIA',
                storage: 'url',
                canonical_url: trimmed,
                file_id: null,
                mime_type: null,
                expires_at: null,
                alt: `${field.label}.${ext}`
            });
        }
    };

    const clearValue = (e) => {
        e.stopPropagation();
        onChange(field.alias, null);
        setTextInput('');
        setError(null);
    };

    return (
        <div className="form-item stack--tight">
            <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>

            {/* Selector de modo */}
            <div className="shelf--tight" style={{ gap: 'var(--space-1)' }}>
                {[
                    { key: 'DRIVE_ID', label: 'Drive ID', icon: 'FOLDER' },
                    { key: 'URL', label: 'URL', icon: 'BRIDGE' },
                    { key: 'UPLOAD', label: 'Local', icon: 'UPLOAD' }
                ].map(m => (
                    <button
                        key={m.key}
                        className={`btn btn--xs ${mode === m.key ? 'btn--accent' : 'btn--ghost'}`}
                        onClick={() => { setMode(m.key); setError(null); }}
                        disabled={disabled}
                        style={{ fontSize: '8px', padding: '2px 8px' }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Archivo vinculado actual */}
            {current && (
                <div className="shelf--tight glass" style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'rgba(var(--rgb-accent), 0.05)'
                }}>
                    {/* Badge de tipo de archivo */}
                    <div style={{
                        width: '32px', height: '32px',
                        background: 'var(--color-accent)', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '8px', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                        color: 'black', flexShrink: 0
                    }}>
                        {getExt(current.alt || current.canonical_url)}
                    </div>
                    <div className="stack--tight fill" style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {current.alt || 'Archivo vinculado'}
                        </span>
                        <div className="shelf--tight" style={{ opacity: 0.5 }}>
                            <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>{current.storage?.toUpperCase()}</span>
                            {current.file_id && <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>· {current.file_id.substring(0, 12)}...</span>}
                        </div>
                    </div>
                    <div className="shelf--tight" style={{ flexShrink: 0 }}>
                        {current.canonical_url && (
                            <a
                                href={current.canonical_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn--ghost btn--xs btn--icon"
                                title="Abrir archivo"
                                style={{ fontSize: '9px' }}
                            >
                                <IndraIcon name="BRIDGE" size="10px" />
                            </a>
                        )}
                        {!disabled && (
                            <button className="btn btn--danger btn--xs btn--icon" onClick={clearValue} title="Quitar archivo">
                                <IndraIcon name="CLOSE" size="10px" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* MODO UPLOAD */}
            {mode === 'UPLOAD' && !current && (
                <div
                    className={`glass-hover stack center ${disabled ? '' : ''}`}
                    onClick={() => !disabled && fileRef.current?.click()}
                    style={{
                        border: '1px dashed var(--color-border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        minHeight: '80px',
                        padding: 'var(--space-4)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: 'rgba(255,255,255,0.02)'
                    }}
                >
                    <div className="stack center" style={{ opacity: 0.4, gap: 'var(--space-2)' }}>
                        <IndraIcon name="FILE" size="28px" />
                        <span style={{ fontSize: '9px' }}>CLICK PARA SUBIR ARCHIVO</span>
                        <span style={{ fontSize: '8px' }}>Max: {maxSizeMb}MB · {allowedStr}</span>
                    </div>
                    <input
                        type="file"
                        ref={fileRef}
                        accept={allowedExts.length > 0 ? allowedExts.map(e => `.${e}`).join(',') : undefined}
                        onChange={e => handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                        disabled={disabled}
                    />
                </div>
            )}

            {/* MODO DRIVE_ID / URL */}
            {(mode === 'DRIVE_ID' || mode === 'URL') && !current && (
                <div className="shelf--tight" style={{ gap: 'var(--space-2)' }}>
                    <input
                        type="text"
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleTextConfirm()}
                        placeholder={mode === 'DRIVE_ID' ? 'Ej: 1BxiMVs0XCkDFG...' : 'https://...'}
                        disabled={disabled}
                        style={{
                            flex: 1,
                            background: 'var(--color-bg-deep)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            padding: 'var(--space-2) var(--space-3)'
                        }}
                    />
                    <button
                        className="btn btn--accent btn--xs"
                        onClick={handleTextConfirm}
                        disabled={disabled || !textInput.trim()}
                        style={{ fontSize: '9px' }}
                    >
                        <IndraIcon name="CHECK" size="10px" />
                    </button>
                </div>
            )}

            {/* Hint contextual según modo */}
            {!current && (
                <p style={{ fontSize: '8px', opacity: 0.35, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {mode === 'DRIVE_ID' && 'Pega el ID del archivo de Drive (aparece en la URL de Drive).'}
                    {mode === 'URL' && 'Pega la URL pública o firmada del archivo.'}
                    {mode === 'UPLOAD' && 'Para archivos grandes (+5MB), usa el modo Drive ID en su lugar.'}
                </p>
            )}

            {error && (
                <div className="shelf--tight" style={{ color: 'var(--color-danger)', fontSize: '9px', marginTop: '2px' }}>
                    <IndraIcon name="WARN" size="10px" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
