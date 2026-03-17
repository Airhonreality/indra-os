/**
 * =============================================================================
 * ARTEFACTO: WorkflowDesigner/context/WorkflowContext.jsx
 * RESPONSABILIDAD: Gestión del estado del AST del Workflow (Zustand-like).
 * =============================================================================
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const WorkflowContext = createContext();

export function WorkflowProvider({ children, initialData = {} }) {
    const [workflow, setWorkflow] = useState({
        ...initialData,
        payload: {
            status: initialData.payload?.status || 'DRAFT',
            trigger: initialData.payload?.trigger || { type: 'SCHEMA_SUBMIT', source: null },
            stations: initialData.payload?.stations || [],
        }
    });

    const [selectedStationId, setSelectedStationId] = useState(null);

    const addStation = useCallback((type) => {
        const newStation = {
            id: `step_${(workflow.payload.stations || []).length + 1}`,
            type: type, // 'PROTOCOL', 'ROUTER', 'MAP'
            config: { label: `New ${type}` },
            mapping: {}
        };
        setWorkflow(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                stations: [...prev.payload.stations, newStation],
            },
            updated_at: new Date().toISOString()
        }));
    }, [workflow.payload.stations]);

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

    const updateTrigger = useCallback((trigger) => {
        setWorkflow(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                trigger: { ...prev.payload.trigger, ...trigger },
            },
            updated_at: new Date().toISOString()
        }));
    }, []);

    return (
        <WorkflowContext.Provider value={{
            workflow,
            addStation,
            removeStation,
            updateStation,
            moveStation,
            updateTrigger,
            selectedStationId,
            setSelectedStationId,
            setWorkflow
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
