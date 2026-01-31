/**
 * 🛠️ INDRA SANITIZER (core/integrity/Sanitizer.js)
 * Ensures data integrity for node atoms and connections.
 */

export const Sanitizer = {
    /**
     * Sanitizes a single node atom.
     */
    universalItem: (item) => {
        if (!item) return null;
        return {
            uuid: item.uuid || item.u_id || item.id || `ID_${Math.random().toString(36).substring(2, 9)}`,
            id: item.id || item.uuid || item.u_id || `ID_${Math.random().toString(36).substring(2, 9)}`,
            type: item.type || 'unknown_node',
            archetype: item.archetype || 'UNKNOWN',
            label: item.label || item.name || item.type || 'Unnamed Node',
            methods: item.methods || [],
            schemas: item.schemas || {},
            data: item.data || {},
            metadata: item.metadata || {},
            instanceOf: item.instanceOf,
            visualIntent: item.visualIntent,
            status: item.status || 'READY',
            lastUpdate: Date.now()
        };
    },

    /**
     * Sanitizes a connection.
     */
    connection: (conn) => {
        if (!conn.from || !conn.to) return null;
        return {
            id: conn.id || `CX_${Math.random().toString(36).substring(2, 9)}`,
            from: conn.from,
            to: conn.to,
            fromPort: conn.fromPort || 'out',
            toPort: conn.toPort || 'in',
            metadata: conn.metadata || {}
        };
    }
};
