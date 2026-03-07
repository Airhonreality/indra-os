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
import { executeDirective } from '../../../services/directive_executor';

export function useBridgeHydration(bridgeAtom, coreUrl, sessionSecret) {
    const [localAtom, setLocalAtom] = useState(bridgeAtom);
    const [schemas, setSchemas] = useState({}); // id -> { fields: [], label: '' }
    const [isLoading, setIsLoading] = useState(true);
    const hasInitialHydrated = useRef(false);

    // 1. Carga inicial del Átomo Completo (Dharma de Sinceridad)
    useEffect(() => {
        if (hasInitialHydrated.current) return;

        const hydrateBridge = async () => {
            try {
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_READ',
                    context_id: bridgeAtom.id
                }, coreUrl, sessionSecret);

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
    }, [bridgeAtom.id, coreUrl, sessionSecret]);

    // 2. Hidratación de Esquemas Externos (The Wiring)
    // Detecta fuentes y destinos y pide sus headers si no los tiene.
    useEffect(() => {
        const sources = localAtom.payload?.sources || [];
        const targets = localAtom.payload?.targets || [];
        const allExternalIds = [...new Set([...sources, ...targets])];

        allExternalIds.forEach(id => {
            if (schemas[id]) return; // Ya hidratado

            const fetchSchema = async () => {
                try {
                    const result = await executeDirective({
                        provider: 'system',
                        protocol: 'TABULAR_STREAM', // Protocolo canónico para obtener headers
                        context_id: id
                    }, coreUrl, sessionSecret);

                    if (result.fields) {
                        setSchemas(prev => ({
                            ...prev,
                            [id]: {
                                fields: result.fields,
                                label: result.label || 'EXTERNAL_SILO'
                            }
                        }));
                    }
                } catch (err) {
                    console.error(`[BridgeHydration] Schema fetch failed for ${id}:`, err);
                }
            };
            fetchSchema();
        });
    }, [localAtom.payload?.sources, localAtom.payload?.targets, coreUrl, sessionSecret, schemas]);

    return {
        localAtom,
        setLocalAtom,
        schemas,
        isLoading
    };
}
