/**
 * =============================================================================
 * tools.slice.js
 * RESPONSABILIDAD: Gestión de Motores Agnósticos e Ingesta Pública.
 * AXIOMA: Soporte para flujos "GUEST" y herramientas libres sin workspace.
 * =============================================================================
 */

export const createToolsSlice = (set, get) => ({
    activeTool: null,           // null | 'MIE' | 'INGEST_GUEST' | 'INGEST_EXPIRED' | 'SILO_GUEST'
    ingestSessionToken: null,   // Payload decodificado del link de ingesta
    
    /**
     * Activa un motor agnóstico en modo pantalla completa
     */
    openToolEngine: (engineId) => {
        console.log(`[IndraTools] Activando Motor Libre: ${engineId}`);
        set({ activeTool: engineId });
    },

    /**
     * Cierra el motor activo y vuelve a la Landing
     */
    closeTool: () => {
        set({ activeTool: null, ingestSessionToken: null });
        // Limpiamos el hash de la URL si era un link de ingesta o silo
        if (window.location.hash.startsWith('#/ingest') || window.location.hash.startsWith('#/silo')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    },
    
    /**
     * Parsea y valida un token de sesión de ingesta pública
     */
    openIngestSession: (rawToken) => {
        try {
            // En un ecosistema real, esto sería un JWT. Para el prototipo rápido, es Base64 JSON.
            const payload = JSON.parse(atob(rawToken));
            
            // Verificación de expiración
            if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) {
                console.warn("[IndraTools] Sesión de ingesta expirada.");
                set({ activeTool: 'INGEST_EXPIRED' });
                return;
            }
            const isSiloShare = payload.mode === 'SILO_SHARE';
            console.info(`[IndraTools] Sesión de Ingesta Validada: ${payload.label}`);
            set({ 
                activeTool: isSiloShare ? 'SILO_GUEST' : 'INGEST_GUEST', 
                ingestSessionToken: payload 
            });
        } catch (err) {
            console.error("[IndraTools] Error decodificando sesión de ingesta:", err);
            set({ activeTool: 'INGEST_EXPIRED' });
        }
    }
});
