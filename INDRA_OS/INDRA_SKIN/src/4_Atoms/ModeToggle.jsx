/**
 * ModeToggle.jsx
 * DHARMA: Interruptor Soberano entre LAB (Desarrollo) y LIVE (Usuario).
 * Persiste la preferencia y actualiza el estado global.
 */

import React from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';

const ModeToggle = () => {
    const { state, execute } = useAxiomaticStore();
    const currentMode = state.sovereignty.mode;

    const toggleMode = () => {
        const newMode = currentMode === 'LAB' ? 'LIVE' : 'LAB';

        // Persistir en localStorage
        localStorage.setItem('INDRA_MODE', newMode);

        // Actualizar el Store (el LayerOrchestrator se re-renderizará automáticamente)
        execute('SET_MODE', { mode: newMode });
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-tighter opacity-50">
                Mode
            </span>
            <button
                onClick={toggleMode}
                className={`
                    px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]
                    border rounded-full transition-all duration-500 relative overflow-hidden group
                    ${currentMode === 'LAB'
                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[var(--shadow-glow)]'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                    }
                `}
            >
                <div className="flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full ${currentMode === 'LAB' ? 'bg-[var(--accent-primary)] animate-pulse' : 'bg-[var(--text-dim)]'}`}></span>
                    {currentMode}
                </div>
            </button>
        </div>
    );
};

export default ModeToggle;
