import { createContext, useContext, useState, useEffect } from 'react';
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
    const openServiceManager = useAppState(s => s.openServiceManager);
    const closeArtifact = useAppState(s => s.closeArtifact);
    const lang = useAppState(s => s.lang);

    // Global Style Engine State
    const [isStyleEngineOpen, setIsStyleEngineOpen] = useState(false);
    
    // Función para obtener el tema del sistema
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    
    const [theme, setTheme] = useState(localStorage.getItem('indra-theme') || getSystemTheme());
    const [pendingReturns, setPendingReturns] = useState(new Map());

    useEffect(() => {
        const handleMessage = (event) => {
            const { type, payload, request_id } = event.data || {};

            if (type === 'INDRA_UI_INVOKE' && request_id) {
                // 1. Guardamos la ruta de retorno
                setPendingReturns(prev => new Map(prev).set(request_id, {
                    source: event.source,
                    origin: event.origin
                }));

                if (payload.module === 'SERVICE_MANAGER') {
                    openServiceManager();
                    return;
                }

                // 2. Abrimos el artefacto solicitado
                // El payload suele traer { module: 'CLASS', data: { ...atom } }
                openArtifact({
                    class: payload.module,
                    id: payload.payload?.id || 'temp_invoke',
                    ...payload.payload,
                    _invoke_id: request_id // Marcamos que es una invocación
                });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [openArtifact]);

    // Interceptor de cierre para devolver datos
    const closeArtifactAndReturn = (resultData = null) => {
        const invokeId = activeArtifact?._invoke_id;
        
        if (invokeId && pendingReturns.has(invokeId)) {
            const { source, origin } = pendingReturns.get(invokeId);
            source.postMessage({
                type: 'INDRA_UI_RESPONSE',
                request_id: invokeId,
                payload: {
                    status: 'SUCCESS',
                    data: resultData || activeArtifact.payload // Devolvemos el estado actual
                }
            }, origin);
            
            setPendingReturns(prev => {
                const next = new Map(prev);
                next.delete(invokeId);
                return next;
            });
        }
        
        closeArtifact();
    };

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
        closeArtifact: closeArtifactAndReturn,
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
