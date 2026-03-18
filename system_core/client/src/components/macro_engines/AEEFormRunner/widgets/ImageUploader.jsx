import React, { useState, useRef } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * ImageUploader: Widget de "Aduana" para fotos.
 * Valida tamaño y formato en frontera.
 */
export function ImageUploader({ field, value, onChange, disabled }) {
    const [preview, setPreview] = useState(value || null);
    const [error, setError] = useState(null);
    const fileRef = useRef(null);
    const config = field.config || {};
    
    // Configuración de Aduana (ADR-008)
    const maxSize = config.max_size_mb || 5; 
    const allowedTypes = config.allowed_formats || ['image/jpeg', 'image/png', 'image/webp'];

    const handleFile = (file) => {
        if (!file) return;

        // 1. Validar Tipo
        if (!allowedTypes.includes(file.type)) {
            setError(`Formato no válido. Use: ${allowedTypes.join(', ')}`);
            return;
        }

        // 2. Validar Tamaño
        if (file.size > maxSize * 1024 * 1024) {
            setError(`Imagen demasiado grande. Máximo ${maxSize}MB. (Actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
            return;
        }

        setError(null);

        // Generar Vista Previa
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            setPreview(base64);
            onChange(field.alias, base64);
        };
        reader.readAsDataURL(file);
    };

    const clearFile = (e) => {
        e.stopPropagation();
        setPreview(null);
        onChange(field.alias, null);
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
            
            <div 
                className={`image-dropzone glass-hover stack center ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}
                onClick={() => !disabled && fileRef.current?.click()}
                style={{
                    border: '1px dashed var(--color-border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    minHeight: '120px',
                    padding: 'var(--space-4)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    background: preview ? 'none' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s ease'
                }}
            >
                {preview ? (
                    <div className="preview-container fill stack center" style={{ width: '100%', height: '100%' }}>
                        <img 
                            src={preview} 
                            alt="Preview" 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', objectFit: 'contain' }} 
                        />
                        {!disabled && (
                            <button 
                                className="btn btn--danger btn--xs btn--icon" 
                                onClick={clearFile}
                                style={{ position: 'absolute', top: '8px', right: '8px' }}
                            >
                                <IndraIcon name="CLOSE" size="10px" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="empty-state stack center" style={{ opacity: 0.4 }}>
                        <IndraIcon name="IMAGE" size="32px" />
                        <span style={{ fontSize: '10px', marginTop: '8px' }}>
                            CLICK_TO_UPLOAD_OR_PASTE
                        </span>
                        <span style={{ fontSize: '8px', marginTop: '4px' }}>
                            Max: {maxSize}MB
                        </span>
                    </div>
                )}

                <input 
                    type="file" 
                    ref={fileRef}
                    accept={allowedTypes.join(',')}
                    onChange={(e) => handleFile(e.target.files[0])}
                    style={{ display: 'none' }}
                />
            </div>

            {error && (
                <div className="error-message shelf--tight" style={{ color: 'var(--color-danger)', fontSize: '9px', marginTop: '4px' }}>
                    <IndraIcon name="WARN" size="10px" />
                    <span>{error}</span>
                </div>
            )}

            <style>{`
                .image-dropzone:hover:not(.disabled) {
                    border-color: var(--color-accent);
                    background: rgba(var(--rgb-accent), 0.05);
                }
                .image-dropzone.error {
                    border-color: var(--color-danger);
                }
            `}</style>
        </div>
    );
}
