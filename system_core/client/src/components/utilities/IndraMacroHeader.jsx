import React from 'react';
import { IndraIcon } from './IndraIcons';
import { IndraActionTrigger } from './IndraActionTrigger';

/**
 * =============================================================================
 * COMPONENTE: IndraMacroHeader
 * RESPONSABILIDAD: Cabecera canónica universal para Macro-Engines (Nivel 2/3).
 *
 * AXIOMAS (ADR-002):
 *   - AGNÓSTICO: No conoce la lógica de ningún engine. Proyecta identidad.
 *   - SOBERANO: Siempre ocupa 100% del ancho del contenedor. Alto natural.
 *   - ESTÉTICO: Inspira confianza y soberanía (estilo Nexus).
 *
 * PROPS:
 *   atom          — El átomo que se está editando. Source of truth para el título.
 *   onClose       — Función de cierre (obligatoria).
 *   onTitleChange — Fn(string): si se provee, el título es editable.
 *   isSaving      — boolean: activa la animación de sincronización.
 *   isLive        — boolean: activa el indicador LIVE_MODE.
 *   onUpdateStatus — Fn('DRAFT'|'LIVE'): muestra el toggle DRAFT/LIVE.
 *   onUndo/onRedo/canUndo/canRedo — Controles de historial.
 *   onTogglePreview/previewMode   — Controla el modo de previsualización.
 *   rightSlot     — ReactNode: zona derecha para acciones del engine (OPCIONAL).
 * =============================================================================
 */
export function IndraMacroHeader({
    atom,
    onClose,
    onTitleChange,
    isSaving = false,
    isLive = false,
    onUpdateStatus,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onTogglePreview,
    previewMode,
    rightSlot,
}) {
    const handle = atom?.handle || {};
    const label = handle.label || 'UNTITLED';
    const atomClass = atom?.class || 'ATOM';
    const atomId = atom?.id ? atom.id.substring(0, 20) : '...';

    return (
        <header className="macro-header glass">

            {/* ── LADO A: IDENTIDAD ── */}
            <div className="macro-header__identity">

                {/* LOGO ICON */}
                <div className="macro-header__logo">
                    <IndraIcon
                        name={atomClass}
                        size="26px"
                        style={{ color: isLive ? 'var(--color-danger)' : 'var(--color-accent)' }}
                    />
                    {isLive && (
                        <div className="resonance-dot resonance-dot--active"
                            style={{ position: 'absolute', top: -3, right: -3 }} />
                    )}
                </div>

                {/* TITLE BLOCK */}
                <div className="macro-header__title-block">
                    {onTitleChange ? (
                        <input
                            type="text"
                            className="macro-header__title-input"
                            value={label}
                            onChange={(e) => onTitleChange(e.target.value)}
                            placeholder="UNTITLED..."
                            spellCheck={false}
                        />
                    ) : (
                        <h2 className="macro-header__title-static">{label}</h2>
                    )}

                    <div className="macro-header__meta shelf--tight">
                        <span className={`macro-header__meta-text ${isSaving ? 'ast-resonance--syncing' : 'ast-resonance--stable'}`}>
                            {isSaving ? 'AST_SYNCING' : 'AST_STABLE'}
                        </span>
                        <span className="macro-header__meta-sep opacity-30">//</span>
                        <span className="macro-header__meta-text opacity-40">{atomClass}</span>
                        <span className="macro-header__meta-sep opacity-30">//</span>
                        <span className="macro-header__meta-text opacity-30">ID: {atomId}</span>
                        {isLive && (
                            <span className="macro-header__live-badge">LIVE</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── LADO B: COMANDOS (solo lógica canónica del header) ── */}
            <div className="macro-header__controls">

                {/* Status Toggle DRAFT/LIVE */}
                {onUpdateStatus && (
                    <div className="shelf--tight macro-header__status-toggle">
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

                {/* Undo/Redo */}
                {(onUndo || onRedo) && (
                    <div className="shelf--tight">
                        <button className="btn btn--ghost btn--sm" onClick={onUndo}
                            disabled={!canUndo} style={{ opacity: canUndo ? 1 : 0.2 }}>
                            <IndraIcon name="UNDO" size="13px" />
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={onRedo}
                            disabled={!canRedo} style={{ opacity: canRedo ? 1 : 0.2 }}>
                            <IndraIcon name="REDO" size="13px" />
                        </button>
                    </div>
                )}

                {/* Preview Toggle */}
                {onTogglePreview && (
                    <button
                        className={`btn btn--sm ${previewMode ? 'btn--accent' : 'btn--ghost'}`}
                        onClick={onTogglePreview}
                        style={{ fontSize: '10px', letterSpacing: '0.05em' }}
                    >
                        {previewMode ? 'BACK_TO_EDIT' : 'PREVIEW'}
                    </button>
                )}

                {/* RIGHT SLOT: Herramientas del engine (opcional, agnóstico) */}
                {rightSlot && (
                    <>
                        <div className="macro-header__divider" />
                        {rightSlot}
                    </>
                )}

                {/* EXIT */}
                <div className="macro-header__divider" />
                <IndraActionTrigger
                    icon="CLOSE"
                    label="EXIT_ENGINE"
                    onClick={onClose}
                    color="var(--color-text-dim)"
                    activeColor="var(--color-danger)"
                    size="13px"
                />

            </div>
        </header>
    );
}
