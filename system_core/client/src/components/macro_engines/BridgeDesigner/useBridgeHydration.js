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
    // AXIOMA DE SINCERIDAD: Confianza plena en el Orquestador.
    // El átomo ya viene hidratado desde app_state.js (Aduana de Sinceridad).
    const [localAtom, setLocalAtom] = useState(bridgeAtom);
    const [schemas, setSchemas] = useState({}); // id -> { fields: [], label: '' }
    const [isLoading, setIsLoading] = useState(false);

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
                let projection = null;
                try {
                    const provider = getProviderForId(id);
                    // 1. INTENTO DE SINCERIDAD MÁXIMA (ATOM_READ)
                    const isLocalAtom = pins?.some(p => p.id === id) || provider === 'system';

                    if (isLocalAtom) {
                        try {
                            const atomResult = await bridge.request({ protocol: 'ATOM_READ', context_id: id });
                            // AXIOMA DE SINCERIDAD: La materia está en el Átomo (items[0]), no en el sobre.
                            const sourceAtom = atomResult?.items?.[0];
                            
                            if (sourceAtom?.payload?.fields) {
                                projection = DataProjector.projectSchema(sourceAtom);
                            }
                        } catch (e) {
                            console.warn(`[BridgeHydration] ATOM_READ falló para ${id}, saltando a STREAM.`);
                        }
                    }

                    // 2. DETERMINISMO DINÁMICO (TABULAR_STREAM)
                    if (!projection) {
                        const streamResult = await bridge.request({ protocol: 'TABULAR_STREAM', context_id: id });
                        if (streamResult.metadata?.status === 'ERROR') {
                            setSchemas(prev => ({
                                ...prev,
                                [id]: { fields: [], label: 'MATERIA_DESAPARECIDA', error: true, _orphan: true }
                            }));
                            return;
                        }
                        projection = DataProjector.projectSchema(streamResult);
                    }

                    setSchemas(prev => ({ ...prev, [id]: projection }));
                } catch (err) {
                    console.error(`[BridgeHydration] Error fatal hidratando ${id}:`, err);
                    setSchemas(prev => ({
                        ...prev,
                        [id]: { fields: [], label: 'ERROR_DE_SINCERIDAD', error: true, _orphan: true }
                    }));
                }
            };
            fetchSchema();
        });
    }, [localAtom.payload?.sources, localAtom.payload?.targets, bridge, schemas]);

    return { localAtom, setLocalAtom, schemas, isLoading };
}
