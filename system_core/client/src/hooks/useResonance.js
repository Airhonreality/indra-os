/**
 * =============================================================================
 * INDRA PORTAL RETURN HOOK (v1.1)
 * =============================================================================
 * @dharma "La confirmación es el cierre del nexo."
 * Este hook provee una interfaz para que cualquier motor de Indra
 * pueda emitir resultados hacia el satélite llamador.
 */

import { useShell } from '../context/ShellContext';

export const useResonance = () => {
    const { activeArtifact, closeArtifact } = useShell();

    /**
     * Emite el resultado final hacia el satélite y cierra el portal.
     * @param {any} data - Datos a enviar. Si es null, envía el payload del artefacto.
     */
    const emitResult = (data = null) => {
        if (!activeArtifact) return;

        console.log(`[useResonance] Emitiendo resultado desde: ${activeArtifact.class}`);
        
        // Devolvemos los datos a través del sistema de cierre de la Shell
        closeArtifact(data || activeArtifact.payload);
    };

    return {
        emitResult, // Antes: resonate
        isInvokeMode: !!activeArtifact?._invoke_id,
        activeArtifact
    };
};
