/**
 * =============================================================================
 * HOOK: useAtomCatalog.js
 * DOGMA: Un Solo Punto de Verdad y Coherencia de Nivel 1
 * =============================================================================
 * Hook global que todos los engines consumen para listar, filtrar e importar átomos.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../state/app_state';
import { executeDirective } from '../services/directive_executor';
import { MetaComposer } from '../services/MetaComposer';

/**
 * Hook centralizado para gestionar el catálogo de átomos.
 * @param {string} atomClass - Clase a filtrar (ej: 'DATA_SCHEMA', 'WORKFLOW')
 * @param {string} mode - 'WORKSPACE' (solo pins) | 'IMPORT' (cross-workspace)
 */
export function useAtomCatalog({ atomClass, mode = 'WORKSPACE' } = {}) {
    const { 
        coreUrl, 
        sessionSecret, 
        pins, 
        googleUser, 
        activeWorkspaceId,
        createArtifact 
    } = useAppState();
    
    const [atoms, setAtoms]       = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]       = useState(null);

    const loadContent = useCallback(async () => {
        if (!coreUrl || !sessionSecret) return;

        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'WORKSPACE') {
                // AXIOMA DE COHERENCIA NIVEL 1: Solo mostramos lo que está anclado en el Workspace activo.
                const pinnedIds = (pins || [])
                    .filter(p => !atomClass || p.class === atomClass)
                    .map(p => p.id);
                
                if (pinnedIds.length === 0) {
                    setAtoms([]);
                    setIsLoading(false);
                    return;
                }

                // AXIOMA DE PLURALIZACIÓN DETERMINISTA: El Core espera nombres específicos para 
                // mapear a las carpetas físicas de Drive (schemas, workflows, etc.).
                const pluralContextMap = {
                    'DATA_SCHEMA': 'schemas',
                    'WORKFLOW': 'workflows',
                    'WORKSPACE': 'workspaces',
                    'DOCUMENT': 'documents'
                };
                const pluralContext = pluralContextMap[atomClass] || (atomClass?.toLowerCase() + 's') || 'atoms';

                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_READ',
                    context_id: pluralContext,
                    query:  { ids: pinnedIds }
                }, coreUrl, sessionSecret);
                
                setAtoms(result.items || []);

            } else if (mode === 'IMPORT') {
                // MODO IMPORTACIÓN: Buscamos átomos de otros Workspaces marcados como compartidos.
                const result = await executeDirective({
                    provider:    'system',
                    protocol:    'ATOM_LIST_QUERY', // Cambiar a ATOM_LIST si el core ya soporta filtros
                    query: { 
                        class: atomClass, 
                        is_shared: true,
                        exclude_workspace: activeWorkspaceId
                    }
                }, coreUrl, sessionSecret);
                
                setAtoms(result.items || []);
            }
        } catch (e) {
            console.error('[useAtomCatalog] Error:', e);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [coreUrl, sessionSecret, pins, mode, atomClass, activeWorkspaceId]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    /**
     * Importa un átomo forzando la clonación del linaje (Axioma de Linaje).
     */
    const importAtomToWorkspace = useCallback(async (originAtom) => {
        if (!coreUrl || !sessionSecret) return;
        
        // --- ADUANA DE LINAJE ---
        const clonedData = MetaComposer.clone(originAtom, { userId: googleUser?.email });
        
        // createArtifact hace el ATOM_CREATE y el pinAtom en una sola ejecución optimista en app_state.
        // Solo necesitamos pasarle los datos ya cristalizados con _meta.
        await createArtifact(clonedData.class, clonedData.handle?.label, clonedData.payload, clonedData._meta);
        
        // Recargar el catálogo local si estamos en modo WORKSPACE
        if (mode === 'WORKSPACE') {
            loadContent();
        }
    }, [coreUrl, sessionSecret, googleUser, createArtifact, mode, loadContent]);

    return { 
        atoms, 
        isLoading, 
        error, 
        refresh: loadContent,
        importAtom: importAtomToWorkspace 
    };
}
