/**
 * useSignifier.js
 * 
 * Capa de Transducción Semiótica (V8.4).
 * Convierte señales técnicas del Core en Significantes visuales para la Skin.
 * 
 * Objetivo: Eliminar la latencia subjetiva y centralizar la honestidad del estado.
 */
import useAxiomaticState from '../../state/AxiomaticState';
import { useAxiomaticStore } from '../../state/AxiomaticStore';

export const useSignifier = (nodeId) => {
    const { state } = useAxiomaticStore();
    const globalLoading = useAxiomaticState(s => s.session.isLoading);

    // 1. Obtención de señales crudas
    const metadata = state.phenotype.siloMetadata?.[nodeId] || {
        hydrationLevel: 0,
        status: 'IDLE',
        total: 0
    };

    const siloData = state.phenotype.silos?.[nodeId] || [];

    // 2. Transducción (Lógica de Significación)
    // AXIOMA: Un silo está "Sincronizado" solo si no está cargando Y tiene datos 
    // O si el Core ha emitido explícitamente el sello de 100% hidratación.

    let signifier = {
        label: 'IDLE',
        color: 'var(--text-dim)',
        progress: metadata.hydrationLevel,
        isHoneymoon: false, // Período de gracia post-carga para evitar flashes
        pulse: false
    };

    if (globalLoading && metadata.status === 'SCANNING') {
        signifier = {
            label: 'RESONATING',
            color: 'var(--accent)',
            progress: Math.max(metadata.hydrationLevel, 10), // Mínimo visual para honestidad
            pulse: true
        };
    } else if (siloData.length > 0 && metadata.hydrationLevel >= 100) {
        signifier = {
            label: 'SYNCED',
            color: 'var(--success)',
            progress: 100,
            pulse: false
        };
    } else if (globalLoading) {
        signifier = {
            label: 'HYDRATING',
            color: 'var(--accent-bright)',
            progress: metadata.hydrationLevel,
            pulse: true
        };
    }

    // 3. PoC: Sincronización con el Motor de Realidad (ISK)
    if (globalLoading && window.ISK_SIGNALS?.GLOBAL_RESONANCE !== undefined) {
        // El ISK sobreescribe el pulso con su cálculo físico
        signifier.iskResonance = window.ISK_SIGNALS.GLOBAL_RESONANCE;
        // Podemos incluso usarlo para que el color 'vibre'
        signifier.opacity = 0.5 + (window.ISK_SIGNALS.GLOBAL_RESONANCE * 0.5);
    }

    return {
        ...signifier,
        totalItems: siloData.length,
        metadata
    };
};
