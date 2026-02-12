/**
 * CAPA 1: BOOTSTRAP
 * PortalDeAcceso.jsx
 * DHARMA: Sovereign Gateway - Punto de control de acceso y configuración de enlace.
 * AXIOMA: "Nadie habita la realidad sin una conexión válida al Core."
 */

import React, { useState, useEffect } from 'react';
import adapter from '../core/Sovereign_Adapter';
import { CONFIG, updateCoreUrl } from '../core/Config';

import { useAxiomaticStore } from '../core/state/AxiomaticStore';

const PortalDeAcceso = ({ asOverlay = false, onClose }) => {
    const { execute } = useAxiomaticStore();
    const [apiKey, setApiKey] = useState(CONFIG.SYSTEM_TOKEN || '');
    const [coreUrl, setCoreUrl] = useState(CONFIG.CORE_URL || '');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState(null);

    // Si hay un error en el adapter, lo mostramos aquí
    useEffect(() => {
        const lastError = sessionStorage.getItem('INDRA_BOOT_ERROR');
        if (lastError) {
            setError(`FALLO_HANDSHAKE: ${lastError}`);
            sessionStorage.removeItem('INDRA_BOOT_ERROR');
        }
    }, []);

    const handleAuthenticate = async () => {
        if (!apiKey || !coreUrl) {
            setError('FALTAN_CREDENCIALES: Se requiere URL y Clave de Enlace.');
            return;
        }

        setIsAuthenticating(true);
        setError(null);

        try {
            console.log('[PortalDeAcceso] Reconfigurando enlace soberano...');

            // 1. Guardar en persistencia local
            localStorage.setItem('INDRA_SESSION_TOKEN', apiKey);
            localStorage.setItem('INDRA_OVERRIDE_URL', coreUrl);

            // 2. Reinicializar el conector directamente con los nuevos valores
            const { default: connector } = await import('../core/Core_Connector');
            connector.init(coreUrl, apiKey);

            // 3. Intentar una validación rápida (Ignición)
            const result = await adapter.ignite();

            if (result.sovereignty === 'ACTIVE') {
                console.log('[PortalDeAcceso] ✅ Enlace Establecido. Sincronizando realidades...');

                // AXIOMA: Si es overlay, inyectamos el nuevo genotipo directamente en el store
                // sin recargar la página para mantener la experiencia fluida.
                if (asOverlay) {
                    execute('IGNITE_SYSTEM', {
                        sovereignty: 'ACTIVE',
                        genotype: result.genotype
                    });
                    if (onClose) onClose();
                } else {
                    // Si no es overlay (arranque inicial), recargamos para limpiar memoria
                    updateCoreUrl(coreUrl);
                }
            } else {
                setError(result.error ? `ERROR_VETO: ${result.error}` : 'ERROR_VETO: El Core rechazó las credenciales o el enlace está roto.');
            }
        } catch (err) {
            console.error('[PortalDeAcceso] Ignition fail:', err);
            setError(`CORE_INALCANZABLE: ${err.message}`);
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <div className={`w-full flex items-center justify-center bg-[var(--bg-primary)] p-6 ${asOverlay ? 'h-auto rounded-3xl' : 'h-screen'}`}>
            <div className={`w-full flex flex-col ${asOverlay ? 'gap-6' : 'max-w-md gap-10'}`}>

                {/* Visual Identity */}
                <div className="flex flex-col items-center gap-4 relative">
                    {asOverlay && (
                        <button
                            onClick={onClose}
                            className="absolute top-0 right-0 p-2 text-[var(--text-dim)] hover:text-[var(--accent)] font-mono text-xs uppercase"
                        >
                            [Cerrar] ESC
                        </button>
                    )}
                    <div className="w-16 h-16 rounded-full border border-[var(--accent)] flex items-center justify-center shadow-[var(--shadow-glow)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[var(--accent)] opacity-5 animate-pulse"></div>
                        <div className="text-2xl font-black text-[var(--accent)] tracking-tighter">I</div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-lg font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">
                            Portal de Soberanía
                        </h1>
                        <p className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest mt-1">
                            Capa de Defensa Axiomática v2.0
                        </p>
                    </div>
                </div>

                {/* Status/Error */}
                {error && (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-mono leading-relaxed">
                        <span className="font-black">🛑 FALLO:</span> {error}
                    </div>
                )}

                {/* Interface Fields */}
                <div className="flex flex-col gap-6 p-6 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl glass relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-20"></div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-wider ml-1">
                                URL de Conexión Core
                            </label>
                            <input
                                type="text"
                                value={coreUrl}
                                onChange={(e) => setCoreUrl(e.target.value)}
                                placeholder="https://script.google.com/..."
                                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono text-[10px] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-wider ml-1">
                                Clave Soberana (Token)
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Clave de desencriptado cuántico..."
                                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono text-[10px] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAuthenticate}
                        disabled={isAuthenticating}
                        className={`
                            mt-2 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-500
                            ${isAuthenticating
                                ? 'bg-[var(--border-color)] text-[var(--text-dim)] cursor-not-allowed'
                                : 'bg-[var(--accent)] text-black shadow-[var(--shadow-glow)] hover:scale-[1.01] active:scale-95'
                            }
                        `}
                    >
                        {isAuthenticating ? 'Sincronizando...' : 'Vincular Soberanía'}
                    </button>

                    {/* AXIOMA: Reset System Token (Solicitud Usuario v12.1) */}
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[7px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                                Avanzado: Sobrescribir Token en Core
                            </span>
                            <div className="h-[1px] flex-1 bg-[var(--border-color)] mx-3"></div>
                        </div>

                        <p className="text-[8px] font-mono text-[var(--text-dim)] opacity-60 leading-tight">
                            Usa esta opción para registrar tu contraseña actual en el Core.
                            Solo disponible durante la fase 'INDRA_SETUP_CORE'.
                        </p>

                        <button
                            onClick={async () => {
                                if (!apiKey || isAuthenticating) return;
                                setIsAuthenticating(true);
                                try {
                                    // 1. Inicializar conector con URL y token actual (pude ser SETUP)
                                    const { default: connector } = await import('../core/Core_Connector');
                                    connector.init(coreUrl, apiKey);

                                    // 2. Llamada al método white-listed en AdminTools
                                    const result = await adapter.call('adminTools', 'setSystemToken', { newToken: apiKey });

                                    if (result && result.success) {
                                        setError(`✅ ÉXITO: Token del Core actualizado a ${apiKey.substring(0, 3)}... Reiniciando.`);
                                        setTimeout(() => window.location.reload(), 2000);
                                    } else {
                                        setError(`FALLO: El Core rechazó la actualización del token.`);
                                    }
                                } catch (err) {
                                    setError(`FALLO_OVERRIDE: ${err.message}`);
                                } finally {
                                    setIsAuthenticating(false);
                                }
                            }}
                            className="py-2 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] font-mono text-[9px] uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
                        >
                            Sincronizar Password con el Core
                        </button>
                    </div>
                </div>

                {/* Footer Hardware Info */}
                <div className="flex justify-between items-center px-4">
                    <div className="text-[8px] font-mono text-[var(--accent)] opacity-50 uppercase tracking-tighter">
                        {asOverlay ? 'RELÉ_MULTI_CORE_ACTIVO' : 'MEMBRANA_DE_ACCESO_ACTIVO'}
                    </div>
                    <div className="text-[8px] font-mono text-[var(--text-dim)] opacity-40 uppercase tracking-tighter">
                        Axioma: La conectividad es fluida.
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PortalDeAcceso;
