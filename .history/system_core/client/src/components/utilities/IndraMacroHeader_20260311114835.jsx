import React from 'react';
import { IndraIcon } from './IndraIcons';
import { IndraActionTrigger } from './IndraActionTrigger';

/**
 * IndraMacroHeader
 * Cabecera canónica para Macro-Engines (Nivel 2/3).
 * Refleja soberanía, identidad y control global.
 */
export function IndraMacroHeader({
    atom,
    onClose,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isSaving,
    isLive,
    onUpdateStatus,
    onTitleChange,
    previewMode,
    onTogglePreview,
    extraControls
}) {
    const handle = atom?.handle || {};
    const label = handle.label || 'UNTITLED_ARTIFACT';
    const atomClass = atom?.class || 'UNKNOWN';

    return (
        <header className="macro-header glass">
            <div className="macro-header__identity fill shelf shelf--loose">
                <IndraIcon name={atomClass} size="24px" className={isLive ? 'color-danger' : 'color-accent'} />

                <div className="stack--tight fill" style={{ maxWidth: '400px' }}>
                    <div className="shelf--tight">
                        <input
                            type="text"
                            className="macro-header__title-input"
                            value={label}
                            onChange={(e) => onTitleChange?.(e.target.value)}
                            placeholder="NAME_REQUIRED..."
                            spellCheck={false}
                        />
                        {isLive && <span className="badge badge--danger badge--xs">LIVE</span>}
                    </div>
                    <span className={`macro-header__metadata ${isSaving ? 'ast-resonance--syncing' : 'ast-resonance--stable'}`}>
                        {isSaving ? 'AST_RESONANCE: SYNCING...' : 'AST_RESONANCE: STABLE'} // ID: {atom?.id || '...'}
                    </span>
                </div>
            </div>

            <div className="shelf shelf--loose">
                {/* Status Toggle (si aplica) */}
                {onUpdateStatus && (
                    <div className="macro-header__status-toggle glass shelf--tight">
                        <button
                            className={`btn btn--xs ${!isLive ? 'btn--accent' : 'btn--ghost'}`}
                            onClick={() => onUpdateStatus('DRAFT')}
                        >DRAFT</button>
                        <button
                            className={`btn btn--xs ${isLive ? 'btn--danger' : 'btn--ghost'}`}
                            onClick={() => onUpdateStatus('LIVE')}
                        >LIVE</button>
                    </div>
                )}

                <div className="macro-header__divider"></div>

                {/* Undo / Redo */}
                <div className="shelf--tight">
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={onUndo}
                        disabled={!canUndo}
                        style={{ opacity: canUndo ? 1 : 0.3 }}
                    >
                        <IndraIcon name="UNDO" size="14px" />
                    </button>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={onRedo}
                        disabled={!canRedo}
                        style={{ opacity: canRedo ? 1 : 0.3 }}
                    >
                        <IndraIcon name="REDO" size="14px" />
                    </button>
                </div>

                {/* Preview Toggle */}
                {onTogglePreview && (
                    <button
                        className={`btn btn--sm ${previewMode ? 'btn--accent' : 'btn--ghost'}`}
                        onClick={onTogglePreview}
                    >
                        {previewMode ? 'EDIT_MODE' : 'PREVIEW_MODE'}
                    </button>
                )}

                {extraControls}

                <div className="macro-header__divider"></div>

                {/* Exit Trigger */}
                <IndraActionTrigger
                    icon="CLOSE"
                    label="EXIT"
                    onClick={onClose}
                    color="var(--color-danger)"
                    activeColor="var(--color-danger)"
                />
            </div>
        </header>
    );
}
