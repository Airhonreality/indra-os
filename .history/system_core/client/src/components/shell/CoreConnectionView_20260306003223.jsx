import React, { useState } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';

/**
 * CoreConnectionView (Nivel 0)
 * Permite vincular una instancia de Google Apps Script (Core).
 */
export function CoreConnectionView() {
    const setCoreConnection = useAppState((s) => s.setCoreConnection);
    const [alias, setAlias] = useState('');
    const [url, setUrl] = useState('');
    const [password, setPassword] = useState('');

    const handleConnect = (e) => {
        e.preventDefault();
        if (!url || !password) return;

        // Conexión lógica — los protocolos del core esperan 'password'
        setCoreConnection(url, password);
    };

    return (
        <div className="fill center">
            <div className="slot-large glass" style={{ width: '450px', position: 'relative', overflow: 'hidden' }}>

                {/* Adornos HUD (Esquinas técnicas) */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: '2px solid var(--color-accent)', borderLeft: '2px solid var(--color-accent)', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '2px solid var(--color-accent)', borderRight: '2px solid var(--color-accent)', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: '2px solid var(--color-accent)', borderLeft: '2px solid var(--color-accent)', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: '2px solid var(--color-accent)', borderRight: '2px solid var(--color-accent)', opacity: 0.5 }}></div>

                {/* Header */}
                <div className="stack center" style={{ paddingBottom: 'var(--space-6)' }}>
                    <div style={{
                        position: 'relative',
                        filter: 'drop-shadow(0 0 15px var(--color-accent-glow))'
                    }}>
                        <IndraIcon name="ATOM" size="80px" style={{ color: 'var(--color-accent)' }} />
                        {/* Anillo de pulso HUD */}
                        <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            width: '100px', height: '100px',
                            border: '1px solid var(--color-accent-dim)',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)',
                            animation: 'pulse 3s infinite'
                        }}></div>
                    </div>

                    <h1 style={{
                        marginTop: 'var(--space-4)',
                        fontSize: 'var(--text-xl)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 'var(--font-bold)',
                        letterSpacing: '0.3em',
                        color: 'var(--color-text-primary)'
                    }}>
                        INDRA_CORE
                    </h1>
                    <div className="shelf" style={{ gap: 'var(--space-2)' }}>
                        <div style={{ width: '40px', height: '1px', background: 'var(--color-accent)', opacity: 0.3 }}></div>
                        <span className="text-label" style={{ color: 'var(--color-accent)', fontSize: '9px' }}>LINK_ESTABLISHMENT</span>
                        <div style={{ width: '40px', height: '1px', background: 'var(--color-accent)', opacity: 0.3 }}></div>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleConnect} className="stack" style={{ gap: 'var(--space-5)' }}>
                    <div className="stack--tight">
                        <div className="spread">
                            <label className="text-label">01 // IDENTIFICADOR</label>
                            <span className="text-hint" style={{ fontSize: '8px' }}>[OPTIONAL_ALIAS]</span>
                        </div>
                        <input
                            className="input-base"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
                            placeholder="PRIMARY_CORE"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                        />
                    </div>

                    <div className="stack--tight">
                        <div className="spread">
                            <label className="text-label">02 // CORE_ENDPOINT</label>
                            <span className="text-hint" style={{ fontSize: '8px' }}>[GAS_WEBAPP_URL]</span>
                        </div>
                        <input
                            className="input-base"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
                            placeholder="https://script.google.com/..."
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    <div className="stack--tight">
                        <div className="spread">
                            <label className="text-label">03 // ACCESS_SECRET</label>
                            <span className="text-hint" style={{ fontSize: '8px' }}>[SECURITY_TOKEN]</span>
                        </div>
                        <input
                            className="input-base"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
                            type="password"
                            placeholder="••••••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div style={{ marginTop: 'var(--space-2)' }}>
                        <button type="submit" className="btn btn--accent btn--full" style={{ padding: 'var(--space-4)', letterSpacing: '0.1em' }}>
                            <IndraIcon name="SYNC" style={{ animation: 'spin 4s linear infinite' }} />
                            INIT_CORE_RESONANCE
                        </button>
                    </div>
                </form>

                {/* Footer Técnico */}
                <div className="spread" style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <span className="text-hint" style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                        STATUS: WAITING_AUTH
                    </span>
                    <span className="text-hint" style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                        AUTH_MODE: SOBERANO
                    </span>
                </div>
            </div>

            {/* Estilos inline para animaciones de HUD */}
            <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
