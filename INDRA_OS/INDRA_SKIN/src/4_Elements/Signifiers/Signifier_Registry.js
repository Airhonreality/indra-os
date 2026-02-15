/**
 * Signifier_Registry.js
 * 
 * DHARMA: El Diccionario Semiótico de INDRA.
 * Define las "Leyes Visuales" para los estados del sistema.
 */

export const SIGNIFIER_LAWS = {
    STATES: {
        IDLE: {
            label: 'IDLE',
            color: 'var(--text-dim)',
            pulseSpeed: '12s',
            glowIntensity: 0.1,
            resonanceFactor: 0
        },
        HYDRATING: {
            label: 'HYDRATING',
            color: 'var(--accent)',
            pulseSpeed: '2s',
            glowIntensity: 0.8,
            resonanceFactor: 1
        },
        RESONATING: {
            label: 'RESONATING',
            color: 'var(--accent-bright)',
            pulseSpeed: '0.8s',
            glowIntensity: 1.2,
            resonanceFactor: 2
        },
        SYNCED: {
            label: 'SYNCED',
            color: 'var(--success)',
            pulseSpeed: '8s',
            glowIntensity: 0.3,
            resonanceFactor: 0.5
        },
        ERROR: {
            label: 'ERROR',
            color: 'var(--error)',
            pulseSpeed: '0.3s',
            glowIntensity: 2.0,
            resonanceFactor: 3
        }
    }
};

export default SIGNIFIER_LAWS;



