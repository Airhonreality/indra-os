import { useState, useEffect } from 'react';

/**
 * =============================================================================
 * HOOK: useCalendarHydration
 * RESPONSABILIDAD: Resolución de identidades y mezcla de realidades temporales.
 * AXIOMA: Es el punto de contacto entre el Frontend y el Universal Calendar Provider.
 * =============================================================================
 */
export function useCalendarHydration(atom, bridge) {
    const [events, setEvents] = useState([]);
    const [calendars, setCalendars] = useState([]); // Silos descubiertos
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const pull = async (query = {}) => {
        setLoading(true);
        setError(null);
        try {
            // AXIOMA: Siempre traemos un margen de seguridad temporal (Ej. -30 a +30 días)
            // para que el usuario reciba retroalimentación visual inmediata.
            const now = new Date();
            const start = new Date(now); start.setDate(start.getDate() - 30);
            const end = new Date(now); end.setDate(end.getDate() + 30);

            const streamQuery = {
                start: start.toISOString(),
                end: end.toISOString(),
                ...query
            };

            // 1. Descubrir Calendarios (Silos)
            const hierarchyResponse = await bridge.execute('HIERARCHY_TREE', {
                provider: atom.provider,
                context_id: atom.id
            });

            if (hierarchyResponse.metadata?.status === 'OK') {
                setCalendars(hierarchyResponse.items || []);
            }

            // 2. Sincronizar Realidades (Stream de eventos por defecto del primary)
            const streamResponse = await bridge.execute('TABULAR_STREAM', {
                provider: atom.provider,
                context_id: atom.id,
                query: streamQuery
            });

            if (streamResponse.metadata?.status === 'OK') {
                setEvents(streamResponse.items || []);
            } else {
                setError(streamResponse.metadata?.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Hidratación inicial
    useEffect(() => {
        if (atom?.id && bridge) pull();
    }, [atom?.id]);

    return {
        events,
        calendars,
        loading,
        error,
        refresh: pull
    };
}
