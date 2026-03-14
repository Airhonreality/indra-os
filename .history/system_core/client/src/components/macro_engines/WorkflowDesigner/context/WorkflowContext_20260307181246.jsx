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
        id: initialData.id || 'wf_temp',
        trigger: initialData.trigger || { type: 'SCHEMA_SUBMIT', source: null },
        stations: initialData.stations || [],
        updated_at: new Date().toISOString()
    });

    const [selectedStationId, setSelectedStationId] = useState(null);

    const addStation = useCallback((type) => {
        const newStation = {
            id: `step_${workflow.stations.length + 1}`,
            type: type, // 'PROTOCOL', 'ROUTER', 'MAP'
            config: { label: `New ${type}` },
            mapping: {}
        };
        setWorkflow(prev => ({
            ...prev,
            stations: [...prev.stations, newStation],
            updated_at: new Date().toISOString()
        }));
    }, [workflow.stations.length]);

    const removeStation = useCallback((id) => {
        if (selectedStationId === id) setSelectedStationId(null);
        setWorkflow(prev => ({
            ...prev,
            stations: prev.stations.filter(s => s.id !== id),
            updated_at: new Date().toISOString()
        }));
    }, [selectedStationId]);

    const updateStation = useCallback((id, updates) => {
        setWorkflow(prev => ({
            ...prev,
            stations: prev.stations.map(s => s.id === id ? { ...s, ...updates } : s),
            updated_at: new Date().toISOString()
        }));
    }, []);

    const moveStation = useCallback((index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= workflow.stations.length) return;

        setWorkflow(prev => {
            const newStations = [...prev.stations];
            const temp = newStations[index];
            newStations[index] = newStations[newIndex];
            newStations[newIndex] = temp;
            return {
                ...prev,
                stations: newStations,
                updated_at: new Date().toISOString()
            };
        });
    }, [workflow.stations]);

    return (
        <WorkflowContext.Provider value={{
            workflow,
            addStation,
            removeStation,
            updateStation,
            moveStation,
            selectedStationId,
            setSelectedStationId
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
