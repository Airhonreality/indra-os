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

    const addStation = useCallback((type) => {
        const newStation = {
            id: `step_${workflow.stations.length + 1}`,
            type: type, // 'PROTOCOL', 'ROUTER', 'MAP'
            config: {},
            mapping: {}
        };
        setWorkflow(prev => ({
            ...prev,
            stations: [...prev.stations, newStation],
            updated_at: new Date().toISOString()
        }));
    }, [workflow.stations.length]);

    const removeStation = useCallback((id) => {
        setWorkflow(prev => ({
            ...prev,
            stations: prev.stations.filter(s => s.id !== id),
            updated_at: new Date().toISOString()
        }));
    }, []);

    const updateStation = useCallback((id, updates) => {
        setWorkflow(prev => ({
            ...prev,
            stations: prev.stations.map(s => s.id === id ? { ...s, ...updates } : s),
            updated_at: new Date().toISOString()
        }));
    }, []);

    return (
        <WorkflowContext.Provider value={{ workflow, addStation, removeStation, updateStation }}>
            {children}
        </WorkflowContext.Provider>
    );
}

export const useWorkflow = () => {
    const context = useContext(WorkflowContext);
    if (!context) throw new Error('useWorkflow must be used within a WorkflowProvider');
    return context;
};
