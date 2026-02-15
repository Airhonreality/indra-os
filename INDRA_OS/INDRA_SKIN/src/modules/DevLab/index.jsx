import React, { useState, useMemo } from 'react';
import { useAxiomaticStore } from '../../core/state/AxiomaticStore';
import adapter from '../../core/Sovereign_Adapter';
import ProjectionMatrix from '../../core/kernel/ProjectionMatrix';
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
import { createForensicEngine } from './engines/ForensicEngine';
import { createDeterminismEngine } from './engines/DeterminismEngine';

/**
 * DevLab: El entorno soberano de desarrollo e ingeniería.
 * Arquitectura Folderizada (V12.5) - Modular y Agnóstica.
 */
const DevLab = () => {
    const { state, dispatch, execute } = useAxiomaticStore();
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

    // AXIOMA: Resolución de Artefacto Televisado (Reality Switch)
    // AXIOMA: Soberanía del Estado (The State Is The Truth)
    const selectedArtifact = useMemo(() => {
        // 1. PRIMERA DIRECTIVA: ¿Es un Prototipo del Garage inyectado o solicitado?
        const garageKey = targetId.startsWith('garage_') ? targetId.split('_')[1].toUpperCase() : targetId.toUpperCase();
        const garagePrototype = MOCK_GENOTYPE.GARAGE_PROTOTYPES?.[garageKey] || MOCK_GENOTYPE.GARAGE_PROTOTYPES?.[targetId.toUpperCase()];

        if (garagePrototype) {
            return {
                ...garagePrototype,
                id: targetId,
                _isGhost: true,
                _isMock: true,
                LABEL: garagePrototype.LABEL || `${garageKey} (PROTOTYPE)`
            };
        }

        // 2. SEGUNDA DIRECTIVA: ¿Existe ya en el Fenotipo (Real)?
        const instance = state.phenotype.artifacts?.find(a => a.id === targetId);
        if (instance) return instance;

        // 3. TERCERA DIRECTIVA: ¿Es un Canon del Sistema (L0)?
        const canon = adapter.L0?.COMPONENT_REGISTRY?.[targetId] || compiler.getCanon(targetId);
        if (canon) return canon;

        // 4. CUARTA DIRECTIVA: Mock de Fallback por mapeo de motor
        const engineToMockMap = {
            'VAULT': 'DRIVE', 'DATABASE': 'DATABASE', 'NODE': 'NODE',
            'COMMUNICATION': 'EMAIL', 'REALITY': 'COSMOS', 'SLOT': 'SLOT_MANAGER'
        };
        const mockId = engineToMockMap[targetId.toUpperCase()] || targetId;
        const fallback = MOCK_GENOTYPE.COMPONENT_REGISTRY[mockId] || MOCK_GENOTYPE.COMPONENT_REGISTRY[mockId.toUpperCase()];

        if (fallback) {
            return { ...fallback, id: targetId, _isMock: true, LABEL: `${fallback.LABEL} (FALLBACK)` };
        }

        // 5. ÚLTIMO RECURSO: Proyección de Sombra
        return { id: targetId, LABEL: targetId.toUpperCase(), ARCHETYPE: targetId === 'VAULT' ? 'VAULT' : 'ADAPTER' };
    }, [targetId, labState.isMockEnabled, state.phenotype.artifacts]);

    const selectedId = selectedArtifact.id || selectedArtifact.ID;

    const isDnaOpen = state.phenotype.ui.dnaPanelOpen;
    const isChaosOpen = state.phenotype.ui.chaosPanelOpen;

    // Inicialización del Motor de Caos (Inyección de Dependencia)
    const chaosEngine = useMemo(() => createChaosEngine(execute), [execute]);
    const forensicEngine = useMemo(() => createForensicEngine(dispatch, execute), [dispatch, execute]);
    const determinismEngine = useMemo(() => createDeterminismEngine(dispatch, execute, state), [dispatch, execute, state]);

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
                activeArchetype={selectedArtifact?.ARCHETYPE}
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
                onRunTrace={() => {
                    const isNotionUuid = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(selectedId);
                    const isDatabase = targetId === 'DATABASE' || selectedArtifact.ARCHETYPE === 'DATABASE';

                    if (selectedId && (isDatabase || isNotionUuid)) {
                        console.log(`[DevLab] 🛰️ Launching Sovereign Trace for: ${selectedId}`);
                        execute('TRACE_SOVEREIGN_DATABASE', { databaseId: selectedId, nodeId: 'notion' });
                    } else {
                        console.warn(`[DevLab] ⚠️ Trace Blocked: ID ${selectedId} does not look like a Database.`, { targetId, archetype: selectedArtifact.ARCHETYPE });
                        execute('LOG_ENTRY', { msg: "⚠️ Selecciona una Database de Notion para trazar.", type: 'WARNING' });
                    }
                }}
                onRunForensics={() => {
                    if (selectedId) {
                        forensicEngine.igniteForensicChain(selectedId);
                    } else {
                        execute('LOG_ENTRY', { msg: "⚠️ Selecciona un artefacto para la autopsia.", type: 'WARNING' });
                    }
                }}
                onRunDeterminismProbe={() => determinismEngine.probeDeterminismIntegrity(setIsTesting)}
                execute={execute}
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



