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
    const isConnecting = useAppState((s) => s.isConnecting);
    const coreId = useAppState((s) => s.coreId);
    const systemError = useAppState((s) => s.error);
    const clearError = useAppState((s) => s.clearError);

    // Estado de la Bóveda Local
    const coreRegistry = useAppState((s) => s.coreRegistry);
    const removeCore = useAppState((s) => s.removeCoreFromRegistry);
    const [viewMode, setViewMode] = useState(coreRegistry.length > 0 ? 'EXISTING' : 'NEW');

    const [alias, setAlias] = useState('');
    const [url, setUrl] = useState('');
    const [password, setPassword] = useState('');

    const onInputChange = (setter) => (e) => {
        setter(e.target.value);
        if (systemError) clearError();
    };

    const handleConnect = async (e) => {
        if (e) e.preventDefault();
        if (!url || !password) return;
        try {
            await setCoreConnection(url, password, alias);
        } catch (err) {
            console.error('Connection failed:', err);
        }
    };

    const handleQuickConnect = async (core) => {
        try {
            await setCoreConnection(core.url, core.secret, core.alias);
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
                            <span className="text-hint" style={{ fontSize: '9px' }}>MOD_V2.0.4</span>
                        </div>
                    </div>
                </div>

                {/* ── SELECTOR DE MODO (TABS) ── */}
                <div className="shelf" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-2)' }}>
                    <button 
                        className={`btn btn--mini ${viewMode === 'EXISTING' ? 'btn--accent' : 'btn--ghost'}`}
                        onClick={() => setViewMode('EXISTING')}
                        style={{ borderBottom: viewMode === 'EXISTING' ? '2px solid var(--color-accent)' : 'none', borderRadius: 0 }}
                    >
                        BÓVEDA_EXISTENTE [{coreRegistry.length}]
                    </button>
                    <button 
                        className={`btn btn--mini ${viewMode === 'NEW' ? 'btn--accent' : 'btn--ghost'}`}
                        onClick={() => setViewMode('NEW')}
                        style={{ borderBottom: viewMode === 'NEW' ? '2px solid var(--color-accent)' : 'none', borderRadius: 0 }}
                    >
                        VÍNCULO_NUEVO
                    </button>
                </div>

                {viewMode === 'EXISTING' ? (
                    <div className="stack" style={{ gap: 'var(--space-4)', maxHeight: '300px', overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
                        {coreRegistry.map(core => (
                            <div key={core.url} className="glass-light shelf--loose pointer ripple" 
                                style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                onClick={() => handleQuickConnect(core)}
                            >
                                <div className="stack--tight fill">
                                    <div className="shelf">
                                        <span className="text-label" style={{ color: 'var(--color-accent)' }}>{core.alias}</span>
                                        <div className="hud-line" style={{ width: '40px' }}></div>
                                        <span className="text-hint" style={{ fontSize: '9px' }}>{core.coreId}</span>
                                    </div>
                                    <span className="text-hint opacity-40" style={{ fontSize: '10px' }}>{core.url}</span>
                                </div>
                                    <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                                        <IndraActionTrigger 
                                            variant="destructive"
                                            label="PURGAR"
                                            onClick={() => removeCore(core.url)}
                                            size="14px"
                                        />
                                        <button className="btn btn--accent btn--mini">VINCULAR</button>
                                    </div>
                            </div>
                        ))}

                        {/* Botón para saltar a Vínculo Nuevo */}
                        <button 
                            className="btn btn--ghost btn--full" 
                            style={{ borderStyle: 'dashed', marginTop: 'var(--space-2)' }}
                            onClick={() => setViewMode('NEW')}
                        >
                            <IndraIcon name="PLUS" size="14px" />
                            AÑADIR_NUEVO_NÚCLEO
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleConnect} className="stack" style={{ gap: 'var(--space-6)' }}>
                        {/* Item 01: Identificador */}
                        <div className="grid-split">
                            <div className="stack--tight">
                                <label className="text-label">{t('ui_identity_config')}</label>
                                <p className="text-hint" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                    {t('ui_identity_desc')}
                                </p>
                            </div>
                            <div className="slot-small glass-light">
                                <input
                                    className="input-base"
                                    style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)' }}
                                    placeholder={t('ui_identity_placeholder')}
                                    required
                                    value={alias}
                                    onChange={onInputChange(setAlias)}
                                />
                            </div>
                        </div>

                        {/* Item 02: Endpoint */}
                        <div className="grid-split">
                            <div className="stack--tight">
                                <label className="text-label">{t('ui_resonance_config')}</label>
                                <p className="text-hint" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                    {t('ui_resonance_desc')}
                                </p>
                            </div>
                            <div className="slot-small glass-light">
                                <input
                                    className="input-base"
                                    style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)' }}
                                    placeholder="https://script.google.com/macros/s/..."
                                    required
                                    value={url}
                                    onChange={onInputChange(setUrl)}
                                />
                            </div>
                        </div>

                        {/* Item 03: Access Secret */}
                        <div className="grid-split">
                            <div className="stack--tight">
                                <label className="text-label">{t('ui_secret_config')}</label>
                                <p className="text-hint" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                    {t('ui_secret_desc')}
                                </p>
                            </div>
                            <div className="slot-small glass-light">
                                <input
                                    className="input-base"
                                    type="password"
                                    style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)' }}
                                    placeholder="••••••••••••••••"
                                    required
                                    value={password}
                                    onChange={onInputChange(setPassword)}
                                />
                            </div>
                        </div>
                        
                        <div className="spread" style={{ marginTop: 'var(--space-4)', alignItems: 'flex-end' }}>
                            <div className="stack--tight">
                                {systemError && (
                                    <div className="text-warm shelf" style={{
                                        fontSize: '10px',
                                        fontFamily: 'var(--font-mono)',
                                        marginBottom: 'var(--space-2)',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderLeft: '4px solid var(--color-warm)',
                                        borderRadius: '0 2px 2px 0',
                                        gap: 'var(--space-3)'
                                    }}>
                                        <div className="stack--tight">
                                            <span style={{ fontWeight: 'bold', letterSpacing: '0.1em' }}>ACCESS_DENIED // INFRA_FAILURE</span>
                                            <span style={{ opacity: 0.7 }}>{`CODE: ${systemError.toUpperCase()}`}</span>
                                        </div>
                                    </div>
                                )}
                                <span className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                    {`[ ${t('status_encrypted')}: ${isConnecting ? t('status_establishing') : t('status_inactive')} ]`}
                                </span>
                                <span className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                                    {`[ ID_SOBERANO: ${coreId || 'CAPTURA_PENDIENTE'} ]`}
                                </span>
                                <span className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>[ PROTOCOL: UQO_V4.1 ]</span>
                            </div>

                            <button
                                type="submit"
                                className={`btn ${isConnecting ? 'btn--ghost' : 'btn--accent'}`}
                                disabled={isConnecting}
                                style={{
                                    padding: 'var(--space-4) var(--space-8)',
                                    borderRadius: '0 var(--radius-lg) 0 var(--radius-lg)',
                                    fontSize: 'var(--text-sm)',
                                    letterSpacing: '0.2em'
                                }}
                            >
                                <span className="shelf">
                                    {isConnecting ? (
                                        <IndraIcon name="SYNC" style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <IndraIcon name="LINK" />
                                    )}
                                    {isConnecting ? t('status_loading') : t('ui_connect_action')}
                                </span>
                            </button>
                        </div>
                    </form>
                )}

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
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .input-base::placeholder {
                    opacity: 0.3;
                    color: var(--color-accent);
                }
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    filter: grayscale(1);
                }
            `}</style>
        </div>
    );
}
