import React, { createContext, useContext } from 'react';
import { useAppState } from '../state/app_state';

const WorkspaceContext = createContext();

/**
 * WorkspaceContext (Capa de Dominio)
 * Administra el catálogo de workspaces, pins y catálogos de datos.
 */
export function WorkspaceProvider({ children }) {
    const workspaces = useAppState(s => s.workspaces);
    const activeWorkspaceId = useAppState(s => s.activeWorkspaceId);
    const pins = useAppState(s => s.pins);
    const services = useAppState(s => s.services);
    const loadingKeys = useAppState(s => s.loadingKeys);

    const setActiveWorkspace = useAppState(s => s.setActiveWorkspace);
    const loadPins = useAppState(s => s.loadPins);
    const pinAtom = useAppState(s => s.pinAtom);
    const unpinAtom = useAppState(s => s.unpinAtom);
    const createArtifact = useAppState(s => s.createArtifact);
    const hydrateManifest = useAppState(s => s.hydrateManifest);
    const renameWorkspace = useAppState(s => s.renameWorkspace);
    const deleteWorkspace = useAppState(s => s.deleteWorkspace);
    const createWorkspace = useAppState(s => s.createWorkspace);
    const updatePinIdentity = useAppState(s => s.updatePinIdentity);

    const value = {
        workspaces,
        activeWorkspaceId,
        pins,
        services,
        loadingKeys,
        setActiveWorkspace,
        loadPins,
        pinAtom,
        unpinAtom,
        deleteWorkspace,
        renameWorkspace,
        createArtifact,
        hydrateManifest,
        createWorkspace,
        updatePinIdentity
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
    return context;
};
