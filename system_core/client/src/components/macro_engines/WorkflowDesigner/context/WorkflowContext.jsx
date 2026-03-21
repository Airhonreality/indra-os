/**
 * =============================================================================
 * ARTEFACTO: WorkflowDesigner/context/WorkflowContext.jsx
 * RESPONSABILIDAD: Gestión del estado del AST del Workflow (Zustand-like).
 * =============================================================================
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { executeDirective } from '../../../../services/directive_executor';
import { useAppState } from '../../../../state/app_state';
import { useWorkflowHydration } from '../useWorkflowHydration';

const WorkflowContext = createContext();

function generateStationId(prefix = 'step') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function getStationDefaults(type, index) {
    const baseLabel = `${type}_${index + 1}`;
    if (type === 'PROTOCOL') {
        return {
            label: baseLabel,
            provider: 'system',
            protocol: 'ATOM_READ',
            context_id: '',
            query: {},
            data: {}
        };
    }

    if (type === 'ROUTER') {
        return {
            label: baseLabel,
            route: {
                leftPath: '',
                operator: '==',
                rightValue: '',
                on_true: '',
                on_false: ''
            }
        };
    }

    return {
        label: baseLabel,
        pruning: []
    };
}

function normalizeTrigger(trigger = {}) {
    const source = trigger.source || null;
    const sourceId = trigger.source_id || source?.id || null;
    return {
        type: trigger.type || 'MANUAL',
        source,
        source_id: sourceId,
        label: trigger.label || source?.handle?.label || '',
        config: trigger.config || {}
    };
}

export function WorkflowProvider({ children, initialData = {}, bridge }) {
    const [workflow, setWorkflow] = useState({
        ...initialData,
        payload: {
            status: initialData.payload?.status || 'DRAFT',
            trigger: normalizeTrigger(initialData.payload?.trigger || { type: 'SCHEMA_SUBMIT', source: null }),
            stations: initialData.payload?.stations || [],
        }
    });

    const [isSaving, setIsSaving] = useState(false);
    const { isLoading, integrityMap } = useWorkflowHydration(workflow);
    const [selectedStationId, setSelectedStationId] = useState(null);

    const saveWorkflow = useCallback(async () => {
        if (!bridge) {
            console.error('[WorkflowContext] BRIDGE_NOT_FOUND for save operation');
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        
        // AXIOMA: Delegamos al Bridge para cumplir con ADR-001 (limpieza de ID/Class)
        // y para asegurar que el guardado use el Alias actual tras un renombrado.
        try {
            await bridge.save(workflow);
            // Re-hidratar el workflow activo para asegurar sincronía
            setWorkflow({ ...workflow });
        } catch (error) {
            console.error("[WorkflowContext] Error al guardar:", error);
        } finally {
            setIsSaving(false);
        }
    }, [workflow, bridge, isSaving]);

    const addStation = useCallback((type) => {
        setWorkflow(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                stations: [
                    ...(prev.payload.stations || []),
                    {
                        id: generateStationId('step'),
                        type,
                        config: getStationDefaults(type, (prev.payload.stations || []).length),
                        mapping: {},
                        depends_on: [],
                        export_as: `step_${(prev.payload.stations || []).length + 1}`
                    }
                ],
            },
            updated_at: new Date().toISOString()
        }));
    }, []);

    const removeStation = useCallback((id) => {
        if (selectedStationId === id) setSelectedStationId(null);
        setWorkflow(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                stations: prev.payload.stations.filter(s => s.id !== id),
            },
            updated_at: new Date().toISOString()
        }));
    }, [selectedStationId]);

    const updateStation = useCallback((id, updates) => {
        setWorkflow(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                stations: prev.payload.stations.map(s => s.id === id ? { ...s, ...updates } : s),
            },
            updated_at: new Date().toISOString()
        }));
    }, []);

    const moveStation = useCallback((index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= (workflow.payload.stations || []).length) return;

        setWorkflow(prev => {
            const newStations = [...prev.payload.stations];
            const temp = newStations[index];
            newStations[index] = newStations[newIndex];
            newStations[newIndex] = temp;
            return {
                ...prev,
                payload: {
                    ...prev.payload,
                    stations: newStations,
                },
                updated_at: new Date().toISOString()
            };
        });
    }, [workflow.payload.stations]);

    const updateTrigger = useCallback((triggerUpdates) => {
        setWorkflow(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                trigger: normalizeTrigger({ ...(prev.payload.trigger || {}), ...triggerUpdates }),
            },
            updated_at: new Date().toISOString()
        }));
    }, []);

    const removeTrigger = useCallback(() => {
        if (selectedStationId === 'trigger') setSelectedStationId(null);
        setWorkflow(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                trigger: null,
            },
            updated_at: new Date().toISOString()
        }));
    }, [selectedStationId]);

    return (
        <WorkflowContext.Provider value={{
            workflow,
            addStation,
            removeStation,
            updateStation,
            moveStation,
            updateTrigger,
            removeTrigger,
            selectedStationId,
            setSelectedStationId,
            setWorkflow,
            saveWorkflow,
            isSaving,
            isLoading,
            integrityMap
        }}>
            {children}
        </WorkflowContext.Provider>
    );
}

export const useWorkflow = () => {
    const context = useContext(WorkflowContext);
    if (!context) throw new Error('useWorkflow must be used within a WorkflowProvider');
    return context;
};
