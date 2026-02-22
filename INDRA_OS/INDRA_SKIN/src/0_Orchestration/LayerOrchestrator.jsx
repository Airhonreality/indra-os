/**
 * CAPA 0: ORCHESTRATION
 * LayerOrchestrator.jsx
 * DHARMA: El Gran Decididor. Gobierna qué capa de la realidad se proyecta.
 * AXIOMA: Es el Shell global. Gestiona el layout base y el viewport.
 */

import React, { useEffect } from 'react';
import { useAxiomaticStore } from '../core/1_Axiomatic_Store/AxiomaticStore.jsx';
import useAxiomaticState from '../core/1_Axiomatic_Store/AxiomaticState.js';

// LAYERS
import CoreSelector from '../1_Bootstrap/CoreSelector.jsx';
import CosmosSelector from '../1_Bootstrap/CosmosSelector.jsx';
// DevLab ERRADICADO (ADR-021: Pureza Soberana)
import DynamicLayoutEngine from '../2_Engines/DynamicLayoutEngine.jsx';
import CosmosInspector from '../1_Bootstrap/CosmosInspector.jsx';

// WIDGETS / ATOMS
import SovereignSphere from '../3_Widgets/SovereignSphere.jsx';
import SystemControlHood from '../3_Widgets/SystemControlHood.jsx';
import SyncIndicator from '../3_Widgets/SyncIndicator.jsx';
import ThemeToggle from '../4_Atoms/ThemeToggle.jsx';
import AxiomaticSplashScreen from '../4_Elements/Signifiers/Axiomatic_Splash_Screen.jsx';
import OperationalHood from '../3_Widgets/OperationalHood.jsx';
import VaultPanel from '../3_Widgets/VaultPanel.jsx';
import { Icons } from '../4_Atoms/AxiomIcons.jsx';
import { ATTENTION_PROFILES, SYSTEM_MODULES } from '../core/Canon_Registry.js';
import AxiomaticLoadingOverlay from '../4_Elements/Signifiers/AxiomaticLoadingOverlay.jsx';


