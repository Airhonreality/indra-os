/**
 * ♻️ ISK: OBJECT POOL MANAGER
 * Gestiona el reciclaje de nodos espaciales para evitar picos de Garbage Collection (GC).
 * Un nodo no se destruye, se marca como inactivo y se reutiliza.
 */

export class ObjectPool {
    constructor() {
        this.pools = new Map(); // Tipo -> Array de objetos inactivos
        this.activeNodes = new Map(); // ID -> Nodo activo
    }

    /**
     * Obtiene un nodo del pool o crea uno nuevo si está vacío.
     * @param {string} type - Tipo de nodo (ej: 'circle', 'arc')
     * @param {string} id - ID único para el nodo activo
     */
    get(type, id) {
        if (!this.pools.has(type)) {
            this.pools.set(type, []);
        }

        const pool = this.pools.get(type);
        let node;

        if (pool.length > 0) {
            node = pool.pop();
            node.isActive = true;
        } else {
            node = this._createNodePrimitive(type);
        }

        node.id = id;
        this.activeNodes.set(id, node);
        return node;
    }

    /**
     * Devuelve un nodo al pool.
     * @param {string} id - ID del nodo a liberar
     */
    release(id) {
        const node = this.activeNodes.get(id);
        if (!node) return;

        node.isActive = false;
        this._resetNodeState(node);

        const pool = this.pools.get(node.type);
        pool.push(node);

        this.activeNodes.delete(id);
    }

    /**
     * Libera todos los nodos activos de una vez.
     */
    releaseAll() {
        for (const id of this.activeNodes.keys()) {
            this.release(id);
        }
    }

    _createNodePrimitive(type) {
        // Estructura base de un nodo ISK (Data-Oriented)
        return {
            type,
            id: null,
            isActive: true,
            geometry: {},
            physiology: {
                bindings: [],
                uniforms: {}
            },
            _internal: {
                instanceId: -1, // ID para el Instanced Rendering en L3
                dirty: true
            }
        };
    }

    _resetNodeState(node) {
        // Limpia el estado para evitar leakage de datos entre usos
        node.geometry = {};
        node.physiology.bindings = [];
        node.physiology.uniforms = {};
        node._internal.dirty = true;
    }
}



