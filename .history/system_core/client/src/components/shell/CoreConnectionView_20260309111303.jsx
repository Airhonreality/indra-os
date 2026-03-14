import React, { useState } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';

/**
 * CoreConnectionView (Nivel 0)
 * Permite vincular una instancia de Google Apps Script (Core).
 */
export function CoreConnectionView() {
    const setCoreConnection = useAppState((s) => s.setCoreConnection);
    const isConnecting = useAppState((s) => s.isConnecting);
    const systemError = useAppState((s) => s.error);
    const clearError = useAppState((s) => s.clearError);

    // Cargar persistencia del Link desde localStorage
    const [alias, setAlias] = useState(() => localStorage.getItem('indra_core_alias') || '');
    const [url, setUrl] = useState(() => localStorage.getItem('indra_core_url') || '');
    const [password, setPassword] = useState('');

    const onInputChange = (setter, storageKey) => (e) => {
        const value = e.target.value;
        setter(value);
        if (storageKey) localStorage.setItem(storageKey, value);
        if (systemError) clearError();
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!url || !password) return;
        try {
            // Asegurar persistencia al momento de conectar
            localStorage.setItem('indra_core_alias', alias);
            localStorage.setItem('indra_core_url', url);
            await setCoreConnection(url, password);
        } catch (err) {
            console.error('Connection failed:', err);
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
                        }}>INDRA_CORE</h1>
                        <div className="shelf">
                            <span className="text-label" style={{ color: 'var(--color-accent)' }}>SYSTEM_AWAKENING</span>
                            <div className="hud-line" style={{ width: '200px' }}></div>
                            <span className="text-hint" style={{ fontSize: '9px' }}>MOD_V2.0.4</span>
                        </div>
                    </div>
                </div>

                {/* ── SECCIÓN CENTRAL: GRID DE CONFIGURACIÓN ── */}
                <form onSubmit={handleConnect} className="stack" style={{ gap: 'var(--space-6)' }}>

                    {/* Item 01: Identificador */}
                    <div className="grid-split">
                        <div className="stack--tight">
                            <label className="text-label">01 // IDENTITY</label>
                            <p className="text-hint" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                Nombre técnico para esta instancia en su memoria local.
                            </p>
                        </div>
                        <div className="slot-small glass-light">
                            <input
                                className="input-base"
                                style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)' }}
                                placeholder="PRIMARY_INTERFACE_ID"
                                value={alias}
                                onChange={onInputChange(setAlias, 'indra_core_alias')}
                            />
                        </div>
                    </div>

                    {/* Item 02: Endpoint */}
                    <div className="grid-split">
                        <div className="stack--tight">
                            <label className="text-label">02 // BASE_RESONANCE</label>
                            <p className="text-hint" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                URL del despliegue de Google Apps Script.
                            </p>
                        </div>
                        <div className="slot-small glass-light">
                            <input
                                className="input-base"
                                style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'var(--font-mono)' }}
                                placeholder="https://script.google.com/macros/s/..."
                                required
                                value={url}
                                onChange={onInputChange(setUrl, 'indra_core_url')}
                            />
                        </div>
                    </div>

                    {/* Item 03: Access Secret */}
                    <div className="grid-split">
                        <div className="stack--tight">
                            <label className="text-label">03 // SOBERANO_KEY</label>
                            <p className="text-hint" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                Credencial AES de acceso al núcleo sistémico.
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

                    {/* ── FOOTER DE ACCIÓN SOFISTICADA ── */}
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
                                    gap: 'var(--space-3)',
                                    animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both'
                                }}>
                                    <div style={{ padding: '2px', background: 'var(--color-warm)', borderRadius: '1px', display: 'flex' }}>
                                        <IndraIcon name="PLUS" size="10px" style={{ transform: 'rotate(45deg)', color: 'black' }} />
                                    </div>
                                    <div className="stack--tight">
                                        <span style={{ fontWeight: 'bold', letterSpacing: '0.1em' }}>ACCESS_DENIED // INFRA_FAILURE</span>
                                        <span style={{ opacity: 0.7 }}>{`CODE: ${systemError.toUpperCase()}`}</span>
                                    </div>
                                </div>
                            )}
                            <span className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                {`[ ENCRYPTED_TUNNEL: ${isConnecting ? 'ESTABLISHING' : 'INACTIVE'} ]`}
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
                                letterSpacing: '0.2em',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'rgba(255,255,255,0.3)' }}></div>
                            <span className="shelf">
                                {isConnecting ? (
                                    <IndraIcon name="SYNC" style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <IndraIcon name="LINK" />
                                )}
                                {isConnecting ? 'LINKING...' : 'INITIATE_CORE_LINK'}
                            </span>
                        </button>
                    </div>
                </form>

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
