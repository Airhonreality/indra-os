/**
 * =============================================================================
 * INDRA CONTRACT CORTEX (Agnostic JS Edition v4.0.0 - CONSCIOUSNESS NODE)
 * =============================================================================
 * Responsibilidad: Gestión del ADN local y la Identidad Física del Satélite.
 * =============================================================================
 */

export class ContractCortex {
    constructor(bridge) {
        this.bridge = bridge;
    }

    /**
     * @dharma Carga la identidad y el ADN del Satélite.
     * Implementa el Patrón de Consciencia de Nodo (Soberanía Física).
     */
    async load(options = {}) {
        const base = window.location.origin;
        let config = {};
        let contract = { schemas: [], workflows: [] };
        let usedLiveSync = false;

        try {
            // --- FASE 1: EL PASAPORTE (REALITY AUDIT) ---
            try {
                const configPath = `${base}/indra_identity.js?t=${Date.now()}`;
                
                console.log("🔍 [Cortex:Reality] 1. Origen detectado:", base);
                console.log("🔍 [Cortex:Reality] 2. Ruta de importación:", configPath);

                // AUDITORÍA DE MATERIA: Intentamos leer el archivo como texto plano primero
                /* 
                try {
                    const rawRes = await fetch(configPath);
                    const rawText = await rawRes.text();
                    console.log("🔍 [Cortex:Reality] 3. Contenido BRUTO en disco:\n", rawText);
                } catch (fetchErr) {
                    console.error("❌ [Cortex:Reality] Fallo en auditoría de materia (fetch):", fetchErr);
                }
                */

                // IMPORTACIÓN DINÁMICA
                const configModule = await import(/* @vite-ignore */ configPath);
                
                // DETECCIÓN MULTI-CAPA
                const rawConfig = configModule.INDRA_NODAL_CONFIG || configModule.INDRA_CONFIG || configModule.default?.INDRA_CONFIG || configModule;
                config = rawConfig || {};

                // INYECCIÓN DETERMINISTA: Solo si el disco TIENE materia real
                if (config.core_url && config.core_token) {
                    this.bridge.coreUrl = config.core_url;
                    this.bridge.infraToken = config.core_token; // Guardamos el L0 original
                    this.bridge.activeWorkspaceId = config.workspace_id || null;
                    
                    // --- AXIOMA DE SINCERIDAD AL ARRANQUE (v17.8) ---
                    // Antes de autorizar la identidad L0, verificamos si existe una sesión de usuario L2.
                    // El satélite ID se obtiene del contrato o se asume 'indra-node' por defecto.
                    const satelliteId = this.bridge.contract?.id || 'indra-node';
                    const sessionKey = `indra_session_${satelliteId}`;
                    const sessionToken = localStorage.getItem(sessionKey);

                    if (sessionToken) {
                        console.log(`⚡ [Cortex] Sesión de usuario detectada [${sessionKey}]. Escalando Privilegios L0 -> L2.`);
                        this.bridge.satelliteToken = sessionToken;
                    } else {
                        this.bridge.satelliteToken = config.core_token;
                        console.log("🔒 [Cortex] Usando identidad física de infraestructura (L0).");
                    }
                } else {
                    console.warn("⚠️ [Cortex] Sello vacío o incompleto en disco. Respetando memoria volátil.");
                }
            } catch (configErr) {
                console.warn("📡 [Cortex] Sin pasaporte: Operando en Modo Huérfano.");
            }

            // [FASE 1.5 ELIMINADA: Soberanía de módulos nativa activada]

            // --- FASE 2: MEMORIA ESTRUCTURAL (CACHÉ DE SESIÓN) ---
            if (options.use_cache !== false) {
                try {
                    const raw = localStorage.getItem('INDRA_DNA_SNAPSHOT');
                    if (raw) {
                        const cached = JSON.parse(raw);
                        // Solo recuperamos workflows o metadata, no sobreescribimos los schemas físicos
                        contract.workflows = cached.workflows || [];
                        console.log("🏛️ [Cortex] Memoria Estructural complementada.");
                    }
                } catch (e) {
                    console.warn("[Cortex] Error en Memoria Estructural.");
                }
            }

            // --- FASE 3: RESONANCIA AXIAL (HIPER-IGNICIÓN v20.0) ---
            if (this.bridge.coreUrl && this.bridge.satelliteToken && contract.schemas.length === 0) {
                try {
                    console.log("📡 [Cortex] Iniciando Hiper-Ignición (Batch v20.0)...");
                    
                    const operations = [
                        { protocol: 'SYSTEM_MANIFEST', provider: 'system' },
                        { protocol: 'SYSTEM_CONFIG_SCHEMA', provider: 'system' },
                        { protocol: 'SYSTEM_SATELLITE_DISCOVER', provider: 'system' }
                    ];

                    const wsId = this.bridge.activeWorkspaceId;
                    if (wsId) {
                        operations.push({ protocol: 'SYSTEM_PINS_READ', workspace_id: wsId, provider: 'system' });
                    }

                    const batchRes = await this.bridge.execute({ 
                        protocol: 'SYSTEM_BATCH_EXECUTE', 
                        data: { operations } 
                    });

                    const results = batchRes.items || [];
                    const liveManifest = results[0] || { metadata: {}, items: [] };
                    const liveSchemas  = results[1] || { items: [] };
                    const discovery    = results[2] || { items: [] };
                    const pinsRes      = results[3] || { items: [] };

                    contract = {
                        synced_at: new Date().toISOString(),
                        core_id: liveManifest.metadata?.core_id || 'unknown',
                        capabilities: {
                            protocols: [...new Set((liveManifest.items || []).flatMap(i => i.protocols || []))],
                            providers: (liveManifest.items || []).filter(i => i.class === 'SILO').map(s => s.id),
                        },
                        schemas: liveSchemas.items || [],
                        workflows: []
                    };
                    
                    // Inyectamos el pulso completo en el bridge para que IndraBridge.init sea instantáneo
                    this.bridge.capabilities = liveManifest.metadata || {};
                    this.bridge.manifest_items = liveManifest.items || [];
                    this.bridge.preloaded_discovery = discovery;
                    this.bridge.preloaded_pins = pinsRes;
                    
                    usedLiveSync = true;
                    console.log("⚡ [Cortex] ADN completo cristalizado en un solo viaje.");
                } catch (liveErr) {
                    console.error("⚠️ [Cortex] Falló Hiper-Ignición. Usando materia local.", liveErr);
                }
            }

            // --- FASE 4: PROYECCIÓN DE SOBERANÍA ---
            this.bridge.contract = contract;
            this.bridge.contract.satellite_name = config.satellite_name || contract.satellite_name || 'Satélite Anónimo';
            this.bridge.contract.core_id = config.core_id || contract.core_id;
            
            if (config.workspace_id) {
                this.bridge.activeWorkspaceId = config.workspace_id;
            }

            // 5. PERSISTENCIA ESTRUCTURAL
            this.saveSnapshot(contract);

            return contract;

        } catch (e) {
            console.error('❌ [Cortex:Error] Colapso en carga de consciencia:', e);
            return { schemas: [], workflows: [] };
        }
    }

    /**
     * Persiste el contrato actual para permitir ignición T=0.
     */
    saveSnapshot(contract) {
        if (!contract || (!contract.schemas?.length && !contract.workflows?.length)) return;
        try {
            localStorage.setItem('INDRA_DNA_SNAPSHOT', JSON.stringify(contract));
            console.log("💾 [Cortex] Memoria Estructural actualizada.");
        } catch (e) {
            console.error("[Cortex] Error persistiendo ADN:", e);
        }
    }
}
