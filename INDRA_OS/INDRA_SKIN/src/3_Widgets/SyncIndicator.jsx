/**
 * SyncIndicator.jsx
 * DHARMA: Monitor de Deuda de Realidad.
 * Misión: Transparentar el estado de la cola de intenciones del Córtex.
 */

import React from 'react';
import useAxiomaticState from '../core/state/AxiomaticState';
import { Icons } from '../4_Atoms/IndraIcons';

const SyncIndicator = () => {
    const session = useAxiomaticState(s => s.session);
    const isLoading = session?.isLoading;

    if (session?.syncStatus === 'SYNCED' && !isLoading) return null;

    const isRetry = session?.syncStatus === 'RETRY';
    const isOffline = session?.syncStatus === 'OFFLINE';

    return (
        <div className="fixed bottom-32 right-10 flex flex-col gap-2 z-[500] animate-fade-in group">

            {/* Cabecera del Estado de Sincronía V12 */}
            <div className={`
                glass rounded-2xl p-4 flex items-center gap-4 border transition-all duration-500
                ${isOffline ? 'border-[var(--error)]/50 shadow-[0_0_20px_var(--error-surface)]' :
                    isRetry ? 'border-[var(--warning)]/50 shadow-[0_0_20px_var(--warning-surface)]' :
                        'border-[var(--accent)]/30'}
                ${isLoading ? 'shadow-[0_0_15px_rgba(0,210,255,0.1)]' : ''}
            `}>
                <div className={`relative ${isLoading || isRetry ? 'animate-spin-slow' : ''}`}>
                    <Icons.Sync className={`w-5 h-5 ${isOffline ? 'text-[var(--error)]' : isRetry ? 'text-[var(--warning)]' : 'text-[var(--accent)]'}`} />
                    {isLoading && (
                        <div className="absolute inset-0 bg-[var(--accent)] blur-md opacity-20 animate-pulse"></div>
                    )}
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                        Sincronía de Realidad
                    </span>
                    <span className="text-[9px] font-mono opacity-60">
                        {isLoading ? 'Transmitiendo Snapshot...' : (isOffline ? 'Modo Offline (Soberanía Local)' : isRetry ? `Reintentando (${session.failedSyncAttempts}/4)` : 'Sincronizado')}
                    </span>
                </div>
            </div>

            {isOffline && (
                <div className="bg-[var(--error-surface)] backdrop-blur-md rounded-lg p-2 border border-[var(--error)]/20 text-[8px] font-mono text-[var(--error)] mt-1 max-w-[200px] animate-pulse">
                    ⚠️ MODO OFFLINE: Los cambios solo persisten localmente hasta recuperar conexión.
                </div>
            )}

            {(isRetry && session.lastSyncError) && (
                <div className="bg-[var(--warning-surface)] backdrop-blur-md rounded-lg p-2 border border-[var(--warning)]/20 text-[8px] font-mono text-[var(--warning)] mt-1 max-w-[200px]">
                    ⚠️ REINTENTO: {session.lastSyncError.message || 'Error de conexión'}
                </div>
            )}
        </div>
    );
};

export default SyncIndicator;
