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
    rightSlot
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
    const label = handle.label || t('status_unnamed');
    const atomClass = atom?.class || 'ATOM';
    const atomId = atom?.id ? atom.id.substring(0, 20) : '...';

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

                    <div className="macro-header__meta shelf--tight">
                        <span className={`macro-header__meta-text ${isSaving ? 'ast-resonance--syncing' : 'ast-resonance--stable'}`}>
                            {isSaving ? t('status_syncing') : t('status_stable')}
                        </span>
                        <span className="macro-header__meta-sep opacity-30">//</span>
                        <span className="macro-header__meta-text opacity-40">{atomClass}</span>
                        <span className="macro-header__meta-sep opacity-30">//</span>
                        <span className="macro-header__meta-text opacity-30">ID: {atomId}</span>
                        {isLive && (
                            <span className="macro-header__live-badge">{t('status_live')}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── LADO B: COMANDOS (Clean & Agnostic) ── */}
            <div className="macro-header__controls">
                
                {/* ── THE MINI HOOD (Global Kinetics) ── */}
                <div className="macro-header__mini-hood shelf--tight">
                    <button 
                        className="btn btn--ghost btn--mini"
                        style={{ padding: '0 8px', height: '22px' }}
                        onClick={handleThemeToggle}
                        title={t('ui_theme_selection')}
                    >
                        <IndraIcon name="EYE" size="10px" />
                        <span style={{ fontSize: '8px', marginLeft: '4px' }}>{t('ui_theme')}</span>
                    </button>
                    
                    <button 
                        className="btn btn--ghost btn--mini"
                        style={{ padding: '0 8px', height: '22px' }}
                        onClick={() => setIsStyleEngineOpen(true)}
                        title={t('ui_style_engine')}
                    >
                        <IndraIcon name="LAYERS" size="10px" />
                        <span style={{ fontSize: '8px', marginLeft: '4px' }}>{t('ui_style_engine')}</span>
                    </button>
                </div>
                
                <div className="macro-header__divider" />

                {rightSlot}

                {/* EXIT */}
                <div className="macro-header__divider" />
                <IndraActionTrigger
                    icon="MINUS"
                    label={t('action_back')}
                    onClick={onClose}
                    color="var(--color-text-secondary)"
                    activeColor="var(--indra-dynamic-accent, var(--color-accent))"
                    size="13px"
                />

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

