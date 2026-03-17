/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/WorkflowDesigner/useWorkflowHydration.js
 * RESPONSABILIDAD: Portal de Sinceridad para el motor de Workflows.
 *
 * DHARMA:
 *   - Verificación de Dependencias: Valida que los Schemas y Bridges existan.
 *   - Señalización de Orfandad: Marca estaciones con dependencias muertas.
 * =============================================================================
 */
import { useState, useEffect } from 'react';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';

export function useWorkflowHydration(workflow) {
    const { coreUrl, sessionSecret } = useAppState();
    const [integrityMap, setIntegrityMap] = useState({}); // { id: boolean }
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyDependencies = async () => {
            // 1. Recolectar todas las dependencias (IDs de Schemas y Bridges)
            const depIds = new Set();
            if (workflow.payload?.trigger?.source_id) depIds.add(workflow.payload.trigger.source_id);

            (workflow.payload?.stations || []).forEach(s => {
                if (s.config?.bridge_id) depIds.add(s.config.bridge_id);
                if (s.config?.schema_id) depIds.add(s.config.schema_id);
                if (s.context_id) depIds.add(s.context_id);
            });

            if (depIds.size === 0) {
                setIsLoading(false);
                return;
            }

            try {
                // 2. Usar el nuevo protocolo ATOM_EXISTS (Portal de Sinceridad)
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_EXISTS',
                    data: { ids: Array.from(depIds) }
                }, coreUrl, sessionSecret);

                const map = {};
                (result.items || []).forEach(item => {
                    map[item.id] = item.exists;
                });
                setIntegrityMap(map);
            } catch (err) {
                console.error('[WorkflowHydration] Integrity check failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (workflow?.id) verifyDependencies();
    }, [workflow.id, (workflow.payload?.stations?.length || 0), coreUrl, sessionSecret]);

    return { integrityMap, isLoading };
}