const LayerOrchestrator = ({ initialAssembly }) => {
    const { state, execute } = useAxiomaticStore();

    const isWorldLoading = useAxiomaticState(s => s.session?.isLoading);

    // AXIOMA: Sincronización Post-Ensamblaje (Solo Fuego Inicial)
    useEffect(() => {
        if (initialAssembly) {
            if (initialAssembly.status === 'LOCKED') {
                execute('SYSTEM_LOCKED');
            } else if (initialAssembly.status === 'ACTIVE' || initialAssembly.status === 'DEGRADED') {
                execute('IGNITE_SYSTEM', {
                    sovereignty: initialAssembly.status,
                    genotype: initialAssembly.genotype || state.genotype
                });

                // NOTA: La restauración de sesión ahora es responsabilidad exclusiva de AxiomaticStore.
                // LayerOrchestrator es solo una ventana pasiva.
            }
        }
    }, [initialAssembly]);

    // AXIOMA: Semáforo de Unicidad para Restauración (Evita bucles de montaje)
    // const hasAttemptedRestoration = React.useRef(false); // REMOVED

    // AXIOMA: Sincronización Post-Ensamblaje y Restauración de Conciencia
    useEffect(() => {
        console.log("🔄 [Orchestrator] MOUNTED / UPDATED");
        return () => console.log("💀 [Orchestrator] UNMOUNTED");
    }, []);

    // AXIOMA: Reflejar tema en el DOM
    useEffect(() => {
        const theme = state.sovereignty.theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = `indra-os-shell bg-hex-grid transition-colors duration-1000`;
    }, [state.sovereignty.theme]);

    const renderLayer = () => {
        const currentLayer = state.phenotype.ui.currentLayer;
        const setManualLayer = (layer) => execute('SET_CURRENT_LAYER', layer);
        const hasHabitedReality = !!state.phenotype.cosmosIdentity?.id;

        // AXIOMA: Determinación de la Profundidad de Atención
        const getProfile = (moduleId) => {
            if (!moduleId) return null;
            const mod = Object.values(SYSTEM_MODULES).find(m => m.id === moduleId);
            return mod ? mod.profile : null;
        };

        const activeProfile = getProfile(currentLayer);
        const isLocked = state.sovereignty.status === 'LOCKED';

        // Estratificación de la Realidad Percibida
        const showE0 = true; // El sustrato siempre existe
        const showE1 = currentLayer === 'PORTAL' || activeProfile === 'AMBIENT';
        const showE2 = currentLayer === 'SELECTOR' || activeProfile === 'NAVIGATIONAL';
        const showE3 = isLocked;

        const hasActiveFocus = (state.phenotype.focusStack || []).length > 0;

        return (
            <div className="w-full h-full relative overflow-hidden flex flex-col">

                {/* E0: ESTRATO DE SUSTRATO (z-0) - Foco Profundo */}
                {showE0 && (
                    <div
                        className="absolute inset-0 layer-transition"
                        style={{
                            zIndex: 0,
                            filter: showE2 ? `blur(15px) brightness(0.6) grayscale(0.5)` : (showE3 ? `brightness(0.2)` : 'none'),
                            transform: showE2 ? `scale(0.96) translateY(-20px)` : 'scale(1)',
                            opacity: showE3 ? 0.3 : 1
                        }}
                    >
                        {/* AXIOMA: Suelo Territorial Dinámico (ADR-021: Un solo suelo, honesto) */}
                        {(hasHabitedReality || hasActiveFocus) ? <DynamicLayoutEngine /> : <CosmosSelector asHome={true} />}
                    </div>
                )}

                {/* E1: AMBIENTE (z-10) - Widgets Flotantes */}
                <div className="absolute inset-0 z-[10] pointer-events-none flex items-center justify-center">
                    {showE1 && (
                        <div className="w-full max-w-xl glass p-8 rounded-[2.5rem] border border-[var(--axiom-glass-border)] shadow-2xl animate-fade-in pointer-events-auto">
                            <CoreSelector asOverlay={true} onClose={() => setManualLayer(null)} />
                        </div>
                    )}
                </div>

                {/* E2: NAVEGACIÓN (Solo si se invoca manualmente vía Hood) */}
                {
                    showE2 && (
                        <div
                            onClick={() => setManualLayer(null)}
                            className="absolute inset-0 flex items-center justify-center p-12 z-[20] animate-fade-in backdrop-blur-sm cursor-pointer"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-7xl h-full glass rounded-[3rem] shadow-2xl overflow-hidden border border-[var(--axiom-glass-border)] flex flex-col pointer-events-auto cursor-default"
                            >
                                <div className="h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-20"></div>
                                <div className="flex-1 overflow-auto">
                                    <CosmosSelector />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* E3: SOBERANÍA (z-100) - Gatekeeper / Interrupción Total */}
                {
                    showE3 && (
                        <div className="absolute inset-0 flex items-center justify-center z-[100] animate-fade-in bg-black/60 backdrop-blur-md">
                            <div className="w-full max-w-xl glass p-10 rounded-[2.5rem] border border-[var(--axiom-glass-border)] shadow-2xl pointer-events-auto text-center">
                                <CoreSelector asOverlay={false} />
                            </div>
                        </div>
                    )
                }

                <div className="absolute inset-0 z-[300] pointer-events-none overflow-hidden">
                    <div className="pointer-events-auto">
                        <SovereignSphere manualLayer={currentLayer} setManualLayer={setManualLayer} />
                        <SystemControlHood />
                        <OperationalHood />
                        <SyncIndicator />
                    </div>

                    {/* AXIOMA: MANIFESTACIÓN DE ALMACÉN (Vault) */}
                    <VaultPanel />

                    {/* AXIOMA: Velo de Resonancia (Unificado) */}
                    <AxiomaticLoadingOverlay />

                    {/* AXIOMA: Materia Oscura (Deep Hydration Overlay) */}
                    {state.phenotype.isDeepHydrating && !isWorldLoading && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-8 py-4 glass rounded-full border border-[var(--accent)]/30 shadow-[0_0_30px_rgba(0,210,255,0.2)] animate-pulse flex items-center gap-4 pointer-events-auto">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Materia Oscura Detectada</span>
                                <span className="text-[8px] font-mono text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Hidratando Realidad en Profundidad (Deep Reading)...</span>
                            </div>
                            <div className="ml-4 flex gap-1">
                                <div className="w-1 h-3 bg-[var(--accent)]/20 rounded-full animate-[indra-breath_1s_infinite_ease-in-out]"></div>
                                <div className="w-1 h-3 bg-[var(--accent)]/40 rounded-full animate-[indra-breath_1.2s_infinite_ease-in-out]"></div>
                                <div className="w-1 h-3 bg-[var(--accent)]/60 rounded-full animate-[indra-breath_1.4s_infinite_ease-in-out]"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        );
    };

    if (state.sovereignty.status === 'STANDBY') {
        return <AxiomaticSplashScreen />;
    }

    return (
        <div className="w-screen h-screen overflow-hidden layer-transition bg-black">
            {renderLayer()}
        </div>
    );
};

export default LayerOrchestrator;




