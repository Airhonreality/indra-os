import React, { useState } from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import adapter from '../core/Sovereign_Adapter';
import { Icons } from '../4_Atoms/IndraIcons';
import { CONFIG } from '../core/Config';

/**
 * Bóveda de Seguridad
 * DHARMA: Vault de Seguridad - Gestión de Identidad y Tokens
 * AXIOMA: "El guardián de las llaves no duerme."
 */
const SecurityVault = ({ onClose }) => {
    const { state, execute } = useAxiomaticStore();
    const [newToken, setNewToken] = useState('');
    const [newCoreUrl, setNewCoreUrl] = useState(CONFIG.CORE_URL || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [status, setStatus] = useState(null);

    const handleUpdateToken = async () => {
        if (!newToken || isUpdating) return;
        setIsUpdating(true);
        setStatus({ type: 'info', msg: 'Sincronizando con el Core...' });

        try {
            // Actualizar URL local primero si ha cambiado
            if (newCoreUrl !== CONFIG.CORE_URL) {
                localStorage.setItem('INDRA_OVERRIDE_URL', newCoreUrl);
                const { default: connector } = await import('../core/Core_Connector');
                connector.init(newCoreUrl, localStorage.getItem('INDRA_SESSION_TOKEN'));
            }

            const result = await adapter.call('public', 'setSystemToken', { newToken });

            if (result && result.success) {
                // Actualizar token localmente
                localStorage.setItem('INDRA_SESSION_TOKEN', newToken);
                setStatus({ type: 'success', msg: '✅ Token Maestro actualizado exitosamente.' });

                // Loguear en el sistema
                execute('LOG_ENTRY', {
                    time: new Date().toLocaleTimeString(),
                    msg: '🔐 Token del Sistema rotado con éxito.',
                    type: 'SUCCESS'
                });

                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1500);
            } else {
                setStatus({ type: 'error', msg: '❌ El Core rechazó la actualización.' });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: `❌ Error: ${err.message}` });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in p-6">
            <div className="w-full max-w-md glass border border-[var(--border-subtle)] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-30"></div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <Icons.Close size={18} />
                </button>

                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
                            <Icons.Lock size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black tracking-widest uppercase">Bóveda de Seguridad</h2>
                            <p className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-tight">Configuración del Token Maestro</p>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-xl text-[10px] font-mono leading-relaxed border ${status.type === 'success' ? 'bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]' :
                            status.type === 'error' ? 'bg-[var(--error-surface)] border-[var(--error)]/20 text-[var(--error)]' :
                                'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]'
                            }`}>
                            {status.msg}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-widest ml-1">
                                URL de Conexión Core
                            </label>
                            <input
                                type="text"
                                value={newCoreUrl}
                                onChange={(e) => setNewCoreUrl(e.target.value)}
                                placeholder="https://script.google.com/..."
                                className="w-full h-10 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-widest ml-1">
                                Nuevo Token Maestro / Contraseña
                            </label>
                            <input
                                type="password"
                                value={newToken}
                                onChange={(e) => setNewToken(e.target.value)}
                                placeholder="Escribe tu nueva frase de acceso..."
                                className="w-full h-12 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                        </div>
                        <p className="text-[7px] font-mono text-[var(--text-dim)] opacity-50 px-1">
                            Advertencia: Actualizar esto rotará la clave maestra para todos los satélites interconectados.
                        </p>
                    </div>

                    <button
                        onClick={handleUpdateToken}
                        disabled={!newToken || isUpdating}
                        className={`
                            h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-500 mt-2
                            ${!newToken || isUpdating
                                ? 'bg-[var(--bg-secondary)] text-[var(--text-dim)] cursor-not-allowed border border-[var(--border-subtle)]'
                                : 'bg-[var(--accent)] text-black shadow-lg hover:scale-[1.02] active:scale-95'
                            }
                        `}
                    >
                        {isUpdating ? 'Sincronizando...' : 'Rotar Token Maestro'}
                    </button>

                    <div className="text-center mt-2">
                        <span className="text-[8px] font-mono text-[var(--text-dim)] opacity-30 uppercase tracking-[0.2em]">
                            Protocolo Axiomático: La Identidad es la Prueba.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityVault;
