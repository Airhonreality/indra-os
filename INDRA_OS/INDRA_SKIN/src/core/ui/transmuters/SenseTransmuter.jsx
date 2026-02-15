import { useAxiomaticSense } from '../hooks/useAxiomaticSense';

/**
 * SENSE TRANSMUTER (Telemetry Specialist)
 * Dharma: Manifestar el estado de salud y flujo del sistema (Telemetría).
 */
export const SenseTransmuter = ({ atom }) => {
    // AXIOMA: Materia ya hidratada por el Motor Superior (AxiomaticGroup)
    const manifest = atom;

    switch (atom.type) {
        case 'DATA_ROW':
            return (
                <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{manifest.label}</span>
                        <div className={`px-1.5 py-0.5 text-[6px] font-mono rounded-full border ${manifest.status === 'ACTIVE' ? 'border-status-success/30 text-status-success' : 'border-status-error/30 text-status-error'}`}>
                            {manifest.status}
                        </div>
                    </div>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">PROVIDER::{manifest.provider}</span>
                </div>
            );

        case 'PROGRESS_BAR':
            return (
                <div className="axiom-atom stack-v gap-1">
                    <div className="flex justify-between items-center">
                        <span className="axiom-atom-label">{manifest.label}</span>
                        <span className="text-tiny font-mono text-white/40">{manifest.value}%</span>
                    </div>
                    <div className="axiom-atom-progress">
                        <div className="axiom-progress-fill" style={{ width: `${manifest.value}%` }}></div>
                    </div>
                </div>
            );

        case 'STATUS_PULSE':
            return (
                <div className="flex items-center justify-between py-1 mt-4">
                    <div className="flex items-center gap-3">
                        <div className={`relative w-1.5 h-1.5 rounded-full ${manifest.status === 'STABLE' ? 'bg-status-success shadow-[0_0_10px_rgba(0,255,170,0.5)]' : 'bg-status-error animate-pulse'}`}>
                            {manifest.status === 'STABLE' && <div className="absolute inset-0 bg-status-success rounded-full animate-ping opacity-20"></div>}
                        </div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">{manifest.label}</span>
                    </div>
                </div>
            );

        default:
            return null;
    }
};



