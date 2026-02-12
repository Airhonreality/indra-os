import React from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import { Icons } from '../4_Atoms/IndraIcons';

/**
 * OperationalHood.jsx
 * DHARMA: Contorno de Operaciones Vertical (Lado Izquierdo)
 * AXIOMA: "Las herramientas no invaden, esperan en el borde."
 * Este hood aparece solo en modo LIVE cuando hay un Cosmos habitado.
 */
const OperationalHood = () => {
    const { state, execute } = useAxiomaticStore();
    const { ui, cosmosIdentity } = state.phenotype;

    // Solo visible en modo LIVE con Cosmos habitado
    const isVisible = state.sovereignty.mode === 'LIVE' && !!cosmosIdentity;

    if (!isVisible) return null;

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[350] flex flex-col items-center gap-4 animate-fade-in-left">
            <div className="flex flex-col gap-2 p-1.5 glass border border-[var(--border-subtle)] rounded-full shadow-2xl">
                {/* 
                    AXIOMA: EL COFRE (Vault Trigger)
                    Este botón invoca el almacén de artefactos del mundo exterior.
                */}
                <button
                    onClick={() => execute('TOGGLE_UI_PANEL', { panel: 'vault' })}
                    className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                        ${ui.vaultPanelOpen
                            ? 'bg-[var(--accent)] text-black shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] rotate-12'
                            : 'text-[var(--text-dim)] hover:text-[var(--text-vibrant)] hover:bg-[var(--bg-secondary)]'}
                    `}
                    title="Almacén de Artefactos (Vault)"
                >
                    <Icons.Vault size={20} />
                </button>

                <div className="w-6 h-[1px] bg-[var(--border-subtle)] mx-auto opacity-30"></div>

                {/* Futuras herramientas del Operational Hood */}
            </div>
        </div>
    );
};

export default OperationalHood;
