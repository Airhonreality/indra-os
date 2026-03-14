/**
 * MCEP_DiscoveryEngine.js
 * EL OJO DE INDRA (ADR_012)
 * Se encarga de la introspección del sistema para generar el Discovery Tree.
 */

import { executeDirective } from './directive_executor';
import { useAppState } from '../state/app_state';

class MCEP_DiscoveryEngine {

    constructor() {
        this.cache = null;
        this.lastUpdate = null;
    }

    /**
     * Obtiene el árbol de capacidades bajo demanda.
     * Implementa 'Hydration Proactiva' (Axioma de Información).
     */
    async getDiscoveryTree(forceRefresh = false) {
        if (!forceRefresh && this.cache && (Date.now() - this.lastUpdate < 3600000)) {
            return this.cache;
        }

        console.log('[MCEP_Discovery] Sensing system capabilities...');
        
        try {
            // 1. Consultar al Core por sus Providers y Protocolos (Introspección)
            const coreCapabilities = await this._senseCoreCapabilities();

            // 2. Mapear a formato amigable (texto) y nativo (tool calling)
            this.cache = {
                textMap: this._formatForLLM(coreCapabilities),
                agentTools: this._buildAgentTools(coreCapabilities)
            };
            this.lastUpdate = Date.now();

            return this.cache;
        } catch (error) {
            console.error('[MCEP_Discovery] Fallo en el sensing:', error);
            return { error: 'CAPABILITIES_SENSING_FAILED' };
        }
    }

    /**
     * Ejecuta una directiva especial de introspección contra el Core.
     */
    async _senseCoreCapabilities() {
        const { coreUrl, sessionSecret } = useAppState.getState();
        const uqo = {
            executor: 'system',
            method: 'getMCEPManifest',
            data: { mode: 'RAW_MAP' }
        };
        
        try {
            const result = await executeDirective(uqo, coreUrl, sessionSecret);
            // El Core devuelve el manifiesto en result.payload (ADR-022) o result.metadata
            const capabilities = result.payload?.capabilities || result.metadata?.capabilities || result.capabilities || {};
            return capabilities;
        } catch (error) {
            console.error('[MCEP_Discovery] Fallo en sensado:', error);
            return {};
        }
    }



    /**
     * Transforma la respuesta técnica del Core en un mapa semántico.
     */
    _formatForLLM(coreCaps) {
        const tree = {};

        // Normalización TGS: Agrupamos por dominios funcionales (Sinceridad de Manifiesto)
        Object.entries(coreCaps).forEach(([provider, manifest]) => {
            // Usamos el ID original del provider para evitar errores de routing
            tree[provider] = {
                description: manifest.description || `Motor de ${provider}`,
                actions: Object.entries(manifest.tools || {}).map(([protocol, tool]) => ({
                    method: protocol,
                    description: tool.desc,
                    parameters: tool.inputs || {}
                }))
            };
        });

        return tree;
    }

    /**
     * Construye el array nativo de MCEP Tools usando JSON Schema 
     * (compatible con OpenAI/Anthropic/Gemini).
     */
    _buildAgentTools(coreCaps) {
        const tools = [];

        Object.entries(coreCaps).forEach(([provider, manifest]) => {
            Object.entries(manifest.tools || {}).forEach(([protocol, tool]) => {
                // OpenAI/Gemini exigen patron ^[a-zA-Z0-9_-]{1,64}$
                const name = `call__${provider}__${protocol}`.substring(0, 64).replace(/[^a-zA-Z0-9_-]/g, '_');
                
                const properties = {};
                const required = [];
                
                Object.entries(tool.inputs || {}).forEach(([key, schema]) => {
                    properties[key] = {
                        type: schema.type || 'string',
                        description: schema.desc || `Parámetro ${key}`
                    };
                    if (schema.required) required.push(key);
                });

                tools.push({
                    type: "function",
                    function: {
                        name: name,
                        description: tool.desc,
                        parameters: {
                            type: "object",
                            properties: properties,
                            required: required
                        }
                    }
                });
            });
        });

        // Hardcode "system__get_workspace_state" if it's missing just in case frontend needs it 
        // until the core natively reports it globally
        const hasWorkspace = tools.find(t => t.function.name === 'call__system__get_workspace_state');
        if (!hasWorkspace) {
             tools.push({
                type: "function",
                function: {
                    name: "call__SYSTEM_CORE__get_workspace_state",
                    description: "Obtiene la lista de los archivos y átomos anclados al workspace activo.",
                    parameters: { type: "object", properties: {} }
                }
            });
        }

        return tools;
    }
}

export const discoveryEngine = new MCEP_DiscoveryEngine();
