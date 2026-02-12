import React, { useState, useEffect } from 'react';

/**
 * OMD-06: Monitor de Trazabilidad Humano (The Trace)
 * DHARMA: Ventana a la salud metabólica del sistema.
 */
const TraceabilityMonitor = ({ law }) => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Conexión con el Sistema de Logs Axiomáticos
    useEffect(() => {
        const checkLogs = () => {
            if (window.INDRA_DEBUG && window.INDRA_DEBUG.logs) {
                setEvents([...window.INDRA_DEBUG.logs]);
            }
        };
        const interval = setInterval(checkLogs, 500);
        return () => clearInterval(interval);
    }, []);

    const visual = law.visual_config || {};

    return (
        <div className="w-full h-full flex items-center justify-between px-6 bg-black/95 backdrop-blur-3xl border-t-2 border-accent-primary shadow-[0_-10px_50px_rgba(0,210,255,0.2)]">
            {/* A. THE LIVE FEED (Pulso de Ejecución) */}
            <div className="flex-1 flex items-center gap-8 overflow-x-auto no-scrollbar">
                {events.map((ev, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3 group cursor-pointer transition-all duration-300"
                        onClick={() => setSelectedEvent(ev)}
                    >
                        {/* Status Dot */}
                        <div className={`w-1.5 h-1.5 rounded-full ${ev.level === 'error' ? 'bg-status-error' : (ev.level === 'warn' ? 'bg-status-warning' : 'bg-accent-primary')} shadow-[0_0_8px_currentColor]`}></div>

                        <div className="flex flex-col">
                            <span className="text-[6px] font-mono text-white/20 uppercase tracking-widest">{ev.time}</span>
                            <span className="text-[8px] font-bold text-white/70 tracking-[0.1em] group-hover:text-white transition-colors truncate max-w-[200px]">{ev.msg}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* C. SEMÁFORO DE INTEGRIDAD (Status Pillar) */}
            <div className="flex items-center gap-6 border-l border-white/[0.05] pl-8">
                <div className="flex flex-col items-end">
                    <span className="text-[5px] font-mono text-white/20 uppercase tracking-[0.3em]">System_Pulse</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-accent-primary tracking-widest">ACTIVE_STARK</span>
                        <div className="w-2 h-2 border border-accent-primary/30 rotate-45 flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-accent-primary shadow-[0_0_8px_rgba(0,210,255,0.8)]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* B. INSPECTOR DE TRÁNSITO (Modal Minimalista si hay selección) */}
            {selectedEvent && (
                <div className="absolute bottom-12 left-6 w-64 p-4 bg-black/90 border border-white/5 backdrop-blur-2xl rounded shadow-2xl z-50 animate-fadeInShort">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[7px] font-bold text-accent-primary tracking-widest">EVENT_INSPECTOR</span>
                        <button onClick={() => setSelectedEvent(null)} className="text-[10px] text-white/20 hover:text-white">×</button>
                    </div>
                    <pre className="text-[6px] font-mono text-white/40 overflow-hidden text-ellipsis bg-white/[0.02] p-2">
                        {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default TraceabilityMonitor;
