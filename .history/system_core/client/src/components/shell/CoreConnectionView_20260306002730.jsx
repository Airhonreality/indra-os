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
    const [token, setToken] = useState('');

    const handleConnect = (e) => {
        e.preventDefault();
        if (!url || !token) return;

        // Aquí iría la validación real con el directive_executor
        // Por ahora, establecemos la conexión para testear la UI
        setCoreConnection(url);
    };

    return (
        <div className="fill center" style={{ background: 'var(--color-bg-void)' }}>
            <div className="slot-large glass" style={{ width: '400px' }}>

                {/* Header */}
                <div className="stack center" style={{ paddingBottom: 'var(--space-4)' }}>
                    <div style={{ filter: 'drop-shadow(0 0 10px var(--color-accent-glow))' }}>
                        <IndraIcon name="ATOM" size="64px" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <h1 style={{
                        marginTop: 'var(--space-3)',
                        fontSize: 'var(--text-xl)',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: 'var(--tracking-wider)',
                        color: 'var(--color-text-primary)'
                    }}>
                        INDRA CORE
                    </h1>
                    <span className="text-hint">V2.0 // ESTABLECER VÍNCULO</span>
                </div>

                {/* Formulario */}
                <form onSubmit={handleConnect} className="stack">
                    <div className="stack--tight">
                        <label className="text-label">Identificador</label>
                        <input
                            className="input-base"
                            placeholder="Ej. Mi Instancia Principal"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                        />
                    </div>

                    <div className="stack--tight">
                        <label className="text-label">Core URL</label>
                        <input
                            className="input-base"
                            placeholder="https://script.google.com/macros/s/..."
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    <div className="stack--tight">
                        <label className="text-label">Access Token</label>
                        <input
                            className="input-base"
                            type="password"
                            placeholder="••••••••••••"
                            required
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                        />
                    </div>

                    <div style={{ marginTop: 'var(--space-4)' }}>
                        <button type="submit" className="btn btn--accent btn--full">
                            <IndraIcon name="SYNC" />
                            CONECTAR INSTANCIA
                        </button>
                    </div>
                </form>

                <div className="center" style={{ marginTop: 'var(--space-2)' }}>
                    <span className="text-hint" style={{ fontSize: 'var(--text-2xs)' }}>
                        LOS DATOS SE ALMACENAN LOCALMENTE EN SU NAVEGADOR
                    </span>
                </div>
            </div>
        </div>
    );
}
