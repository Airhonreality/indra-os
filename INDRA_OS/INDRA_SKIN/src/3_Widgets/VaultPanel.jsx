import React from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import VaultEngine from '../core/kernel/projections/engines/VaultEngine';
import { Icons } from '../4_Atoms/IndraIcons';

/**
 * VaultPanel.jsx
 * DHARMA: Superficie de Manifestación de Almacén (Nivel E3)
 * AXIOMA: "Lo que está guardado no está perdido, está en el éter esperando ser llamado."
 */
const VaultPanel = () => {
    const { state, execute } = useAxiomaticStore();
    const { ui } = state.phenotype;

    if (!ui.vaultPanelOpen) return null;

    const vaultData = {
        id: 'vault_global',
        LABEL: 'Almacén de Artefactos',
        DOMAIN: 'SYSTEM_VAULT'
    };

    return (
        <div className="fixed inset-0 z-[400] flex animate-fade-in pointer-events-none">
            {/* Backdrop para cerrar al clickear fuera */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                onClick={() => execute('TOGGLE_UI_PANEL', { panel: 'vault' })}
            />

            {/* El Panel Deslizable */}
            <div className={`
                relative w-full max-w-2xl h-full bg-[#050505]/95 backdrop-blur-3xl border-r border-white/10 shadow-2xl
                flex flex-col animate-slide-in-left pointer-events-auto overflow-hidden
            `}>
                {/* Cabecera del Panel */}
                <div className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                            <Icons.Vault size={16} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Almacén de Artefactos</h3>
                    </div>
                    <button
                        onClick={() => execute('TOGGLE_UI_PANEL', { panel: 'vault' })}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-dim)] hover:text-white hover:bg-white/10 transition-all group"
                        title="Cerrar Panel"
                    >
                        <Icons.Close size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-20"></div>

                    <div className="h-full">
                        <VaultEngine
                            data={vaultData}
                            perspective="VAULT"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VaultPanel;



