/**
 * 🛰️ TOPOLOGY SLICE (core/state/slices/TopologySlice.js)
 * Architecture: Layered Reality Reification.
 * Status: PURIFIED (Agnostic Node Mapping).
 */

import { Sanitizer } from '../../integrity/Sanitizer';

export const createTopologySlice = (set, get) => ({
    nodes: {},
    workspace: {},
    flows: {
        connections: []
    },
    layouts: {},
    sys: {},
    currentProject: null,
    systemStatus: 'CLEAN',

    setProject: (project) => set({ currentProject: project }),

    saveProject: async () => {
        const { nodes, layouts, flows, currentProject, addLog } = get();
        const { callCore } = await import('../../bridge/CoreBridge').then(m => m.default);

        if (!currentProject) {
            addLog('warn', 'TOPOLOGY >> No active project to save.');
            return;
        }

        addLog('info', `TOPOLOGY >> Saving snapshot to ${currentProject.name}...`);

        try {
            // 0. Pre-Save Topology Validation (Axiom of Integrity)
            const validation = await callCore('public', 'validateTopology', {
                steps: Object.entries(nodes).map(([id, n]) => ({
                    id,
                    adapter: n.instanceOf,
                    method: n.methods?.[0] || '', // Simple heuristic for validation
                    inputMapping: {} // Dry run validation
                }))
            });

            if (!validation.isValid) {
                addLog('critical', `TOPOLOGY >> Save Aborted: ${validation.error || 'Identity Violation'}`);
                return;
            }

            // 1. Persist Spatial Shadow via purified 'sensing' node
            await callCore('sensing', 'reconcileSpatialState', {
                folderId: currentProject.folderId,
                nodes: Object.entries(layouts).map(([id, pos]) => ({ id, x: pos.x, y: pos.y }))
            });

            // 2. Persist Logic via purified 'sensing' node
            await callCore('sensing', 'saveSnapshot', {
                type: 'project',
                folderId: currentProject.folderId,
                fileName: currentProject.name || 'main_topology.project.json',
                content: {
                    projectMeta: currentProject,
                    nodes,
                    flows
                }
            });

            addLog('success', 'TOPOLOGY >> Project Persisted to Core.');
        } catch (e) {
            addLog('error', `TOPOLOGY >> Save Failure: ${e.message}`);
        }
    },

    loadProject: async (fileId, name, folderId) => {
        const { addLog, clearTopology } = get();
        const { callCore } = await import('../../bridge/CoreBridge').then(m => m.default);

        clearTopology();
        addLog('info', `TOPOLOGY >> Distilling project ${name}...`);

        try {
            // 1. Get Spatial State (Shadow) via 'sensing'
            const spatial = await callCore('sensing', 'getSpatialState', { folderId });

            // 2. Get Logic via 'sensing'
            const projectData = await callCore('sensing', 'getSnapshot', { fileId });
            const content = projectData?.content || {};

            if (content.nodes) {
                set({
                    nodes: content.nodes,
                    flows: content.flows || { connections: [] },
                    layouts: spatial.nodes?.reduce((acc, n) => ({ ...acc, [n.id]: { x: n.x, y: n.y } }), {}) || {},
                    currentProject: { id: fileId, name, folderId },
                    systemStatus: 'ACTIVE'
                });
                addLog('success', `TOPOLOGY >> Project ${name} LOADED.`);
            } else {
                addLog('warn', `TOPOLOGY >> Project ${name} is empty or invalid.`);
            }
        } catch (e) {
            addLog('error', `TOPOLOGY >> Load Failure: ${e.message}`);
        }
    },

    hydrateTopology: (data) => {
        const sanitizedNodes = {};
        const rawNodes = data.nodes || [];
        const nodesArray = Array.isArray(rawNodes) ? rawNodes : Object.entries(rawNodes).map(([id, val]) => ({ ...val, uuid: val.uuid || id }));

        nodesArray.forEach((node) => {
            const uuid = node.uuid || node.u_id;
            sanitizedNodes[uuid] = Sanitizer.universalItem(node);
        });

        set({
            nodes: sanitizedNodes,
            workspace: data.workspace || {},
            sys: data.sys || {},
            flows: data.flows || {},
            layouts: data.layouts || {},
            systemStatus: 'ACTIVE',
            lastSync: new Date().toISOString()
        });
    },

    updateNode: (uuid, data) => {
        const store = get();
        const node = store.nodes[uuid] || { uuid, id: uuid };
        const updatedNode = Sanitizer.universalItem({ ...node, ...data, id: uuid });

        if (!updatedNode) return;

        set((state) => ({ nodes: { ...state.nodes, [uuid]: updatedNode } }));
        if (store.scheduleSync) store.scheduleSync();
    },

    updateLayout: (id, position) => {
        set((state) => ({ layouts: { ...state.layouts, [id]: position } }));
    },

    deleteNode: (uuid) => {
        const { nodes, flows } = get();
        const newNodes = { ...nodes };
        delete newNodes[uuid];
        const connections = flows?.connections || [];
        const newConnections = connections.filter(c => c.from !== uuid && c.to !== uuid);

        set({
            nodes: newNodes,
            flows: { ...flows, connections: newConnections },
            session: { ...get().session, selectedId: get().session.selectedId === uuid ? null : get().session.selectedId }
        });
    },

    addConnection: (connection) => {
        const store = get();
        const currentFlows = store.flows;
        const connections = currentFlows.connections || [];

        if (connections.find(c => c.from === connection.from && c.to === connection.to && c.fromPort === connection.fromPort && c.toPort === connection.toPort)) {
            return;
        }

        const newFlows = { ...currentFlows, connections: [...connections, connection] };
        set({ flows: newFlows });
        if (store.scheduleSync) store.scheduleSync();
    },

    deleteConnection: (id) => {
        const store = get();
        const { flows } = store;
        const connections = flows.connections || [];
        const newConnections = connections.filter(c => c.id !== id);
        set({ flows: { ...flows, connections: newConnections } });
        if (store.scheduleSync) store.scheduleSync();
    },

    clearTopology: () => {
        set({
            nodes: {},
            workspace: {},
            flows: {},
            layouts: {},
            session: { ...get().session, selectedId: null },
            systemStatus: 'CLEAN'
        });
    }
});
