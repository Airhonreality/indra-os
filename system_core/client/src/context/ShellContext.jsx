import React, { createContext, useContext } from 'react';
import { useAppState } from '../state/app_state';

const ShellContext = createContext();

/**
 * ShellContext (Capa de UI Global)
 * Orquestación de navegación, lenguaje y artefactos activos.
 */
export function ShellProvider({ children }) {
    const activeArtifact = useAppState(s => s.activeArtifact);
    const openArtifact = useAppState(s => s.openArtifact);
    const closeArtifact = useAppState(s => s.closeArtifact);
    const lang = useAppState(s => s.lang);

    const value = {
        activeArtifact,
        openArtifact,
        closeArtifact,
        lang
    };

    return (
        <ShellContext.Provider value={value}>
            {children}
        </ShellContext.Provider>
    );
}

export const useShell = () => {
    const context = useContext(ShellContext);
    if (!context) throw new Error('useShell must be used within a ShellProvider');
    return context;
};
