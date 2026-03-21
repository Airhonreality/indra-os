import { useState, useEffect } from 'react';
import { executeDirective } from '../services/directive_executor';

/**
 * ============================================================================
 * ARTEFACTO: useIndraResource.js
 * RESPONSABILIDAD: Implementa el Agnostic Resource Protocol (ARP) en el Cliente.
 * Resuelve asíncronamente identificadores GRID (indra://...) a URLs físicas
 * consumibles por el navegador.
 * ============================================================================
 */
export function useIndraResource(gridId) {
    const [resolvedUrl, setResolvedUrl] = useState(gridId);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        if (gridId && typeof gridId === 'string' && gridId.startsWith('indra://')) {
            setIsLoading(true);
            executeDirective('system', 'RESOURCE_RESOLVE', gridId)
                .then(response => {
                    if (isMounted) {
                        if (response.metadata?.status === 'OK' && response.metadata?.url) {
                            setResolvedUrl(response.metadata.url);
                        } else {
                            // Fallback al grid (mostrará roto o un placeholder)
                            setResolvedUrl(gridId);
                        }
                        setIsLoading(false);
                    }
                })
                .catch(err => {
                    if (isMounted) {
                        console.error('[ARP] Error resolviendo recurso:', err);
                        setIsLoading(false);
                    }
                });
        } else {
            // No es un GRID, probablemente sea una URL normal legado.
            setResolvedUrl(gridId);
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [gridId]);

    return { url: resolvedUrl, isLoading };
}
