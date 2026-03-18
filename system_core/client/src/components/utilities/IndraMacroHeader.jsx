import React from 'react';
import { IndraIcon } from './IndraIcons';
import { IndraActionTrigger } from './IndraActionTrigger';
import { useShell } from '../../context/ShellContext';
import { StyleEngineSidebar } from './StyleEngineSidebar';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';

export function IndraMacroHeader({
    atom,
    onClose,
    onTitleChange,
    isLive = false,
    rightSlot,
    overrideTitle,
    overrideMeta,
    overrideClass,
    hideExit = false
}) {
    const t = useLexicon();
    const isSaving = useAppState(s => !!s.pendingSyncs[atom?.id]);
    const { setIsStyleEngineOpen, theme, setTheme } = useShell();
    const [isPulsing, setIsPulsing] = React.useState(false);

    const handleThemeToggle = () => {
        // Cycling between dark, light, indra-vapor
        const nextThemes = {
            'dark': 'light',
            'light': 'indra-vapor',
            'indra-vapor': 'dark'
        };
        setTheme(nextThemes[theme] || 'dark');
    };

    React.useEffect(() => {
        const handler = (e) => {
            if (e.detail.type === 'OUT') {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 400);
            }
        };
        window.addEventListener('indra-pulse', handler);
        return () => window.removeEventListener('indra-pulse', handler);
    }, []);

    // AXIOMA: Universe Injection (Inyectar color local al DOM Global)
    React.useEffect(() => {
        const color = atom?.color;
        if (color) {
            document.documentElement.style.setProperty('--indra-dynamic-accent', color);
            document.documentElement.style.setProperty('--indra-dynamic-border', `${color}26`);
            document.documentElement.style.setProperty('--indra-dynamic-bg', `${color}08`);
        }
        return () => {
            document.documentElement.style.removeProperty('--indra-dynamic-accent');
            document.documentElement.style.removeProperty('--indra-dynamic-border');
            document.documentElement.style.removeProperty('--indra-dynamic-bg');
        };
    }, [atom?.color]);

    const handle = atom?.handle || {};
    const label = overrideTitle || handle.label || t('status_unnamed');
    const atomClass = overrideClass || atom?.class || 'ATOM';
    const atomId = atom?.id ? atom.id.substring(0, 20) : '...';
    const metaText = overrideMeta || (isSaving ? t('status_syncing') : t('status_stable'));

    return (
        <>
        <header className="macro-header glass">

            {/* ── LADO A: IDENTIDAD ── */}
            <div className="macro-header__identity">

                {/* LOGO ICON */}
                <div className={`macro-header__logo ${isPulsing ? 'macro-header__logo--pulse' : ''}`}>
                    <IndraIcon
                        name={atomClass}
                        size="18px"
                        style={{ 
                            color: isLive ? 'var(--color-danger)' : 'var(--indra-dynamic-accent, var(--color-accent))',
                            filter: isPulsing ? 'drop-shadow(0 0 10px var(--indra-dynamic-accent, var(--color-accent)))' : 'none'
                        }}
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

                    <div className="macro-header__meta shelf--tight" style={{ gap: '12px' }}>
                        <span className={`macro-header__meta-text ${isSaving ? 'ast-resonance--syncing' : 'ast-resonance--stable'}`} style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.05em' }}>
                            {metaText.toUpperCase()}
                        </span>
                        {!overrideMeta && (
                            <>
                                <div style={{ width: '1px', height: '8px', background: 'var(--color-border)', opacity: 0.3 }} />
                                <span className="macro-header__meta-text opacity-40" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                                    {atomClass}
                                </span>
                                <div style={{ width: '1px', height: '8px', background: 'var(--color-border)', opacity: 0.3 }} />
                                <span className="macro-header__meta-text opacity-30" style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}>
                                    ID_{atomId}
                                </span>
                            </>
                        )}
                        {isLive && (
                            <span className="macro-header__live-badge">{t('status_live')}</span>
                        )}
                    </div>
                </div>

                {/* ── ACTIVE ENGINE TOOLS (Axioma: Proximidad Cognitiva) ── */}
                {rightSlot && (
                    <div className="macro-header__engine-tools shelf--tight" style={{ marginLeft: 'var(--space-6)' }}>
                        {rightSlot}
                    </div>
                )}
            </div>            {/* ── LADO B: COMANDOS (Clean & Agnostic) ── */}
            <div className="macro-header__controls">
                
                {/* Global Tray (Originales) - Justified Left in this container */}
                <div className="macro-header__control-tray shelf--tight" style={{ 
                    padding: '4px 12px', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginRight: 'auto' // AXIOMA: Empujar el resto a la derecha
                }}>
                    {/* CORE CONNECTIVITY (Link Directo) */}
                    <button 
                        className={`btn btn--mini ${useAppState.getState().docsTab === 'INSTALACION' && useAppState.getState().isDocsOpen ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: (useAppState.getState().docsTab === 'INSTALACION' && useAppState.getState().isDocsOpen) ? 'var(--color-accent)' : 'inherit',
                            filter: (useAppState.getState().docsTab === 'INSTALACION' && useAppState.getState().isDocsOpen) ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none'
                        }}
                        onClick={() => useAppState.getState().openDocs('INSTALACION')}
                        title="Core Connectivity (Conector Maestro)"
                    >
                        <IndraIcon name="LINK" size="14px" />
                    </button>

                    <button 
                        className="btn btn--mini"
                        style={{ width: '32px', height: '32px', padding: '0' }}
                        onClick={handleThemeToggle}
                        title={t('ui_theme_selection')}
                    >
                        <IndraIcon name="EYE" size="14px" />
                    </button>
                    
                    <button 
                        className={`btn btn--mini ${useShell().isStyleEngineOpen ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: useShell().isStyleEngineOpen ? 'var(--color-accent)' : 'inherit',
                            filter: useShell().isStyleEngineOpen ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none'
                        }}
                        onClick={() => setIsStyleEngineOpen(!useShell().isStyleEngineOpen)}
                        title={t('ui_style_engine')}
                    >
                        <IndraIcon name="LAYERS" size="14px" />
                    </button>

                    <button 
                        className={`btn btn--mini ${(useAppState.getState().isDocsOpen && useAppState.getState().docsTab !== 'INSTALACION') ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: (useAppState.getState().isDocsOpen && useAppState.getState().docsTab !== 'INSTALACION') ? 'var(--color-accent)' : 'inherit',
                            filter: (useAppState.getState().isDocsOpen && useAppState.getState().docsTab !== 'INSTALACION') ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none'
                        }}
                        onClick={() => useAppState.getState().openDocs('BIENVENIDA')}
                        title="Documentación y Guías"
                    >
                        <IndraIcon name="INFO" size="14px" />
                    </button>

                    <button 
                        className={`btn btn--mini ${useAppState.getState().isDiagnosticHubOpen ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: useAppState.getState().isDiagnosticHubOpen ? '#ff00ff' : 'inherit',
                            filter: useAppState.getState().isDiagnosticHubOpen ? 'drop-shadow(0 0 8px #ff00ff)' : 'none'
                        }}
                        onClick={() => useAppState.getState().openDiagnosticHub()}
                        title="Cabina de Diagnóstico (IDH)"
                    >
                        <IndraIcon name="TERMINAL" size="14px" />
                    </button>
                </div>

                {/* divider removed from here */}

                {/* EXIT (Semantic Eject) */}
                {!hideExit && (
                    <button 
                        className="btn btn--mini shadow-hover"
                        onClick={onClose}
                        title={t('action_back')}
                        style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            opacity: 0.6
                        }}
                    >
                        <IndraIcon name="EJECT" size="16px" />
                    </button>
                )}

            </div>
        </header>
        
        {/* The Sidebar is globally accessible inside the macro header's portal/sibling scope */}
        <StyleEngineSidebar />
        </>
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

