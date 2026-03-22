import React, { useState } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useLexicon } from '../../services/lexicon';

/**
 * CoreConnectionView (Nivel 0)
 * Permite vincular una instancia de Google Apps Script (Core).
 */
export function CoreConnectionView() {
    const t = useLexicon();
    const setCoreConnection = useAppState((s) => s.setCoreConnection);
    const discoverCore = useAppState((s) => s.discoverCore);
    const setupCore = useAppState((s) => s.setupCore);
    const isConnecting = useAppState((s) => s.isConnecting);
    const coreStatus = useAppState((s) => s.coreStatus);
    const resetConnectionState = useAppState((s) => s.resetConnectionState);
    const coreId = useAppState((s) => s.coreId);
    const systemError = useAppState((s) => s.error);
    const clearError = useAppState((s) => s.clearError);

    // Estado de la Bóveda Local
    const coreRegistry = useAppState((s) => s.coreRegistry);
    const removeCore = useAppState((s) => s.removeCoreFromRegistry);

    const [url, setUrl] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(null);

    const onInputChange = (setter) => (e) => {
        setter(e.target.value);
        if (systemError) clearError();
        if (localError) setLocalError(null);
    };

    const handleAction = async (e) => {
        if (e) e.preventDefault();
        setLocalError(null);

        if (!coreStatus) {
            if (!url) return;
            try { await discoverCore(url); } catch (err) { /* handled by app_state */ }
            return;
        }

        if (coreStatus === 'STABLE') {
            if (!password) { setLocalError('Ingresa la contraseña maestra.'); return; }
            try { await setCoreConnection(url, password); } catch (err) { }
        }

        if (coreStatus === 'BOOTSTRAP') {
            if (!password || password.length < 4) { setLocalError('Contraseña muy corta.'); return; }
            if (password !== confirmPassword) { setLocalError('Las contraseñas no coinciden.'); return; }
            try { await setupCore(url, password); } catch (err) { }
        }
    };

    const handleQuickConnect = async (core) => {
        try {
            await setCoreConnection(core.url, core.secret);
        } catch (err) {
            console.error('Quick connection failed:', err);
        }
    };

    return (
        <div className="fill center">
            {/* Contenedor Principal Asimétrico */}
            <div className="glass" style={{
                width: '780px',
                padding: 'var(--space-8)',
                borderRadius: 'var(--radius-xl)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-8)'
            }}>

                {/* ── SECCIÓN SUPERIOR: IDENTIDAD DIAGRAMÁTICA ── */}
                <div className="shelf" style={{ gap: 'var(--space-6)', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative' }}>
                        <IndraIcon name="ATOM" size="100px" style={{ color: 'var(--color-accent)', filter: 'drop-shadow(0 0 20px var(--color-accent-glow))' }} />
                        <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            width: '120px', height: '120px',
                            border: '1px dashed var(--color-accent)',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)',
                            opacity: 0.2,
                            animation: 'spin 20s linear infinite'
                        }}></div>
                    </div>

                    <div className="stack--tight" style={{ paddingTop: 'var(--space-3)' }}>
                        <h1 style={{
                            fontSize: '32px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'var(--font-bold)',
                            letterSpacing: '0.4em',
                            margin: 0
                        }}>{t('ui_system_id')}</h1>
                        <div className="shelf">
                            <span className="text-label" style={{ color: 'var(--color-accent)' }}>{t('ui_system_awakening')}</span>
                            <div className="hud-line" style={{ width: '200px' }}></div>
                        </div>
                    </div>
                </div>
                              <div className="core-selector-main-layout" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-10)',
                    maxHeight: '540px',
                    overflowY: 'auto',
                    paddingRight: 'var(--space-4)'
                }}>
                    
                    {/* ── SECCIÓN 01: BÓVEDA DE REALIDADES (Tree View) ── */}
                    {coreRegistry.length > 0 && (
                        <div className="tree-section">
                            <header className="shelf" style={{ marginBottom: 'var(--space-4)', opacity: 0.4 }}>
                                <IndraIcon name="VAULT" size="12px" />
                                <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                    BÓVEDA_REGISTRADA [{coreRegistry.length}]
                                </span>
                            </header>

                            <div className="tree-container stack" style={{ 
                                paddingLeft: 'var(--space-3)', 
                                borderLeft: '1px solid rgba(255,255,255,0.05)',
                                marginLeft: '8px',
                                gap: 'var(--space-3)'
                            }}>
                                {coreRegistry.map((core) => (
                                    <div key={core.url} className="tree-item glass-light shelf ripple" 
                                        style={{ 
                                            padding: 'var(--space-3) var(--space-4)', 
                                            borderRadius: 'var(--radius-md)', 
                                            border: '1px solid var(--color-border-dim)',
                                            position: 'relative',
                                            justifyContent: 'space-between'
                                        }}
                                        onClick={() => handleQuickConnect(core)}
                                    >
                                        <div className="item-connector" style={{
                                            position: 'absolute', left: '-13px', top: '50%',
                                            width: '12px', height: '1px', background: 'rgba(255,255,255,0.05)'
                                        }} />
                                        
                                        <div className="shelf--loose" style={{ flex: 1, minWidth: 0 }}>
                                            <IndraIcon name="CORE" size="18px" style={{ opacity: 0.5, color: 'var(--color-accent)' }} />
                                            <div className="stack--tight" style={{ minWidth: 0 }}>
                                                <span className="text-label" style={{ 
                                                    color: 'var(--color-text-primary)', 
                                                    fontSize: '11px', 
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {core.handle?.label || core.alias}
                                                </span>
                                                <span className="text-hint" style={{ fontSize: '9px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>
                                                    {core.url.substring(0, 60)}...
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                                            <IndraActionTrigger 
                                                variant="destructive"
                                                onClick={() => removeCore(core.url)}
                                                size="14px"
                                            />
                                            <button className="btn btn--accent btn--mini" style={{ padding: '4px 12px', fontSize: '9px' }}>
                                                VINCULAR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── SECCIÓN 02: NUEVO ENLACE (Formulario Integrado) ── */}
                    <div className="form-section">
                        <header className="shelf" style={{ marginBottom: 'var(--space-4)', opacity: coreRegistry.length > 0 ? 0.4 : 1 }}>
                            <IndraIcon name="PLUS" size="12px" />
                            <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                VINCULAR_NUEVO_NÚCLEO
                            </span>
                        </header>

                        <form onSubmit={handleAction} className="glass-light stack" style={{ 
                            padding: 'var(--space-6)', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border-dim)',
                            gap: 'var(--space-6)'
                        }}>
                            <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'center' }}>
                                <div className="stack--tight">
                                    <label className="text-label" style={{ fontSize: '10px' }}>{t('ui_resonance_config')}</label>
                                    <p className="text-hint" style={{ fontSize: '9px', opacity: 0.4 }}>URL base de tu Google Apps Script desplegado como Web App.</p>
                                </div>
                                <div className="slot-small glass-light shelf" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)' }}>
                                    <input
                                        className="input-base"
                                        style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent)' }}
                                        placeholder="https://script.google.com/macros/s/..."
                                        required
                                        value={url}
                                        onChange={onInputChange(setUrl)}
                                        readOnly={!!coreStatus}
                                        disabled={!!coreStatus}
                                    />
                                    {coreStatus && (
                                        <button type="button" onClick={() => { resetConnectionState(); setUrl(''); setPassword(''); setConfirmPassword(''); }} className="btn btn--ghost btn--mini" style={{ marginLeft: '10px' }}>
                                            <IndraIcon name="CANCEL" size="12px" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {coreStatus === 'STABLE' && (
                                <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'center' }}>
                                    <div className="stack--tight">
                                        <label className="text-label" style={{ fontSize: '10px' }}>Contraseña Maestra</label>
                                        <p className="text-hint" style={{ fontSize: '9px', opacity: 0.4 }}>El núcleo ya está configurado. Ingresa tu clave para acceder.</p>
                                    </div>
                                    <div className="slot-small glass-light" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)' }}>
                                        <input
                                            className="input-base"
                                            type="password"
                                            style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                                            placeholder="••••••••••••••••"
                                            required
                                            value={password}
                                            onChange={onInputChange(setPassword)}
                                        />
                                    </div>
                                </div>
                            )}

                            {coreStatus === 'BOOTSTRAP' && (
                                <>
                                    <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'center' }}>
                                        <div className="stack--tight">
                                            <label className="text-label" style={{ fontSize: '10px', color: 'var(--color-accent)' }}>Crear Contraseña Maestra</label>
                                            <p className="text-hint" style={{ fontSize: '9px', opacity: 0.4 }}>El núcleo es virgen. Define la clave de acceso único.</p>
                                        </div>
                                        <div className="slot-small glass-light" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)' }}>
                                            <input
                                                className="input-base"
                                                type="password"
                                                style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                                                placeholder="Crea una contraseña segura"
                                                required
                                                value={password}
                                                onChange={onInputChange(setPassword)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'center' }}>
                                        <div className="stack--tight">
                                            <label className="text-label" style={{ fontSize: '10px' }}>Confirmar Contraseña</label>
                                        </div>
                                        <div className="slot-small glass-light" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)' }}>
                                            <input
                                                className="input-base"
                                                type="password"
                                                style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                                                placeholder="Repite la contraseña"
                                                required
                                                value={confirmPassword}
                                                onChange={onInputChange(setConfirmPassword)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="spread" style={{ alignItems: 'flex-end', paddingTop: 'var(--space-2)' }}>
                                <div className="stack--tight">
                                    {(systemError || localError) && (
                                        <div className="text-warm shelf" style={{
                                            fontSize: '9px', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-2)',
                                            background: 'rgba(239, 68, 68, 0.05)', padding: 'var(--space-2) var(--space-4)',
                                            borderLeft: '3px solid var(--color-warm)', borderRadius: '2px'
                                        }}>
                                            <span style={{ fontWeight: 'bold' }}>ADUANA_BLOCK // {(localError || systemError).toUpperCase()}</span>
                                        </div>
                                    )}
                                    <div className="shelf--tight" style={{ opacity: 0.4 }}>
                                        <span className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                            [ {isConnecting ? (coreStatus ? 'SYNCING_WITH_CORE...' : 'SCANNING_RESONANCE...') : 'AWAITING_INPUT'} ]
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={`btn ${isConnecting ? 'btn--ghost' : 'btn--accent'}`}
                                    disabled={isConnecting}
                                    style={{ padding: '10px 30px', borderRadius: '4px', fontSize: '10px', letterSpacing: '0.15em', fontWeight: 'bold' }}
                                >
                                    {isConnecting 
                                        ? 'PROCESANDO...' 
                                        : !coreStatus 
                                            ? 'DESCUBRIR NÚCLEO' 
                                            : coreStatus === 'BOOTSTRAP' 
                                                ? 'INICIALIZAR NÚCLEO' 
                                                : 'INGRESAR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Adornos HUD Minimalistas */}
                <div style={{ position: 'absolute', bottom: 'var(--space-4)', left: 'var(--space-8)', opacity: 0.3 }}>
                    <div className="shelf" style={{ gap: 'var(--space-1)' }}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} style={{ width: '4px', height: '4px', background: 'var(--color-accent)', borderRadius: '1px' }}></div>
                        ))}
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .input-base::placeholder { opacity: 0.2; color: var(--color-text-primary); }
                .tree-item { transition: all 0.2s ease; cursor: pointer; }
                .tree-item:hover { border-color: var(--color-accent); transform: translateX(4px); background: rgba(255,255,255,0.03); }
                .core-selector-main-layout::-webkit-scrollbar { width: 4px; }
                .core-selector-main-layout::-webkit-scrollbar-thumb { background: var(--color-border); borderRadius: 4px; }
            `}</style>
        </div>
    );
}
