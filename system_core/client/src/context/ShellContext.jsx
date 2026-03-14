import React, { createContext, useContext, useState, useEffect } from 'react';
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

    // Global Style Engine State
    const [isStyleEngineOpen, setIsStyleEngineOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('indra-theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('indra-theme', theme);
    }, [theme]);

    const value = {
        activeArtifact,
        openArtifact,
        closeArtifact,
        lang,
        isStyleEngineOpen,
        setIsStyleEngineOpen,
        theme,
        setTheme
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
