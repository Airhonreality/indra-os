/**
 * SovereignIntelligenceProvider.js
 * EL ORÁCULO SOBERANO (ADR_012)
 * Proveedor agnóstico de inteligencia que permite al usuario orquestar MCEP.
 */

import { executeDirective } from './directive_executor';
import { useAppState } from '../state/app_state';

export class SovereignIntelligenceProvider {

    constructor(config = {}) {
        this._updateFromState();
    }

    /**
     * Sincroniza los proveedores internos con el estado global (Bóveda del Core).
     * AXIOMA: El Core es la fuente de verdad, el localStorage es persistencia de sesión.
     */
    _updateFromState() {
        const state = useAppState.getState();
        const services = state.services || [];
        
        // Mapeo de sub-servicios de inteligencia
        this.providers = {
            gemini: localStorage.getItem('indra-ai-gemini') || this._getSecretFromServices(services, 'intelligence:gemini') || null,
            groq: localStorage.getItem('indra-ai-groq') || this._getSecretFromServices(services, 'intelligence:groq') || null,
            grok: localStorage.getItem('indra-ai-grok') || this._getSecretFromServices(services, 'intelligence:grok') || null,
            openai: localStorage.getItem('indra-ai-openai') || this._getSecretFromServices(services, 'intelligence:openai') || null,
            custom: localStorage.getItem('indra-ai-custom') || this._getSecretFromServices(services, 'intelligence:custom') || null
        };

        const available = Object.keys(this.providers).filter(p => !!this.providers[p]);
        this.customBaseUrl = localStorage.getItem('indra-ai-custom-url') || null;
        
        // RESOLUCIÓN LINEAL: Evitamos recursión con getAvailableProviders
        this.activeProvider = localStorage.getItem('indra-ai-default-provider') || (available.length > 0 ? available[0] : 'gemini');
        this.activeModel = localStorage.getItem('indra-ai-default-model') || this._resolveDefaultModel(this.activeProvider);
        this.routerModel = this._resolveRouterModel();
    }

    _getSecretFromServices(services, id) {
        const svc = services.find(s => s.id === id);
        return svc?.isReady ? (svc.raw?.secrets?.api_key || 'VAULT_PROTECTED') : null;
    }

    _resolveRouterModel() {
        if (this.providers.gemini) return { provider: 'gemini', model: 'gemini-1.5-flash' };
        if (this.providers.groq) return { provider: 'groq', model: 'llama-3.1-8b-instant' }; // Modelo rápido en Groq
        return { provider: this.activeProvider, model: this.activeModel };
    }

    /**
     * Retorna la lista de proveedores que tienen una API Key configurada.
     * AXIOMA: Si no hay llave, el proveedor no existe para la UI.
     */
    getAvailableProviders() {
        return Object.keys(this.providers).filter(p => !!this.providers[p]);
    }

    /**
     * Retorna los modelos recomendados para los proveedores activos.
     */
    getAvailableModels() {
        const available = this.getAvailableProviders();
        return available.map(p => ({
            provider: p,
            model: this._resolveDefaultModel(p),
            label: `${p.toUpperCase()} - ${this._resolveDefaultModel(p)}`
        }));
    }

    /**
     * Resuelve el primer proveedor con key disponible.
     */
    _resolveFirstAvailableProvider() {
        const available = this.getAvailableProviders();
        return available.length > 0 ? available[0] : 'gemini';
    }

    _resolveDefaultModel(provider) {
        const models = {
            gemini: 'gemini-1.5-flash',
            groq: 'llama-3.3-70b-versatile',
            grok: 'grok-beta',
            openai: 'gpt-4o',
            custom: 'gpt-4o'
        };
        return models[provider] || 'default-model';
    }

    isConfigured() {
        this._updateFromState();
        return Object.values(this.providers).some(k => !!k);
    }

    /**
     * Setea las credenciales de forma dinámica y las persiste.
     */
    setCredentials(provider, key, baseUrl = null) {
        if (this.providers.hasOwnProperty(provider)) {
            this.providers[provider] = key;
            localStorage.setItem(`indra-ai-${provider}`, key);
            
            if (provider === 'custom' && baseUrl) {
                this.customBaseUrl = baseUrl;
                localStorage.setItem('indra-ai-custom-url', baseUrl);
            }

            // AXIOMA: Al actualizar una llave, recalculamos la disponibilidad
            this.routerModel = this._resolveRouterModel();
            
            // Si el proveedor activo no tenía llave, lo seteamos ahora
            if (!this.providers[this.activeProvider]) {
                this.activeProvider = provider;
                this.activeModel = this._resolveDefaultModel(provider);
            }
        }
    }


    /**
     * Define el proveedor y modelo activo.
     */
    setActiveConfig(provider, model) {
        this.activeProvider = provider;
        this.activeModel = model;
        localStorage.setItem('indra-ai-default-provider', provider);
        localStorage.setItem('indra-ai-default-model', model);
    }


    /**
     * Punto de entrada principal para el chat operativo.
     * @param {string} prompt - El deseo del usuario.
     * @param {Object} context - { history, capabilities, currentWorkspace }
     */
    async ask(prompt, context = {}) {
        this._updateFromState();
        const { history = [], capabilities = {}, currentWorkspace = null } = context;

        // AXIOMA DE SINCERIDAD: Instrucción base
        const systemInstruction = this._buildSystemInstruction();

        // Enviar al Bridge. Pasamos las agentTools (herramientas nativas)
        // El orquestador puede pasar options.model para tiering
        const response = await this._dispatchToProvider(prompt, history, systemInstruction, { 
            tools: capabilities.agentTools || [],
            ...context.options 
        });

        return this._auditResponse(response);
    }

