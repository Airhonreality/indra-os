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
            {/* LADO A: IDENTIDAD Y SOBERANÍA */}
            <div className="macro-header__identity fill shelf shelf--loose">
                <div className="macro-header__logo center">
                    <IndraIcon name={atomClass} size="28px" className={isLive ? 'color-danger' : 'color-accent'} />
                    {isLive && <div className="resonance-dot resonance-dot--active" style={{ position: 'absolute', top: -4, right: -4 }}></div>}
                </div>

                <div className="stack--tight fill" style={{ maxWidth: '600px' }}>
                    <div className="shelf--tight">
                        <input
                            type="text"
                            className="macro-header__title-input"
                            value={label}
                            onChange={(e) => onTitleChange?.(e.target.value)}
                            placeholder="NAME_REQUIRED..."
                            spellCheck={false}
                        />
                        {isLive && <span className="badge badge--danger badge--xs" style={{ letterSpacing: '0.1em' }}>LIVE_MODE</span>}
                        {previewMode !== undefined && (
                            <span className="badge badge--ghost badge--xs opacity-40">{previewMode ? 'PREVIEW' : 'EDIT'}</span>
                        )}
                    </div>
                    <div className="shelf--loose opacity-50">
                        <span className={`macro-header__metadata ${isSaving ? 'ast-resonance--syncing' : 'ast-resonance--stable'}`} style={{ fontSize: '9px' }}>
                            {isSaving ? 'AST_SYNCING' : 'AST_STABLE'} // {atomClass} // ID: {atom?.id?.substring(0, 16) || '...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* LADO B: ORQUESTACIÓN Y CONTROL */}
            <div className="macro-header__actions shelf shelf--loose">
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

                {/* Undo / Redo */}
                {(onUndo || onRedo) && (
                    <div className="shelf--tight glass--bone" style={{ padding: '2px 4px', borderRadius: 'var(--radius-sm)' }}>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={onUndo}
                            disabled={!canUndo}
                            style={{ opacity: canUndo ? 1 : 0.2 }}
                        >
                            <IndraIcon name="UNDO" size="14px" />
                        </button>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={onRedo}
                            disabled={!canRedo}
                            style={{ opacity: canRedo ? 1 : 0.2 }}
                        >
                            <IndraIcon name="REDO" size="14px" />
                        </button>
                    </div>
                )}

                {/* Preview Toggle */}
                {onTogglePreview && (
                    <button
                        className={`btn btn--sm ${previewMode ? 'btn--accent' : 'btn--ghost'}`}
                        onClick={onTogglePreview}
                        style={{ minWidth: '100px', fontSize: '10px' }}
                    >
                        <IndraIcon name={previewMode ? 'EDIT' : 'EYE'} size="12px" style={{ marginRight: '8px' }} />
                        {previewMode ? 'BACK_TO_EDIT' : 'PREVIEW_MODE'}
                    </button>
                )}

                {extraControls}

                <div className="macro-header__divider"></div>

                {/* Exit Trigger */}
                <div className="macro-header__exit" title="EXIT_COMMAND">
                    <IndraActionTrigger
                        icon="CLOSE"
                        label="EXIT"
                        onClick={onClose}
                        color="var(--color-danger)"
                        activeColor="var(--color-danger)"
                        size="14px"
                    />
                </div>
            </div>
        </header>
    );
}

