/**
 * 🛰️ INDRA SCENARIO HYDRATOR (core/integrity/ScenarioHydrator.js)
 * Architecture: Master Builder Layer.
 * Responsibility: Transforming raw logical manifests into hydrated spatial projections.
 */

export const ScenarioHydrator = {
    /**
     * Hydrates a logical scenario with contractual metadata and spatial coordinates.
     * @param {object} payload - Raw logic from AI or Library.
     * @param {object} storeState - Current Zustand state (contracts, nodes, etc.)
     */
    hydrate(payload, storeState) {
        const { contracts, nodes: existingNodes, layouts: existingLayouts } = storeState;

        const hydratedNodes = {};
        const newNodesAdded = [];

        // 1. Semantic Mapping & Contract Hydration
        Object.entries(payload.nodes || {}).forEach(([id, data]) => {
            // Find best fit in contracts (case insensitive + suffix normalization)
            const targetKey = Object.keys(contracts).find(k =>
                k.toLowerCase() === data.instanceOf.toLowerCase() ||
                k.toLowerCase().replace('adapter', '') === data.instanceOf.toLowerCase().replace('adapter', '')
            );

            const contract = contracts[targetKey] || { archetype: 'UNKNOWN', schemas: {} };

            hydratedNodes[id] = {
                ...contract,
                ...data,
                id: id,
                instanceOf: targetKey || data.instanceOf,
                uuid: id,
                methods: Object.keys(contract.schemas || {}),
                schemas: contract.schemas || {}
            };

            if (!existingNodes[id]) newNodesAdded.push(id);
        });

        return {
            nodes: hydratedNodes,
            newNodesAdded
        };
    },

    /**
     * DARMA-LAYOUT v2: Topological ranking for headless manifests.
     */
    calculateLayout(nodes, connections, existingLayouts = {}) {
        const layouts = {};
        const nodeIds = Object.keys(nodes);
        const ranks = {};
        nodeIds.forEach(id => ranks[id] = 0);

        // Rank adjustment (Tiers) based on logical flow
        let changed = true;
        for (let i = 0; i < 8 && changed; i++) {
            changed = false;
            connections.forEach(conn => {
                if (ranks[conn.to] <= ranks[conn.from]) {
                    ranks[conn.to] = ranks[conn.from] + 1;
                    changed = true;
                }
            });
        }

        // Spatial Constants
        const X_OFFSET = 380;
        const Y_OFFSET = 160;
        const START_X = 150;
        const START_Y = 150;

        // Find safe zone for new injection (prevent overlapping)
        let maxExistingX = 0;
        Object.values(existingLayouts).forEach(pos => { if (pos.x > maxExistingX) maxExistingX = pos.x; });
        const xBase = maxExistingX > 0 ? maxExistingX + 400 : START_X;

        const counters = {};
        nodeIds.forEach(id => {
            if (existingLayouts[id]) {
                layouts[id] = existingLayouts[id];
                return;
            }
            const r = ranks[id];
            counters[r] = (counters[r] || 0) + 1;

            layouts[id] = {
                x: xBase + (r * X_OFFSET),
                y: START_Y + (counters[r] * Y_OFFSET)
            };
        });

        return layouts;
    },

    /**
     * Fixes hallucinated ports based on contractual reality.
     */
    resolvePorts(conn, fromNode, toNode) {
        const fix = (node, port) => {
            if (!node || !node.methods) return port;
            if (port === 'output' && node.methods.length > 0) return node.methods[0];
            if (port === 'input' && node.methods.length > 0) return node.methods[0];

            // Fuzzy match
            const match = node.methods.find(m =>
                m.toLowerCase() === port.toLowerCase() ||
                m.toLowerCase().includes(port.toLowerCase())
            );
            return match || port;
        };

        return {
            ...conn,
            fromPort: fix(fromNode, conn.fromPort),
            toPort: fix(toNode, conn.toPort)
        };
    }
};

export default ScenarioHydrator;
