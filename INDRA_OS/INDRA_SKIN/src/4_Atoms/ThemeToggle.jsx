/**
 * CAPA 4: ATOMS
 * ThemeToggle.jsx
 * DHARMA: Control de tema visual (light/dark).
 * AXIOMA: Usa localStorage para persistencia y aplica data-theme al <html>.
 */

import React, { useEffect } from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';

const ThemeToggle = () => {
    const { state, execute } = useAxiomaticStore();
    const theme = state.sovereignty.theme;

    // The useEffect below is no longer needed to set local state.
    // The AxiomaticStore should handle initial theme loading and setting state.sovereignty.theme.
    // However, if the store doesn't initialize data-theme on the DOM, we might need a useEffect
    // to apply the store's theme to the DOM on initial render or theme changes.
    // For now, assuming the store or a global effect handles initial DOM application.
    // If not, a useEffect like this might be needed:
    /*
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    */

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';

        // Aplicar al DOM
        document.documentElement.setAttribute('data-theme', newTheme);

        // Persistir
        localStorage.setItem('INDRA_THEME', newTheme);

        // Actualizar el Store Axiomático
        execute('SET_THEME', { theme: newTheme });

        console.log(`[Theme] Switched to: ${newTheme}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-tighter opacity-50">
                Theme
            </span>
            <button
                onClick={toggleTheme}
                className="
                    px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]
                    border rounded-full transition-all duration-500 relative overflow-hidden group
                    bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] 
                    hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]
                "
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
                <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)]"></span>
                    {theme.toUpperCase()}
                </div>
            </button>
        </div>
    );
};

export default ThemeToggle;
