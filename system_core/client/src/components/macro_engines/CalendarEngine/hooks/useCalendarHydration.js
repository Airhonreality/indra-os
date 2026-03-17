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
    const [account, setAccount] = useState(null); // Identidad de sesión
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

            // 0. Resolver Identidad (Sinceridad de Sesión)
            const accountResponse = await bridge.execute('ACCOUNT_RESOLVE', {
                provider: atom.provider
            });
            if (accountResponse.metadata?.status === 'OK') {
                setAccount(accountResponse.items?.[0] || null);
            }

            // 1. Descubrir Calendarios (Silos)
            console.log('[UCP] Solicitando HIERARCHY_TREE...', atom.provider);
            const hierarchyResponse = await bridge.execute('HIERARCHY_TREE', {
                provider: atom.provider,
                context_id: atom.id
            });
            console.log('[UCP] HIERARCHY_TREE Respuesta:', hierarchyResponse);

            if (hierarchyResponse.metadata?.status === 'OK') {
                setCalendars(hierarchyResponse.items || []);
            } else {
                console.warn('[UCP] Error al cargar jerarquía', hierarchyResponse);
                setError(`FALLO_DE_TELEMETRIA: ${hierarchyResponse.metadata?.error || 'Respuesta vacía'}`);
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
                console.warn('[UCP] Error en stream de eventos', streamResponse);
            }
        } catch (err) {
            setError(`ERROR_SISTEMICO: ${err.message}`);
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
        account,
        loading,
        error,
        refresh: pull
    };
}
