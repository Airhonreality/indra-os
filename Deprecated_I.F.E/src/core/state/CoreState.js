import { create } from 'zustand';

/**
 * ⚡ FLUX STORE
 * Gestión de estado de alta frecuencia para el motor de partículas.
 * Desacoplado de PersistenceManager para evitar re-renders en la UI principal.
 */
export const useFluxStore = create((set, get) => ({
    activeFlows: new Set(), // UUIDs de conexiones activas (animándose)
    particles: [],          // Array de partículas vivas

    // Acciones de alto rendimiento (llamadas por CoreBridge/PersistenceManager)
    emitParticles: (connectionId, count = 5, color = '#00ff88') => {
        set(state => {
            const newParticles = [];
            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: Math.random().toString(36),
                    connectionId,
                    t: 0, // Tiempo 0.0 -> 1.0
                    speed: 0.01 + Math.random() * 0.01,
                    color,
                    offset: (Math.random() - 0.5) * 10 // Ruido lateral inicial
                });
            }
            return {
                particles: [...state.particles, ...newParticles],
                activeFlows: new Set(state.activeFlows).add(connectionId)
            };
        });
    },

    updateParticles: () => {
        set(state => {
            if (state.particles.length === 0) return {};

            const living = [];
            const finishedFlows = new Set(state.activeFlows);

            state.particles.forEach(p => {
                p.t += p.speed;
                if (p.t < 1.0) {
                    living.push(p);
                } else {
                    // Partícula murió (llegó a destino)
                    // Aquí podríamos disparar efecto de impacto
                }
            });

            // Limpieza de flujos activos si no quedan partículas
            // (Simplificado por ahora)

            return { particles: living };
        });
    }
}));
