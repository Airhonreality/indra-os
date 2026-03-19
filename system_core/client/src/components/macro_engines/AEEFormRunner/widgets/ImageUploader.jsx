import React, { useState, useRef } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * ImageUploader: Widget de "Aduana" para medios visuales.
 *
 * ADR-023: Soporta tres modos de entrada:
 *   1. UPLOAD    → archivo local → base64 (para formularios ligeros)
 *   2. DRIVE_ID  → texto (Drive File ID) → empaqueta como INDRA_MEDIA { storage: 'drive' }
 *   3. URL       → texto (URL pública)   → empaqueta como INDRA_MEDIA { storage: 'url' }
 *
 * El valor que emite siempre es un objeto INDRA_MEDIA o null.
 * El Bridge o Workflow downstream decide qué hacer con él.
 */
export function ImageUploader({ field, value, onChange, disabled }) {
    const config = field.config || {};
    const [mode, setMode] = useState('UPLOAD'); // 'UPLOAD' | 'DRIVE_ID' | 'URL'
    const [textInput, setTextInput] = useState('');
    const [error, setError] = useState(null);
    const fileRef = useRef(null);

    // Resolver la URL de preview desde el valor actual (INDRA_MEDIA o string legacy)
    const getPreviewUrl = () => {
        if (!value) return null;
        if (typeof value === 'string') return value; // base64 o URL legacy
        if (value?.type === 'INDRA_MEDIA') return value.canonical_url;
        return null;
    };

    const previewUrl = getPreviewUrl();

    const maxSize = config.max_size_mb || 5;
    const allowedTypes = config.allowed_formats || ['image/jpeg', 'image/png', 'image/webp'];

    // ── MODO UPLOAD: archivo local → base64 ──────────────────────────────────
    const handleFile = (file) => {
        if (!file) return;
        if (!allowedTypes.includes(file.type)) {
            setError(`Formato no válido. Use: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
            return;
        }
        if (file.size > maxSize * 1024 * 1024) {
            setError(`Imagen demasiado grande. Máximo ${maxSize}MB.`);
            return;
        }
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            // Para uploads directos, emitir base64 (el Bridge puede manejarlo)
            const media = {
                type: 'INDRA_MEDIA',
                storage: 'base64',
                canonical_url: e.target.result,
                mime_type: file.type,
                expires_at: null,
                alt: file.name
            };
            onChange(field.alias, media);
        };
        reader.readAsDataURL(file);
    };

    // ── MODO DRIVE_ID / URL: texto → INDRA_MEDIA ─────────────────────────────
    const handleTextConfirm = () => {
        const trimmed = textInput.trim();
        if (!trimmed) { setError('Ingresa un valor válido.'); return; }

        setError(null);
        if (mode === 'DRIVE_ID') {
            onChange(field.alias, {
                type: 'INDRA_MEDIA',
                storage: 'drive',
                canonical_url: `https://lh3.googleusercontent.com/d/${trimmed}`,
                file_id: trimmed,
                mime_type: null,
                expires_at: null,
                alt: field.label
            });
        } else {
            onChange(field.alias, {
                type: 'INDRA_MEDIA',
                storage: 'url',
                canonical_url: trimmed,
                file_id: null,
                mime_type: null,
                expires_at: null,
                alt: field.label
            });
        }
    };

    const clearValue = (e) => {
        e.stopPropagation();
        onChange(field.alias, null);
        setTextInput('');
        setError(null);
    };

    const handlePaste = (e) => {
        const item = e.clipboardData.items[0];
        if (item?.type.includes('image')) {
            handleFile(item.getAsFile());
        }
    };

    return (
        <div className="form-item stack--tight" onPaste={handlePaste}>
            <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>

            {/* Selector de modo */}
            <div className="shelf--tight" style={{ gap: 'var(--space-1)' }}>
                {[
                    { key: 'UPLOAD', label: 'Subir' },
                    { key: 'DRIVE_ID', label: 'Drive ID' },
                    { key: 'URL', label: 'URL' }
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

            {/* Preview si hay valor */}
            {previewUrl && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', objectFit: 'contain', border: '1px solid var(--color-border)' }}
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                    {!disabled && (
                        <button
                            className="btn btn--danger btn--xs btn--icon"
                            onClick={clearValue}
                            style={{ position: 'absolute', top: '4px', right: '4px' }}
                        >
                            <IndraIcon name="CLOSE" size="8px" />
                        </button>
                    )}
                    {/* Badge de storage */}
                    {value?.storage && (
                        <span style={{
                            position: 'absolute', bottom: '4px', left: '4px',
                            fontSize: '7px', fontFamily: 'var(--font-mono)',
                            background: 'rgba(0,0,0,0.7)', color: 'white',
                            padding: '1px 4px', borderRadius: '2px'
                        }}>
                            {value.storage.toUpperCase()}
                        </span>
                    )}
                </div>
            )}

            {/* MODO UPLOAD */}
            {mode === 'UPLOAD' && !previewUrl && (
                <div
                    className={`image-dropzone glass-hover stack center ${disabled ? 'disabled' : ''} ${error ? 'error-border' : ''}`}
                    onClick={() => !disabled && fileRef.current?.click()}
                    style={{
                        border: '1px dashed var(--color-border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        minHeight: '100px',
                        padding: 'var(--space-4)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: 'rgba(255,255,255,0.02)'
                    }}
                >
                    <div className="empty-state stack center" style={{ opacity: 0.4 }}>
                        <IndraIcon name="IMAGE" size="28px" />
                        <span style={{ fontSize: '9px', marginTop: '6px' }}>CLICK / PEGAR IMAGEN</span>
                        <span style={{ fontSize: '8px' }}>Max: {maxSize}MB</span>
                    </div>
                    <input
                        type="file"
                        ref={fileRef}
                        accept={allowedTypes.join(',')}
                        onChange={e => handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            )}

            {/* MODO DRIVE_ID / URL */}
            {(mode === 'DRIVE_ID' || mode === 'URL') && !previewUrl && (
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

            {error && (
                <div className="shelf--tight" style={{ color: 'var(--color-danger)', fontSize: '9px', marginTop: '2px' }}>
                    <IndraIcon name="WARN" size="10px" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
