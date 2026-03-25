import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from '../state/app_state';

const ShellContext = createContext();
import { IndraContextMenu } from '../components/utilities/IndraContextMenu';

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
    
    // Función para obtener el tema del sistema
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    
    const [theme, setTheme] = useState(localStorage.getItem('indra-theme') || getSystemTheme());

    useEffect(() => {
        // Escuchador de cambios en el sistema si el usuario no ha forzado un tema manualmente
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const handleChange = (e) => {
            if (!localStorage.getItem('indra-theme')) {
                setTheme(e.matches ? 'light' : 'dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Context Menu Management
    const [contextMenu, setContextMenu] = useState(null);

    const openContextMenu = (e, options) => {
        if (e && e.preventDefault) e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            options
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        // Solo persistimos si el valor actual difiere de la preferencia del sistema 
        // o si ya existía una preferencia manual previa.
        if (localStorage.getItem('indra-theme') || theme !== getSystemTheme()) {
            localStorage.setItem('indra-theme', theme);
        }
    }, [theme]);

    const value = {
        activeArtifact,
        openArtifact,
        closeArtifact,
        lang,
        isStyleEngineOpen,
        setIsStyleEngineOpen,
        theme,
        setTheme,
        openContextMenu,
        closeContextMenu
    };

    return (
        <ShellContext.Provider value={value}>
            {children}
            {contextMenu && (
                <IndraContextMenu 
                    menu={contextMenu} 
                    onClose={closeContextMenu} 
                />
            )}
        </ShellContext.Provider>
    );
}

export const useShell = () => {
    const context = useContext(ShellContext);
    if (!context) throw new Error('useShell must be used within a ShellProvider');
    return context;
};
