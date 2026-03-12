/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/useBridgeHydration.js
 * RESPONSABILIDAD: Alambrado protocolar del Bridge con el Core GAS.
 *
 * DHARMA:
 *   - Sometimiento Total: No inventa esquemas; los pide vía TABULAR_STREAM.
 *   - Reactividad en Cascada: Resuelve fuentes y destinos en paralelo.
 * =============================================================================
 */
import { useState, useEffect, useRef } from 'react';
import { DataProjector } from '../../../services/DataProjector';
import { useAppState } from '../../../state/app_state';

export function useBridgeHydration(bridgeAtom, bridge) {
    const { pins, services } = useAppState();
    const [localAtom, setLocalAtom] = useState(bridgeAtom);
    const [schemas, setSchemas] = useState({}); // id -> { fields: [], label: '' }
    const [isLoading, setIsLoading] = useState(true);
    const hasInitialHydrated = useRef(false);

    // 1. Carga inicial del Átomo Completo (Dharma de Sinceridad)
    useEffect(() => {
        if (hasInitialHydrated.current) return;

        const hydrateBridge = async () => {
            try {
                const result = await bridge.read();

                if (result.items?.[0]) {
                    setLocalAtom(result.items[0]);
                    hasInitialHydrated.current = true;
                }
            } catch (err) {
                console.error('[BridgeHydration] Bridge READ failed:', err);
            } finally {
                setIsLoading(false);
            }
        };
        hydrateBridge();
    }, [bridgeAtom.id, bridge]);

    // 2. Hidratación de Esquemas Externos (The Wiring)
    // Detecta fuentes y destinos y pide sus headers si no los tiene.
    useEffect(() => {
        const sources = localAtom.payload?.sources || [];
        const targets = localAtom.payload?.targets || [];
        const allExternalIds = [...new Set([...sources, ...targets])];

        allExternalIds.forEach(id => {
            if (schemas[id]) return; // Ya hidratado

            const getProviderForId = (targetId) => {
                const pin = pins?.find(p => p.id === targetId);
                if (pin) return pin.provider;
                const service = services?.find(s => s.id === targetId);
                if (service) return service.provider || service.id;
                return 'system'; // Fallback
            };

            const fetchSchema = async () => {
                try {
                    const result = await bridge.request({
                        protocol: 'TABULAR_STREAM',
                        context_id: id
                    });

                    if (result.metadata?.status === 'ERROR') {
                        // PORTAL DE SINCERIDAD: El schema no existe o no responde.
                        // _orphan:true cierra el ciclo con el mismo semántico que ArtifactCard.
                        setSchemas(prev => ({
                            ...prev,
                            [id]: { fields: [], label: 'MATERIA_DESAPARECIDA', error: true, _orphan: true }
                        }));
                        return;
                    }

                    const projection = DataProjector.projectSchema(result);
                    setSchemas(prev => ({ ...prev, [id]: projection }));
                } catch (err) {
                    console.error(`[BridgeHydration] Schema fetch failed for ${id}:`, err);
                    setSchemas(prev => ({
                        ...prev,
                        [id]: { fields: [], label: 'FETCH_ERROR', error: true, _orphan: true }
                    }));
                }
            };
            fetchSchema();
        });
    }, [localAtom.payload?.sources, localAtom.payload?.targets, bridge, schemas]);

    return {
        localAtom,
        setLocalAtom,
        schemas,
        isLoading
    };
}
