/**
 * =============================================================================
 * INDRA CONTRACT CORTEX (Agnostic JS Edition v3.2.3)
 * =============================================================================
 * Responsibilidad: Gestión del ADN local vía ES Modules Nativos.
 * =============================================================================
 */

export class ContractCortex {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * @dharma Carga el contrato y la configuración vía Módulos JS Dinámicos y Resonancia en Vivo.
     * v5.0: Capacidad de sincronización directa con el Core si el contrato local falla.
     */
    async load() {
        const base = window.location.origin;
        const protocolPath = '/_INDRA_PROTOCOL_';
        
        try {
            // 1. Cargar Configuración de Ciudadanía (Identidad)
            let config = {};
            try {
                const configModule = await import(/* @vite-ignore */ `${base}${protocolPath}/indra_config.js?t=${Date.now()}`);
                config = configModule.INDRA_CONFIG || {};
            } catch (importErr) {
                console.warn("[ContractCortex:v5] indra_config.js no detectado. Usando memoria volátil.");
            }

            // 2. Cargar Contrato Maestro (Snapshot o Live)
            let contract = { schemas: [], workflows: [] };
            let usedLiveSync = false;

            try {
                const contractModule = await import(/* @vite-ignore */ `${base}${protocolPath}/indra_contract.js?t=${Date.now()}`);
                contract = contractModule.INDRA_CONTRACT || contract;
                console.log("🛰️ [Cortex] Snapshot de contrato cargado con éxito.");
            } catch (contractErr) {
                console.warn("[Cortex] No se detectó 'indra_contract.js'. Intentando Live Resonance...");
                
                // LIVE RESONANCE: Si no hay contrato local, pedimos la verdad al Core directamente
                if (this.bridge.coreUrl && this.bridge.satelliteToken) {
                    try {
                        const liveManifest = await this.bridge.execute({ 
                            protocol: 'SYSTEM_MANIFEST', 
                            provider: 'system' 
                        });
                        const liveSchemas = await this.bridge.execute({ 
                            protocol: 'SYSTEM_CONFIG_SCHEMA', 
                            provider: 'system' 
                        });

                        contract = {
                            synced_at: new Date().toISOString(),
                            core_id: liveManifest.metadata?.core_id || 'unknown',
                            core_version: liveManifest.metadata?.core_version || 'unknown',
                            capabilities: {
                                protocols: [...new Set((liveManifest.items || []).flatMap(i => i.protocols || []))],
                                providers: (liveManifest.items || []).filter(i => i.class === 'SILO').map(s => s.id),
                                workspaces: (liveManifest.items || []).filter(i => i.class === 'WORKSPACE').map(w => ({ id: w.id, label: w.handle?.label }))
                            },
                            schemas: liveSchemas.items || [],
                            workflows: []
                        };
                        usedLiveSync = true;
                        console.log("⚡ [Cortex] Live Resonance establecida. Verdad obtenida del Core.");
                    } catch (liveErr) {
                        console.error("[Cortex] Falló Live Resonance. El satélite está huérfano.", liveErr);
                    }
                }
            }

            // 3. Inyección de Soberanía
            this.bridge.contract = contract;
            this.bridge.contract.satellite_name = config.satellite_name || contract.satellite_name || 'Satélite Anónimo';
            this.bridge.contract.core_id = config.core_id || contract.core_id;
            
            if (config.workspace_id) {
                this.bridge.activeWorkspaceId = config.workspace_id;
            } else if (!this.bridge.activeWorkspaceId) {
                // Buscamos en las llaves estándar de Indra (v5.0 compatible)
                const manualLink = JSON.parse(localStorage.getItem('INDRA_SATELLITE_LINK') || '{}');
                this.bridge.activeWorkspaceId = manualLink.workspaceId || localStorage.getItem('INDRA_ACTIVE_WORKSPACE');
            }

            // 4. Restauración de Materia (Igniciones)
            const savedIgnitions = config.ignitions || JSON.parse(localStorage.getItem('INDRA_IGNITIONS') || '{}');
            this.bridge.ignitions = savedIgnitions;

            if (Object.keys(savedIgnitions).length > 0) {
                this.bridge.contract.schemas.forEach(schema => {
                    const id = schema.id || schema.handle?.alias;
                    if (savedIgnitions[id]) {
                        schema.metadata = { ...schema.metadata, silo_id: savedIgnitions[id].silo_id };
                    }
                });
            }

            return contract;
        } catch (e) {
            console.error('❌ [Cortex:Error] Colapso en carga de ADN:', e);
            return { schemas: [], workflows: [] };
        }
    }

    calculateChecksum(schemas) {
        const str = JSON.stringify(schemas || [], Object.keys(schemas || {}).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `chk_${Math.abs(hash).toString(36)}`;
    }
}
