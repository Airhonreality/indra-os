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
export function useWorkflowHydration(workflow, bridge) {
    const [integrityMap, setIntegrityMap] = useState(() => {
        // T=0: Intentar cargar resonancia previa del Vault
        if (bridge?.vault && workflow?.id) {
            return bridge.vault.read(`workflow_integrity_${workflow.id}`) || {};
        }
        return {};
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyDependencies = async () => {
            if (!bridge) return;

            // 1. Recolectar todas las dependencias
            const depIds = new Set();
            const triggerSourceId = workflow.payload?.trigger?.source_id || workflow.payload?.trigger?.source?.id;
            if (triggerSourceId) depIds.add(triggerSourceId);

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
                // 2. Ejecución Soberana via Bridge
                const result = await bridge.execute({
                    provider: 'system',
                    protocol: 'ATOM_EXISTS',
                    data: { ids: Array.from(depIds) }
                }, { vaultKey: `workflow_integrity_${workflow.id}` });

                const map = {};
                (result.items || []).forEach(item => {
                    if (item.type === 'PROBE') {
                        map[item.ref_id] = item.status === 'EXISTS';
                    }
                });
                setIntegrityMap(map);
            } catch (err) {
                console.error('[WorkflowHydration] Integrity check failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (workflow?.id && bridge) verifyDependencies();
    }, [workflow.id, (workflow.payload?.stations?.length || 0), bridge]);

    return { integrityMap, isLoading };
}
