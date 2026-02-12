import { useState, useEffect } from 'react';
import bridge from '../../kernel/SovereignBridge';
import useAxiomaticState from '../../state/AxiomaticState';

/**
 * useAxiomaticSense
 * Dharma: Permitir que un componente "sienta" su estado desde el Core.
 * @param {object} entity - El nodo de la ley (átomo o sub-módulo) que define la fuente.
 */
export const useAxiomaticSense = (entity) => {
    const globalLoading = useAxiomaticState(s => s.session.isLoading);
    const [data, setData] = useState(entity?.atoms || entity?.options || []);
    const [localLoading, setLocalLoading] = useState(!!entity?.data_source);
    const [error, setError] = useState(null);

    const isLoading = globalLoading || localLoading;

    useEffect(() => {
        if (!entity?.data_source) return;

        const hydrate = async () => {
            setLocalLoading(true);
            try {
                // Pasamos data_params (como filtros de contrato) al Bridge
                const resolvedData = await bridge.resolveDataSource(entity.data_source, entity.data_params || {});
                setData(resolvedData);
            } catch (err) {
                setError(err);
                console.error(`🚫 [useAxiomaticSense] Fallo al hidratar ${entity?.id || 'NODE'}:`, err);
            } finally {
                setLocalLoading(false);
            }
        };

        hydrate();
    }, [entity?.data_source, entity?.id, JSON.stringify(entity?.data_params)]);

    return { data, isLoading, error };
};
