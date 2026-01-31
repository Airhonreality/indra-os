/**
 * 🎬 INDRA SCENARIO SERVICE (core/integrity/ScenarioService.js)
 * Architecture: Programmatic Morphogenesis.
 */

import { useCoreStore } from '../state/CoreStore';
import { ScenarioHydrator } from './ScenarioHydrator';

// 📚 Pre-fabricated Mission Payloads (The "Library")
export const SCENARIOS = {
    DRIVE_TO_SHEET: {
        name: "Sync: Drive to Sheet",
        nodes: {
            "drive-source": {
                id: "drive-source",
                instanceOf: "sensing",
                label: "DRIVE_SOURCE",
                archetype: "ADAPTER",
                visualIntent: "READ"
            },
            "csv-parser": {
                id: "csv-parser",
                instanceOf: "text",
                label: "CSV_PARSER",
                archetype: "LOGIC_NODE",
                visualIntent: "EXECUTE"
            },
            "sheet-sink": {
                id: "sheet-sink",
                instanceOf: "sensing",
                label: "SHEET_SINK",
                archetype: "ADAPTER",
                visualIntent: "WRITE"
            }
        },
        layouts: {
            "drive-source": { x: 100, y: 100 },
            "csv-parser": { x: 450, y: 150 },
            "sheet-sink": { x: 800, y: 100 }
        },
        connections: [
            {
                id: "conn-1",
                from: "drive-source", fromPort: "retrieve",
                to: "csv-parser", toPort: "buildText",
                metadata: { affinity: 1.0 }
            },
            {
                id: "conn-2",
                from: "csv-parser", fromPort: "result",
                to: "sheet-sink", toPort: "store",
                metadata: { affinity: 1.0 }
            }
        ]
    },
    TEMPORAL_WAKEUP: {
        name: "Automation: Temporal Trigger",
        nodes: {
            "weekly-timer": {
                id: "weekly-timer",
                instanceOf: "ENTRY_POINT",
                label: "MONDAY_9AM",
                archetype: "TEMPORAL_GATE",
                visualIntent: "TIME"
            },
            "report-generator": {
                id: "report-generator",
                instanceOf: "text",
                label: "REPORT_GEN",
                archetype: "LOGIC_NODE"
            }
        },
        layouts: {
            "weekly-timer": { x: 150, y: 300 },
            "report-generator": { x: 600, y: 300 }
        },
        connections: [
            { id: "conn-3", from: "weekly-timer", fromPort: "trigger", to: "report-generator", toPort: "buildText" }
        ]
    }
};

export const ScenarioService = {
    /**
     * INJECT_SCENARIO: Entry point for both full library scenarios and AI delta logic.
     */
    injectScenario(keyOrJson, isSurgical = false) {
        const scenarioData = typeof keyOrJson === 'string' ? SCENARIOS[keyOrJson] : keyOrJson;
        if (!scenarioData) {
            console.error('INVALID_SCENARIO:', keyOrJson);
            return;
        }

        const store = useCoreStore.getState();
        const { addLog } = store;

        console.log(`🚀 [ScenarioService] Reifying: ${scenarioData.name || 'AI_LOGIC'} (Mode: ${isSurgical ? 'SURGICAL' : 'FULL_REPLACE'})`);

        // 1. Morphogenesis: Hydrate Nodes
        const hydration = ScenarioHydrator.hydrate(scenarioData, store);
        const finalNodes = isSurgical ? { ...store.nodes, ...hydration.nodes } : hydration.nodes;

        // 2. Wiring: Resolve Ports
        const finalConnections = isSurgical ? [...(store.flows?.connections || [])] : [];
        (scenarioData.connections || []).forEach(rawConn => {
            const corrected = ScenarioHydrator.resolvePorts(rawConn, finalNodes[rawConn.from], finalNodes[rawConn.to]);

            const conn = {
                ...corrected,
                id: corrected.id || `conn-${Math.random().toString(36).substr(2, 5)}`
            };

            const exists = finalConnections.some(c => c.from === conn.from && c.to === conn.to && c.fromPort === conn.fromPort);
            if (!exists) finalConnections.push(conn);
        });

        // 3. Topology: Calculate Auto-Layout
        let finalLayouts = isSurgical ? { ...store.layouts } : {};
        if (hydration.newNodesAdded.length > 0) {
            const calculated = ScenarioHydrator.calculateLayout(finalNodes, finalConnections, isSurgical ? store.layouts : {});
            finalLayouts = { ...finalLayouts, ...calculated };
        }

        // 4. Atomic Execution
        if (!isSurgical) store.clearTopology();

        store.hydrateTopology({
            nodes: finalNodes,
            layouts: finalLayouts,
            flows: { connections: finalConnections }
        });

        addLog('success', `NEURAL_SYNC >> Workspace ${isSurgical ? 'Augmented' : 'Syncronized'}.`);
    },

    // Programmatic Tools for manual UI/Testing
    addNode: (contractId, label, pos) => {
        const store = useCoreStore.getState();
        const uuid = `node-${Date.now()}`;
        const contract = store.contracts[contractId] || { archetype: 'UNKNOWN' };
        store.updateNode(uuid, { ...contract, label, instanceOf: contractId });
        store.updateLayout(uuid, pos);
        return uuid;
    },

    addWire: (from, fromPort, to, toPort) => {
        const store = useCoreStore.getState();
        store.addConnection({
            id: `conn-${Date.now()}`,
            from, fromPort, to, toPort,
            metadata: { affinity: 1.0 }
        });
    }
};

// 🌏 Global Attachment for external manipulation
if (typeof window !== 'undefined') {
    window.indra = {
        scenarios: SCENARIOS,
        inject: ScenarioService.injectScenario,
        service: ScenarioService
    };
}

export default ScenarioService;
