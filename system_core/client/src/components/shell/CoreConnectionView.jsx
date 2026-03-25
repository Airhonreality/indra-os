import React, { useState } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useLexicon } from '../../services/lexicon';

/**
 * CoreConnectionView (v4.0 - Soberanía Directa)
 * Puerta de entrada al sistema. Gestiona el login con Google, 
 * el autodescubrimiento y la instalación automática.
 */
export function CoreConnectionView() {
    const t = useLexicon();
    
    // Estado Global (Indra v4.0)
    const { 
        loginWithGoogle, 
        installNewCore, 
        googleUser, 
        isConnecting, 
        coreStatus, 
        error: systemError, 
        clearError,
        coreRegistry,
        setCoreConnection,
        removeCore,
        resetConnectionState,
        installStatus
    } = useAppState();

    const [showLegacy, setShowLegacy] = useState(false);
    const [url, setUrl] = useState('');

    const handleLegacyConnect = async (e) => {
        if (e) e.preventDefault();
        try {
            await setCoreConnection(url, null);
        } catch (err) {
            console.error('[LegacyConnect] Failed:', err);
        }
    };

    return (
        <div className="fill center" style={{ background: 'var(--color-bg-deep)' }}>
            <div className="glass" style={{
                width: '600px',
                padding: 'var(--space-10)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-8)',
                textAlign: 'center',
                boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                
                {/* ── SECCIÓN SUPERIOR: IDENTIDAD ── */}
                <div className="stack" style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{ position: 'relative' }}>
                        <IndraIcon name="ATOM" size="80px" style={{ color: 'var(--color-accent)', filter: 'drop-shadow(0 0 25px var(--color-accent-glow))' }} />
                        <div className="pulse-ring"></div>
                    </div>
                    <div className="stack--tight">
                        <h1 style={{
                            fontSize: '38px',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.5em',
                            margin: 0,
                            color: 'var(--color-text-primary)'
                        }}>INDRA</h1>
                        <span className="text-label" style={{ opacity: 0.5, letterSpacing: '0.2em', fontSize: '10px' }}>
                            SISTEMA OPERATIVO MICELAR
                        </span>
                    </div>
                </div>

                {/* ── CUERPO CENTRAL: FLUJOS DE ACCESO ── */}
                <div className="stack" style={{ gap: 'var(--space-8)' }}>
                    
                    {!googleUser && !isConnecting && (
                        <div className="stack" style={{ gap: 'var(--space-6)' }}>
                            <p className="text-hint" style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.7 }}>
                                Entra a tu realidad soberna. Tus datos, tu motor y tu identidad <br /> 
                                residen en tu propio ecosistema de Google con total privacidad.
                            </p>
                            
                            <button 
                                className="btn btn--accent ripple" 
                                onClick={loginWithGoogle}
                                style={{ 
                                    padding: '16px 40px', 
                                    fontSize: '14px', 
                                    fontWeight: '900', 
                                    borderRadius: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    margin: '0 auto',
                                    boxShadow: '0 10px 30px var(--color-accent-glow)'
                                }}
                            >
                                <IndraIcon name="GOOGLE" size="20px" />
                                ENTRAR A INDRA
                            </button>
                        </div>
                    )}

                    {isConnecting && (
                        <div className="stack" style={{ gap: 'var(--space-6)', alignItems: 'center' }}>
                            <div className="loader-ring"></div>
                            {installStatus?.step ? (
                                <div className="stack--tight" style={{ width: '100%', maxWidth: '440px' }}>
                                    <span className="text-label" style={{ color: 'var(--color-accent)', animation: 'fade 1.5s infinite', fontWeight: 'bold' }}>
                                        {installStatus.step.includes('Génesis Interrumpido') ? 'GÉNESIS INTERRUMPIDO' : `IGNICIÓN EN CURSO: ${installStatus.progress}%`}
                                    </span>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div style={{ width: `${installStatus.progress}%`, height: '100%', background: installStatus.step.includes('Génesis Interrumpido') ? 'var(--color-warm)' : 'var(--color-accent)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: `0 0 10px ${installStatus.step.includes('Génesis Interrumpido') ? 'var(--color-warm)' : 'var(--color-accent)'}` }} />
                                    </div>
                                    <p className="text-hint" style={{ fontSize: '11px', marginTop: '16px', lineHeight: '1.5', minHeight: '3em' }}>
                                        {installStatus.step}
                                    </p>

                                    {installStatus.step.includes('Génesis Interrumpido') && (
                                        <div className="stack" style={{ marginTop: 'var(--space-4)', alignItems: 'center' }}>
                                            <a 
                                                href="https://script.google.com/home/usersettings" 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="btn btn--accent ripple"
                                                style={{ 
                                                    padding: '12px 24px', 
                                                    fontSize: '12px', 
                                                    borderRadius: '30px',
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <IndraIcon name="EXTERNAL" size="16px" />
                                                ACTIVAR APPS SCRIPT API
                                            </a>
                                            <span className="text-hint" style={{ fontSize: '9px', marginTop: '8px', opacity: 0.6 }}>
                                                Indra detectará el cambio automáticamente y reanudará la ignición.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-label" style={{ color: 'var(--color-accent)', animation: 'fade 1.5s infinite' }}>
                                    BUSCANDO TU NÚCLEO EN GOOGLE DRIVE...
                                </span>
                            )}
                        </div>
                    )}

                    {googleUser && !isConnecting && !coreStatus && (
                        <div className="glass-light stack" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="shelf" style={{ justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                                <img src={googleUser.picture} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-accent)' }} alt="User" />
                                <div className="stack--tight" style={{ textAlign: 'left' }}>
                                    <span className="text-label">{googleUser.name}</span>
                                    <span className="text-hint" style={{ fontSize: '10px' }}>{googleUser.email}</span>
                                </div>
                            </div>
                            
                            {systemError === 'PREVIOUS_INSTALLATION_FILES_MISSING' ? (
                                <div className="stack" style={{ gap: 'var(--space-4)' }}>
                                    <p className="text-hint" style={{ marginBottom: 'var(--space-4)', color: 'var(--color-danger)', fontWeight: 'bold' }}>
                                        ATENCIÓN: Se han encontrado restos de una instalación <br />
                                        previa que ha sido borrada o movida manualmente.
                                    </p>
                                    <button 
                                        className="btn btn--danger"
                                        onClick={() => useAppState.getState().purgePreviousInstall(useAppState.getState().manifestId)}
                                        style={{ padding: '12px 30px', fontWeight: 'bold' }}
                                    >
                                        LIMPIAR Y REINSTALAR (GENESIS)
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-hint" style={{ marginBottom: 'var(--space-6)' }}>
                                        No hemos encontrado un núcleo en tu Drive. <br />
                                        ¿Deseas forjar uno nuevo para esta identidad?
                                    </p>

                                    <button 
                                        className="btn btn--accent"
                                        onClick={installNewCore}
                                        style={{ padding: '12px 30px', fontWeight: 'bold' }}
                                    >
                                        INICIAR INSTALACIÓN (IGNICIÓN)
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── FOOTER: LEGACY & MULTI-CORE ── */}
                <div className="stack" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                    <button 
                        className="btn btn--ghost btn--mini" 
                        onClick={() => setShowLegacy(!showLegacy)}
                        style={{ opacity: 0.3, fontSize: '9px' }}
                    >
                        {showLegacy ? 'OCULTAR ACCESO MANUAL' : 'CONFIGURACIÓN AVANZADA (LEGACY)'}
                    </button>

                    {showLegacy && (
                        <div className="stack" style={{ gap: 'var(--space-6)' }}>
                            <div className="stack--tight">
                                <span className="text-hint" style={{ fontSize: '9px', color: 'var(--color-warn)' }}>HERRAMIENTAS DE SANEAMIENTO</span>
                                <button 
                                    className="btn btn--danger btn--mini" 
                                    onClick={() => useAppState.getState().purgePreviousInstall(null)}
                                    style={{ width: '100%', marginTop: '4px', fontSize: '9px' }}
                                >
                                    EXORCISMO: LIMPIAR ZONA FANTASMA (DRIVE APPDATA)
                                </button>
                                <p className="text-hint" style={{ fontSize: '8px', opacity: 0.5, marginTop: '4px' }}>
                                    Usa esto si Indra sigue encontrando "ruinas" o errores de conflicto tras borrar la carpeta .core_system.
                                </p>
                            </div>

                            {coreRegistry.length > 0 && (
                                <div className="stack--tight" style={{ textAlign: 'left' }}>
                                    <span className="text-hint" style={{ fontSize: '9px' }}>BÓVEDA DE REALIDADES REGISTRADAS</span>
                                    {coreRegistry.map(core => (
                                        <div key={core.url} className="shelf glass-light ripple" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: '4px' }} onClick={() => setCoreConnection(core.url, core.secret)}>
                                            <IndraIcon name="CORE" size="14px" style={{ color: 'var(--color-accent)' }} />
                                            <span style={{ fontSize: '11px', flex: 1 }}>{core.handle?.label}</span>
                                            <IndraActionTrigger variant="destructive" size="12px" onClick={(e) => { e.stopPropagation(); removeCore(core.url); }} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleLegacyConnect} className="stack--tight">
                                <input 
                                    className="input-base glass-light" 
                                    placeholder="URL del Core (Web App)..."
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    style={{ padding: '10px', width: '100%', borderRadius: '4px', fontSize: '10px' }}
                                />
                                <button type="submit" className="btn btn--accent btn--mini" style={{ width: '100%', marginTop: '8px' }}>CONECTAR MANUALMENTE</button>
                            </form>
                        </div>
                    )}
                </div>

                {systemError && (
                    <div className="text-warm glass-light" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-warm)', fontSize: '11px' }}>
                        <IndraIcon name="ALERT" size="14px" /> {systemError}
                        <button onClick={clearError} style={{ marginLeft: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>×</button>
                    </div>
                )}
            </div>

            <style>{`
                .pulse-ring {
                    position: absolute;
                    top: 50%; left: 50%;
                    width: 120px; height: 120px;
                    border: 1px solid var(--color-accent);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0.3;
                    animation: pulse 3s infinite;
                }
                .loader-ring {
                    width: 40px; height: 40px;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-top: 2px solid var(--color-accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes pulse {
                    0% { width: 80px; height: 80px; opacity: 0.5; }
                    100% { width: 140px; height: 140px; opacity: 0; }
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fade { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
            `}</style>
        </div>
    );
}