    /**
     * Verifica la conectividad con un proveedor específico testeando una respuesta mínima.
     */
    async verifyConnection(provider) {
        const key = this.providers[provider];
        if (!key) throw new Error(`No hay llave configurada para ${provider}`);

        const testPrompt = "Responde solo con la palabra 'CONECTADO'";
        const model = provider === 'gemini' ? 'gemini-1.5-flash' : (provider === 'grok' ? 'grok-beta' : 'llama-3.3-70b-versatile');

        try {
            const response = await this._dispatchToProvider(testPrompt, [], "Actúa como un probador de conexión.", {
                overrideProvider: provider,
                overrideModel: model
            });

            const isOk = response.toUpperCase().includes('CONECTADO');
            return {
                success: isOk,
                message: isOk ? `Conexión con ${provider} exitosa.` : `Respuesta inesperada de ${provider}: ${response}`,
                provider
            };
        } catch (error) {
            console.error(`[SovereignIntelligence] Fallo de conexión con ${provider}:`, error);
            return {
                success: false,
                message: error.message,
                provider
            };
        }
    }

    /**
     * Construye el prompt maestro basado en el estado actual de los motores.

     */
    _buildSystemInstruction() {
        return `
            Eres el AGENTE MCEP de INDRA. Tu objetivo es operar y analizar información de manera CERTERA, DIRECTA y HUMANA.
            
            AXIOMAS DE EFICIENCIA:
            1. RESPUESTA DIRECTA: Si el usuario te saluda ("hola", "buenos días") o hace una pregunta general que no requiere datos del sistema, RESPONDE DIRECTAMENTE en lenguaje natural. Tienes prohibido usar herramientas para interacciones sociales básicas.
            2. SENSING MÍNIMO VIABLE: Solo usa herramientas si necesitas conocer la realidad del sistema para cumplir una orden. Con UNA sola observación del entorno suele ser suficiente. 
            3. CONCLUSIÓN RÁPIDA: En el momento en que tengas la respuesta gracias a una herramienta, SINTETIZA y responde al humano de inmediato.
            4. PAYLOADS PRECISOS: Usa 'payload.fields' estrictamente, NO 'columns'. NUNCA alucines datos.
            
            Si te piden específicamente "qué ves en mi entorno", usa \`call__system__get_workspace_state\` UNA VEZ.
        `;
    }

    /**
     * Envía la petición al LLM (vía Directiva o Fetch directo si es local).
     * En Indra, solemos canalizar esto vía CORE para auditoría, 
     * pero permitiremos ejecución directa si hay Keys locales.
     */
    async _dispatchToProvider(prompt, history, systemInstruction, options = {}) {
        const state = useAppState.getState();
        const { coreUrl, sessionSecret } = state;

        const targetProvider = options.overrideProvider || this.activeProvider;
        const targetModel = options.overrideModel || this.activeModel;
        const credentials = this.providers[targetProvider];

        if (!credentials) {
            throw new Error(`No hay API Key configurada para el proveedor: ${targetProvider}. Ve a configuración.`);
        }

        // AXIOMA DE TRADUCCIÓN DE FORMATO HISTÓRICO:
        // El frontend almacena el historial en formato OpenAI: { role, content }.
        // Gemini espera: { role: 'user'|'model', parts: [{ text }] }.
        // OpenAI-compat (Groq, Grok, custom) espera: { role: 'user'|'assistant', content }.
        // Normalizamos antes de enviar.
        const normalizedHistory = history.map(msg => {
            const text = msg.content || (msg.parts && msg.parts[0]?.text) || '';
            const role = msg.role === 'assistant' ? 'assistant' : (msg.role === 'model' ? 'model' : 'user');
            return { role, content: text, text }; // Incluimos ambos para que el Core elija
        });

        const uqo = {
            provider: 'system',
            protocol: 'INTELLIGENCE_CHAT',
            data: {
                prompt,
                history: normalizedHistory,
                systemInstruction,
                model: targetModel,
                provider: targetProvider,
                credentials,
                baseUrl: targetProvider === 'custom' ? this.customBaseUrl : null,
                tools: options.tools || []
            }
        };

        try {
            const result = await executeDirective(uqo, coreUrl, sessionSecret);
            const response = result.payload || result.metadata?.response || result.response;
            if (!response) throw new Error(`El Core no retornó un payload de respuesta estructurado (provider: ${targetProvider})`);
            return response;
        } catch (error) {
            console.error('[SovereignIntelligence] Error en despacho:', error);
            throw error;
        }
    }

    /**
     * Audita que la respuesta de la IA no viole la Ley de Aduana.
     */
    _auditResponse(response) {
        if (response.type === 'message' && response.text && response.text.includes('columns:')) {
            console.warn('[MCEP Bridge] IA detectada usando lenguaje no sincero (columns) en texto libre. Corrigiendo textualmente...');
            response.text = response.text.replace(/columns:/g, 'fields:');
        }
        return response;
    }
}

export const sovereignIntelligence = new SovereignIntelligenceProvider();
