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
        <div className="fixed bottom-10 left-10 flex flex-col gap-2 z-[100] animate-fade-in group pointer-events-none">

            {/* Cabecera del Estado de Sincronía V12 - Versión Minimalista Izquierda */}
            <div className={`
                glass rounded-full px-4 py-2 flex items-center gap-3 border transition-all duration-500 bg-black/40
                ${isOffline ? 'border-[var(--error)]/30' :
                    isRetry ? 'border-[var(--warning)]/30' :
                        'border-white/5'}
            `}>
                <div className={`${isLoading || isRetry ? 'animate-spin-slow' : ''}`}>
                    <Icons.Sync className={`w-3 h-3 ${isOffline ? 'text-[var(--error)]' : isRetry ? 'text-[var(--warning)]' : 'text-white/20'}`} />
                </div>

                <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">
                        {isLoading ? 'SYNCING_REALITY' : (isOffline ? 'LOCAL_SOVEREIGNTY' : isRetry ? 'RETRYING_SYNC' : 'REALITY_SYNCED')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SyncIndicator;



