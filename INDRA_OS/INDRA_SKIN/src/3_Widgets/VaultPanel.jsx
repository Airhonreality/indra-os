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
                relative w-full max-w-2xl h-full glass border-r border-[var(--border-subtle)] shadow-2xl
                flex flex-col animate-slide-in-left pointer-events-auto
            `}>
                <div className="absolute top-0 right-0 p-4">
                    <button
                        onClick={() => execute('TOGGLE_UI_PANEL', { panel: 'vault' })}
                        className="p-2 text-[var(--text-dim)] hover:text-white transition-colors"
                    >
                        <Icons.Close size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <VaultEngine
                        data={vaultData}
                        perspective="VAULT"
                    />
                </div>
            </div>
        </div>
    );
};

export default VaultPanel;
