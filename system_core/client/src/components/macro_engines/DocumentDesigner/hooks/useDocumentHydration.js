/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/hooks/useDocumentHydration.js
 * RESPONSABILIDAD: Hidratación de Slots de datos desde el contexto del Workspace.
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useAppState } from '../../../../state/app_state';

const flattenFields = (fields = [], acc = []) => {
    fields.forEach((field) => {
        acc.push(field);
        if (Array.isArray(field.children) && field.children.length > 0) {
            flattenFields(field.children, acc);
        }
    });
    return acc;
};

const normalizeFieldType = (type) => {
    if (!type) return 'TEXT';
    return String(type).toUpperCase();
};

const buildSlotListFromSchema = (schemaAtom, sourceId) => {
    const schemaFields = Array.isArray(schemaAtom?.payload?.fields)
        ? schemaAtom.payload.fields
        : [];

    const sourceAlias = schemaAtom?.handle?.label || schemaAtom?.label || schemaAtom?.handle?.alias || sourceId;
    const seen = new Set();

    return flattenFields(schemaFields).reduce((slots, field, index) => {
        const alias = field?.handle?.alias || field?.alias || field?.id;
        if (!alias || seen.has(alias)) return slots;

        const humanLabel = field?.handle?.label || field?.label || alias;

        seen.add(alias);
        slots.push({
            id: `${sourceId}-${field?.id || alias}-${index}`,
            label: humanLabel,
            type: normalizeFieldType(field?.type),
            origin: sourceAlias
        });
        return slots;
    }, []);
};

export function useDocumentHydration(atom, bridge) {
    const { pins } = useAppState();
    const [slots, setSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const hydrate = async () => {
            setIsLoading(true);

            try {
                const connectedSources = Array.isArray(atom?.payload?.sources)
                    ? atom.payload.sources
                    : [];

                if (connectedSources.length === 0) {
                    if (!isCancelled) setSlots([]);
                    return;
                }

                const hydratedSchemas = await Promise.all(connectedSources.map(async (sourceId) => {
                    const pinnedSchema = (pins || []).find((pin) => pin.id === sourceId);
                    if (pinnedSchema?.payload?.fields) return pinnedSchema;

                    if (!bridge?.request) return null;

                    try {
                        const readResult = await bridge.request({ protocol: 'ATOM_READ', context_id: sourceId });
                        const sourceAtom = readResult?.items?.[0];
                        if (sourceAtom?.payload?.fields) return sourceAtom;
                    } catch (_) {
                        // Fallback below
                    }

                    try {
                        const streamResult = await bridge.request({ protocol: 'TABULAR_STREAM', context_id: sourceId });
                        const streamColumns = streamResult?.metadata?.schema?.columns;
                        if (Array.isArray(streamColumns) && streamColumns.length > 0) {
                            return {
                                id: sourceId,
                                handle: {
                                    alias: streamResult?.metadata?.schema?.name || sourceId,
                                    label: streamResult?.metadata?.schema?.name || sourceId
                                },
                                payload: {
                                    fields: streamColumns.map((column, index) => ({
                                        id: column?.id || column?.name || `col_${index}`,
                                        type: column?.type || 'TEXT',
                                        handle: {
                                            alias: column?.alias || column?.id || column?.name || `col_${index}`,
                                            label: column?.label || column?.name || column?.id || `col_${index}`
                                        }
                                    }))
                                }
                            };
                        }
                    } catch (_) {
                        // Silent: this source will be skipped if unresolved.
                    }

                    return null;
                }));

                const nextSlots = hydratedSchemas
                    .filter(Boolean)
                    .flatMap((schemaAtom) => buildSlotListFromSchema(schemaAtom, schemaAtom.id));

                if (!isCancelled) {
                    setSlots(nextSlots);
                }
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        hydrate();

        return () => {
            isCancelled = true;
        };
    }, [atom?.id, atom?.payload?.sources, pins, bridge]);

    return { slots, isLoading };
}
