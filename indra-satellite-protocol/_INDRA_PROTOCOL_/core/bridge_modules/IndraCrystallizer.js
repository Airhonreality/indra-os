/**
 * =============================================================================
 * INDRA CRYSTALLIZER SERVICE
 * =============================================================================
 * Responsibilidad: Consolidación del ADN en archivos físicos.
 */

export class IndraCrystallizer {
    /**
     * Cristaliza el estado actual del Bridge en un archivo .js
     */
    static crystalize(bridge) {
        if (!bridge) return null;

        const contract = {
            satellite_name: bridge.contract.satellite_name,
            core_id: bridge.contract.core_id,
            ignitions: bridge.ignitions,
            synced_at: new Date().toISOString()
        };

        const fileContent = `/**
 * =============================================================================
 * INDRA CONTRACT SNAPSHOT (Crystalized DNA)
 * =============================================================================
 */
export const INDRA_CONTRACT = ${JSON.stringify(contract, null, 4)};
`;
        return fileContent;
    }

    /**
     * Intenta guardar la configuración vía API de desarrollo (Vite)
     * Si falla (Producción), dispara la descarga del archivo.
     */
    static async saveSession(bridge) {
        const payload = {
            satellite_name: bridge.contract.satellite_name,
            core_id: bridge.contract.core_id,
            ignitions: bridge.ignitions
        };

        try {
            // Intento vía API Local (Zero Friction)
            const response = await fetch('/api/indra/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log("💎 [Crystallizer] ADN grabado directamente en indra_config.js");
                return { mode: 'LOCAL_FS', status: 'OK' };
            }
        } catch (e) {
            console.warn("[Crystallizer] API Local no disponible. Recurriendo a Descarga de Snapshot.");
        }

        // Fallback: Descarga de archivo
        const code = this.crystalize(bridge);
        const blob = new Blob([code], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'indra_contract.js';
        a.click();
        URL.revokeObjectURL(url);
        
        return { mode: 'DOWNLOAD', status: 'OK' };
    }
}
