import React, { useState, useMemo } from 'react';
import { useAxiomaticStore } from '../../core/state/AxiomaticStore';
import adapter from '../../core/Sovereign_Adapter';
import ComponentProjector from '../../core/kernel/ComponentProjector';
import AdapterSelector from '../../3_Widgets/AdapterSelector';
import { Icons } from '../../4_Atoms/IndraIcons';
import useAxiomaticState from '../../core/state/AxiomaticState';

// Sub-módulos Axiomáticos
import { createChaosEngine } from './engines/ChaosEngine';
// import ChaosCommander removed
import InspectorPanel from './components/InspectorPanel';
import ProjectionDeck from './components/ProjectionDeck';
import DevLabHood from './components/DevLabHood';
import { MOCK_GENOTYPE, MOCK_VAULT_DATA } from '../../core/kernel/projections/mocks/MockFactory';
import compiler from '../../core/laws/Law_Compiler';

/**
 * DevLab: El entorno soberano de desarrollo e ingeniería.
 * Arquitectura Folderizada (V12.5) - Modular y Agnóstica.
 */
const DevLab = () => {
    const { state, execute } = useAxiomaticStore();
    const [showSelector, setShowSelector] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Membrana de Estado
    const setWorldLoading = useAxiomaticState(s => s.setLoading);
    const isInterdicted = useAxiomaticState(s => s.interdiction.active);
    const interdictionReason = useAxiomaticState(s => s.interdiction.reason);

    // AXIOMA: Soberanía de Foco del Laboratorio (PERSISTENCIA INDEPENDIENTE)
    // El DevLab no depende del activeLayout global (Modo LIVE).
    // Es un contenedor cínico que solo mira su propio Target de Ingeniería.
    const labState = state.phenotype.devLab || {};
    const targetId = labState.targetId || 'DRIVE';
    const perspective = labState.perspective || 'VAULT';

    // Resolución de Artefacto Televisado
    const selectedArtifact = useMemo(() => {
        // AXIOMA: Inyección de Simulacro (MOCKS)
        if (labState.isMockEnabled) {
            const mockId = (targetId === 'VAULT' || targetId === 'BRIDGE') ? 'DRIVE' : targetId;

            // 1. Prioridad: Mock Específico Definido en Genotipo
            const mockCanon = MOCK_GENOTYPE.COMPONENT_REGISTRY[mockId] || MOCK_GENOTYPE.COMPONENT_REGISTRY[mockId.toUpperCase()];
            if (mockCanon) return { ...mockCanon, id: mockId, _isMock: true };

            // 2. Prioridad: Datos de Bóveda Simulados
            const mockVaultItem = MOCK_VAULT_DATA.find(item => item.id === targetId);
            if (mockVaultItem) return { ...mockVaultItem, _isMock: true };

            // 3. Fallback: Mock Generativo (Intercepción de Canon Real)
            // Usamos la estructura real pero inyectamos datos falsos
            const realCanon = adapter.L0?.COMPONENT_REGISTRY?.[targetId] || compiler.getCanon(targetId);
            if (realCanon) {
                return {
                    ...realCanon,
                    id: targetId,
                    _isMock: true,
                    LABEL: `${realCanon.LABEL || targetId} (SIM)`,
                    // Sobrescribir signos vitales con estática
                    VITAL_SIGNS: {
                        "SIMULATION": { "criticality": "NOMINAL", "value": "ACTIVE", "trend": "stable" },
                        "LATENCY": { "criticality": "WARNING", "value": "12ms", "trend": "fluctuating" }
                    },
                    // AXIOMA: Datos de Relleno para Evitar Fetch Real
                    data: {
                        columns: [
                            { id: 'id', label: 'ID', type: 'STRING' },
                            { id: 'sim_status', label: 'SIM_STATUS', type: 'TAG' },
                            { id: 'throughput', label: 'THROUGHPUT', type: 'NUMBER' }
                        ],
                        rows: [
                            { id: 'sim_01', sim_status: 'ACTIVE', throughput: 120 },
                            { id: 'sim_02', sim_status: 'IDLE', throughput: 0 },
                            { id: 'sim_03', sim_status: 'ERROR', throughput: 45 }
                        ]
                    }
                };
            }

            // 4. Fallback Final: Fantasma Sintético
            // AXIOMA: Mapeo de Arquetipo Dinámico para evitar Fantasmas ServiceView
            let ghostArchetype = 'SERVICE';
            if (targetId === 'NODE' || targetId === 'ADAPTER') ghostArchetype = 'NODE';
            else if (targetId === 'DATABASE') ghostArchetype = 'DATABASE';
            else if (targetId === 'VAULT' || targetId === 'FILES') ghostArchetype = 'VAULT';

            return {
                id: targetId,
                LABEL: `${targetId} (GHOST)`,
                ARCHETYPE: ghostArchetype,
                DOMAIN: 'SYNTHETIC',
                CAPABILITIES: {
                    "ping": { "io": "READ", "type": "SIGNAL", "desc": "Synthetic ping" },
                    "trace": { "io": "WRITE", "type": "LOG", "desc": "Log output" }
                },
                _isMock: true
            };
        }

        // 1. Buscar en la Ontología L0 (Cánones del Sistema)
        const canon = adapter.L0?.COMPONENT_REGISTRY?.[targetId] || compiler.getCanon(targetId);
        if (canon) return canon;

        // 2. Buscar en el Fenotipo (Instancias activas)
        const instance = state.phenotype.artifacts?.find(a => a.id === targetId);
        if (instance) return instance;

        // 3. Fallback: Proyección de Sombra Estructural
        return { id: targetId, LABEL: targetId.toUpperCase(), ARCHETYPE: targetId === 'VAULT' ? 'VAULT' : 'ADAPTER' };
    }, [targetId, labState.isMockEnabled, state.phenotype.artifacts]);

    const selectedId = selectedArtifact.id || selectedArtifact.ID;

    const isDnaOpen = state.phenotype.ui.dnaPanelOpen;
    const isChaosOpen = state.phenotype.ui.chaosPanelOpen;

    // Inicialización del Motor de Caos (Inyección de Dependencia)
    const chaosEngine = useMemo(() => createChaosEngine(execute), [execute]);

    if (!adapter.isIgnited) return (
        <div className="w-screen h-screen bg-[var(--bg-deep)] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-2 border-[var(--success)]/20 border-t-[var(--success)] rounded-full animate-spin"></div>
            <div className="text-[var(--success)] font-mono text-xs tracking-[0.4em] animate-pulse uppercase">
                Initialising Axiomatic Core...
            </div>
        </div>
    );

    return (
        <div className="w-full h-full relative overflow-hidden bg-[var(--bg-deep)] text-white font-sans">

            {/* HUD de Identidad Purificado: Delegado al SystemControlHood */}

            {/* COMANDANTE DE CAOS (Integrado en DevLabHood) */}

            {/* ZONA DE PROYECCIÓN (Generación de Interfaces) */}
            <ProjectionDeck
                componentId={selectedId}
                data={selectedArtifact}
                perspective={perspective}
                isTesting={isTesting}
                execute={execute}
            />

            {/* INSPECTOR DE GENOTIPO (Sub-Módulo de Estructura) */}
            <InspectorPanel
                state={state}
                execute={execute}
                selectedId={selectedId}
                isDnaOpen={isDnaOpen}
            />

            {/* ALMACÉN DE INGENIERÍA (DevLab Hood) */}
            <DevLabHood
                activeTarget={targetId}
                activePerspective={perspective}
                onSelectTarget={(id) => execute('SET_LAB_TARGET', id)}
                onSelectPerspective={(p) => execute('SET_LAB_PERSPECTIVE', p)}
                isMockEnabled={labState.isMockEnabled}
                onToggleMock={() => execute('TOGGLE_LAB_MOCK')}
                onToggleChaos={() => execute('TOGGLE_UI_PANEL', { panel: 'chaos' })}
                isChaosOpen={isChaosOpen}
                isTesting={isTesting}
                onRunChaosTest={() => chaosEngine.igniteChaosTest(setIsTesting)}
                onRunAudits={() => chaosEngine.v12SovereigntyAudit(setIsTesting)}
                onRunDiagnostic={() => execute('RUN_DIAGNOSTIC')}
            />

            {/* CONTROLES DE CAMPO (Delegados a SovereignSphere) */}
            {showSelector && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[var(--bg-deep)]/80 backdrop-blur-md" onClick={() => setShowSelector(false)}></div>
                    <div className="relative z-10 animate-in zoom-in-95 duration-300">
                        <AdapterSelector
                            onSelect={(id) => { execute('SET_LAB_TARGET', id); setShowSelector(false); }}
                            onClose={() => setShowSelector(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevLab;
