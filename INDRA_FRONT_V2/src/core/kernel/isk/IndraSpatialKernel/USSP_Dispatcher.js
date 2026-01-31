import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * ⚡ ISK: USSP DISPATCHER (v1.0)
 * React Hook para que los componentes de la interfaz emitan cambios espaciales.
 * Maneja el empaquetado del protocolo y el throttling inicial.
 */
export const useUSSPDispatcher = (bridge) => {

    /**
     * Envía una actualización de propiedad para una entidad espacial.
     * @param {string} targetId - UUID de la entidad.
     * @param {string} property - Propiedad a cambiar (u_pos, u_opacity, etc).
     * @param {any} value - Nuevo valor.
     * @param {Object} options - Opciones de persistencia (0: Volatile, 1: Deferred, 2: Immediate).
     */
    const dispatch = useCallback((targetId, property, value, options = { persistence: 1 }) => {
        if (!bridge) return;

        const packet = {
            version: "1.0",
            header: {
                msg_id: uuidv4(),
                timestamp: Date.now(),
                source: 0, // UI Source
                priority: options.priority || 1
            },
            payload: {
                action: "SET",
                target_id: targetId,
                property: property,
                value: value
            },
            integrity: {
                persistence: options.persistence
            }
        };

        return bridge.processMessage(packet);
    }, [bridge]);

    return { dispatch };
};

export default useUSSPDispatcher;
