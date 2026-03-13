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
                        <TitleInput 
                            initialLabel={label} 
                            onCommit={onTitleChange} 
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

            {/* ── LADO B: COMANDOS (Clean & Agnostic) ── */}
            <div className="macro-header__controls">
                
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

// Subcomponente de Aislamiento de Red
// Resuelve el Anti-Patrón de DDOS por re-renderizado
function TitleInput({ initialLabel, onCommit }) {
    const [localValue, setLocalValue] = React.useState(initialLabel);

    // Resonancia: Si un proceso de fondo cambia o cura el nombre,
    // debemos absorberlo, pero *solo* si el usuario no tiene la caja seleccionada.
    React.useEffect(() => {
        setLocalValue(initialLabel);
    }, [initialLabel]);

    const handleBlur = () => {
        if (localValue !== initialLabel) {
            onCommit(localValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Dispara onBlur automáticamente
        }
    };

    return (
        <input
            type="text"
            className="macro-header__title-input"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="UNTITLED..."
            spellCheck={false}
        />
    );
}

