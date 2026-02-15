import React from 'react';
import { Icons } from '../../../4_Atoms/IndraIcons';

/**
 * ChaosCommander: Consola de Mando para pruebas de entropía y persistencia.
 */
const ChaosCommander = ({
    isTesting,
    startChaosTest,
    startV12Audit,
    isInterdicted,
    interdictionReason,
    setWorldLoading,
    execute,
    perspective,
    setPerspective
}) => {
    return (
        <div className={`absolute top-28 left-8 z-[500] animate-in slide-in-from-left duration-700 pointer-events-auto transition-all ${isTesting ? 'scale-105' : ''}`}>
            <div className={`glass p-5 rounded-3xl border transition-all duration-500 flex flex-col gap-4 min-w-[240px] shadow-2xl backdrop-blur-2xl ${isTesting ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_50px_rgba(249,115,22,0.2)]' : 'border-white/10'}`}>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isTesting ? 'bg-orange-500 animate-[ping_1.5s_infinite]' : 'bg-white/20'}`}></div>
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isTesting ? 'text-orange-400' : 'text-white/40'}`}>Chaos_Commander</span>
                    </div>
                    {isInterdicted && (
                        <button
                            onClick={() => {
                                setWorldLoading(false);
                                execute('LOG_ENTRY', { time: new Date().toLocaleTimeString(), msg: '🔓 Manual World Lock Release executed by Commander.', type: 'SUCCESS' });
                            }}
                            className="text-[9px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/50 hover:bg-red-500 hover:text-white transition-all animate-pulse font-bold"
                            title={`Interdicted: ${interdictionReason}`}
                        >
                            FORCE_UNLOCK
                        </button>
                    )}
                    <button
                        onClick={() => execute('TOGGLE_UI_PANEL', { panel: 'chaos' })}
                        className="text-white/20 hover:text-white/80 transition-colors p-1"
                    >
                        <Icons.Close size={14} />
                    </button>
                </div>

                <button
                    onClick={startChaosTest}
                    disabled={isTesting}
                    className={`group relative flex items-center justify-between gap-4 px-5 py-4 rounded-xl transition-all active:scale-95 border ${isTesting
                        ? 'bg-orange-500/30 border-orange-500/50 cursor-wait'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-orange-500/50'}`}
                >
                    <div className="flex items-center gap-3">
                        {isTesting ? (
                            <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                        ) : (
                            <div className="text-orange-500 group-hover:scale-125 transition-transform duration-300">🔥</div>
                        )}
                        <span className={`text-[12px] font-black tracking-[0.15em] ${isTesting ? 'text-white animate-pulse' : 'text-orange-300 group-hover:text-orange-100'}`}>
                            {isTesting ? 'TEST_IN_PROGRESS...' : 'IGNITE_CHAOS_TEST'}
                        </span>
                    </div>
                    {!isTesting && <Icons.Sync size={16} className="text-orange-500 group-hover:rotate-180 transition-transform duration-700 opacity-60" />}
                </button>

                <button
                    onClick={startV12Audit}
                    disabled={isTesting}
                    className={`group relative flex items-center justify-between gap-4 px-5 py-4 rounded-xl transition-all active:scale-95 border ${isTesting
                        ? 'bg-blue-500/30 border-blue-500/50 cursor-wait'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-blue-500/50'}`}
                >
                    <div className="flex items-center gap-3">
                        {isTesting ? (
                            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        ) : (
                            <div className="text-blue-500 group-hover:scale-125 transition-transform duration-300">🛡️</div>
                        )}
                        <span className={`text-[12px] font-black tracking-[0.15em] ${isTesting ? 'text-white animate-pulse' : 'text-blue-300 group-hover:text-blue-100'}`}>
                            {isTesting ? 'AUDITING...' : 'V12_SOVEREIGNTY_AUDIT'}
                        </span>
                    </div>
                    {!isTesting && <Icons.Lab size={16} className="text-blue-500 group-hover:rotate-180 transition-transform duration-700 opacity-60" />}
                </button>

                <button
                    onClick={() => execute('RUN_DIAGNOSTIC')}
                    className="mt-2 w-full py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[9px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all uppercase tracking-widest"
                >
                    🔍 Run_System_Diagnostic
                </button>
            </div>
        </div>
    );
};

export default ChaosCommander;



