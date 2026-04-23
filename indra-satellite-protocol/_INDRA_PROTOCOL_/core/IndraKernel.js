/**
 * =============================================================================
 * ARTEFACTO: IndraKernel.js
 * CAPA: Core Orchestration (v16.0)
 * AXIOMA: Hidratación Bajo Demanda (On-Demand Hydration)
 * =============================================================================
 */
import { AgnosticVault, PersistencePolicy } from './bridge_modules/AgnosticVault.js';


export class IndraKernel {
    constructor(bridge) {
        this.bridge = bridge;
        this.vault = new AgnosticVault(bridge);
        this.bridge.vault = this.vault; // Nexus Simbiótico
        
        console.log("💎 [IndraKernel] El núcleo industrial v16.0 ha despertado.");
        this._setupListeners();
    }

    _setupListeners() {
        // En v16.0 ya no hidratamos todo al arrancar. 
        // Solo escuchamos el estado de la red para estar listos.
        window.addEventListener('indra-resonance-sync', (e) => {
            const { mode } = e.detail;
            if (mode === 'STABLE' || mode === 'READY') {
                console.log("🌊 [IndraKernel] Conexión estable. En espera de demanda.");
            }
        });
    }

    /**
     * HIDRATACIÓN BAJO DEMANDA (v16.0)
     * Realiza el TABULAR_STREAM solo cuando el desarrollador o la UI lo solicitan.
     * @param {string} alias - Alias del esquema a hidratar.
     * @param {Object} options - { force: boolean, policy: PersistencePolicy }
     */
    async hydrateSchema(alias, options = {}) {
        const schemaAlias = String(alias).trim();
        
        // Evitar duplicación si ya tenemos datos en Vault y no es forzado
        if (!options.force && this.vault.get(schemaAlias)) {
            console.log(`⚡ [IndraKernel] Usando datos persistidos para: ${schemaAlias}`);
            return this.vault.get(schemaAlias);
        }

        console.log(`📥 [IndraKernel] Iniciando hidratación profunda para: ${schemaAlias}`);
        
        try {
            const silo = this.bridge.resolveSilo(schemaAlias);
            
            const response = await this.bridge.execute({
                protocol: 'TABULAR_STREAM',
                provider: silo.provider,
                context_id: silo.id,
                workspace_id: this.bridge.activeWorkspaceId
            });

            if (response.items) {
                // El Vault decide si persiste basado en la política
                const policy = options.policy || PersistencePolicy.VOLATILE;
                this.vault.commit(schemaAlias, response.items, policy);
                
                return response.items;
            }
        } catch (e) {
            console.error(`❌ [IndraKernel] Error de hidratación en "${schemaAlias}":`, e.message);
            throw e;
        }
    }
}
