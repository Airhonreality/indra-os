/**
 * 🛠️ INDRA DIAGNOSTIC PARSER (core/diagnostics/DiagnosticParser.js)
 * Processes telemetry and system commands for the Console projection.
 */

const unwrapData = (data) => {
    // Basic unwrapping: return .v if exists, else return data
    if (data && typeof data === 'object' && data.v !== undefined) return data.v;
    return data;
};

const extractNodeData = (node) => {
    return node?.data || {};
};

export const DiagnosticParser = {
    /**
     * Calculates technical anatomy of a node.
     */
    getNodeAnatomy: (node, nodes, flows) => {
        const inputs = (flows?.connections || [])
            .filter(c => c.to === node.u_id || c.to === node.uuid)
            .map(c => ({ from: nodes[c.from]?.name || 'Unknown', port: c.toPort }));

        return {
            inputs,
            internalData: unwrapData(node.data || {}),
            extractedOutput: extractNodeData(node)
        };
    },

    /**
     * Global Registry Stats.
     */
    getGlobalStats: (nodes, flows, workspace, session) => {
        return {
            nodeCount: Object.keys(nodes).length,
            connectionCount: (flows?.connections || []).length,
            workspaceCount: Object.keys(workspace).length,
            lastSync: session?.lastSync || 'NEVER'
        };
    },

    /**
     * Logs filter by severity.
     */
    filterLogs: (logs, type) => {
        return logs.filter(l => l.type === type);
    }
};
