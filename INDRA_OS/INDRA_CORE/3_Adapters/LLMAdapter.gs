// ======================================================================
// ARTEFACTO: 3_Adapters/LLMAdapter.gs
// DHARMA: Ser el Oráculo Inteligente del Sistema (Agnóstico y Purista).
// PROPÓSITO: Proporcionar acceso a modelos de lenguaje (Gemini, OpenAI, etc.)
//            utilizando el sistema multi-cuenta de TokenManager.
// ======================================================================

/**
 * Factory para crear una instancia inmutable del LLMAdapter.
 * @param {object} deps - { errorHandler, tokenManager, configurator }
 * @returns {object} Una instancia congelada del LLMAdapter.
 */
function createLLMAdapter({ errorHandler, tokenManager, configurator }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('[LLMAdapter] errorHandler contract not fulfilled');
  }
  if (!tokenManager || typeof tokenManager.getToken !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', '[LLMAdapter] tokenManager es obligatorio');
  }

  // --- INDRA CANON: Normalización Semántica ---

  function _mapDocumentRecord(text, metadata) {
    return {
      id: Utilities.getUuid(),
      title: "IA Cognitive Response",
      content: {
        text: text,
        type: 'LLM_CHAT'
      },
      url: null,
      lastUpdated: new Date().toISOString(),
      raw: metadata
    };
  }

  // ============================================================
  // LÓGICA PRIVADA: Clientes de Proveedores
  // ============================================================

  /**
   * Obtiene el token para un proveedor y cuenta específicos.
   * @param {string} provider - 'gemini' | 'openai' | etc.
   * @param {string|null} accountId 
   * @returns {string} El token de API
   */
  function _getToken(provider, accountId = null) {
    try {
      const tokenData = tokenManager.getToken({ provider, accountId });
      if (!tokenData || !tokenData.apiKey) {
        throw new Error(`No se encontró apiKey para el proveedor ${provider}`);
      }
      return tokenData.apiKey;
    } catch (e) {
      throw errorHandler.createError('CONFIGURATION_ERROR', `[LLMAdapter] Error al obtener token: ${e.message}`);
    }
  }

  const _cache = { resolvedModel: null };

  /**
   * Resuelve de forma inteligente el modelo a utilizar.
   * Prioridad: 1. Payload explicito, 2. ScriptProperty, 3. Auto-detección proactiva.
   * @private
   */
  function _resolveOptimalModel(payloadModel, accountId) {
    if (payloadModel) return payloadModel;
    if (_cache.resolvedModel) return _cache.resolvedModel;

    // 1. Intentar leer del configurador
    const configModel = configurator ? configurator.retrieveParameter({ key: 'LLM_DEFAULT_MODEL' }) : null;
    if (configModel && configModel !== 'AUTO') {
      _cache.resolvedModel = configModel;
      return configModel;
    }

    // 2. Auto-detección proactiva (Sensing)
    try {
      console.log("[LLMAdapter] Sensing optimal model...");
      const available = getAvailableModels({ accountId });
      const modelList = (available.models || []).map(m => m.name.replace('models/', ''));
      
      // AXIOMA: La frontera cognitiva se define en Layer 0 (Logic_Axioms)
      const preference = (typeof LOGIC_AXIOMS !== 'undefined' && LOGIC_AXIOMS.COGNITIVE_FRONTIER) 
                         ? LOGIC_AXIOMS.COGNITIVE_FRONTIER 
                         : ['gemini-1.5-flash'];

      for (const target of preference) {
        if (modelList.includes(target)) {
          console.log(`[LLMAdapter] Optimal model auto-detected: ${target}`);
          _cache.resolvedModel = target;
          return target;
        }
      }
      
      // Fallback absoluto
      return modelList[0] || preference[0];
    } catch (e) {
      console.warn("[LLMAdapter] Sensing failed, falling back to 1.5-flash");
      return 'gemini-1.5-flash';
    }
  }

  // ============================================================
  // MÉTODOS PÚBLICOS (Conforme a Contrato de Nodos)
  // ============================================================

  /**
   * Ejecuta una petición de chat/completions a Gemini.
   * @param {object} resolvedPayload - { prompt, systemInstruction?, model?, accountId?, temperature? }
   * @returns {object} Respuesta estructurada { response, metadata }
   */
  function chatGemini(resolvedPayload) {
    const { 
      prompt, 
      messages: history = [],
      systemInstruction, 
      model: payloadModel = null, 
      accountId = null,
      temperature = 0.7 
    } = resolvedPayload;

    const model = _resolveOptimalModel(payloadModel, accountId);

    if (!prompt && history.length === 0) {
      throw errorHandler.createError('INVALID_INPUT', '[LLMAdapter.chatGemini] prompt o history son obligatorios');
    }

    const apiKey = _getToken('gemini', accountId);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // AXIOMA: Construcción de Diálogo (H7-DIALOG)
    const contents = [];
    
    // Inject History
    history.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text || msg.content }]
      });
    });

    // Inject Current Prompt (combined with system if it's the only message or if explicitly requested)
    const lastPart = {
      role: 'user',
      parts: [{ text: systemInstruction ? `[SYSTEM_INSTRUCTION]\n${systemInstruction}\n\n[USER_PROMPT]\n${prompt}` : prompt }]
    };
    contents.push(lastPart);

    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: temperature
      }
    };

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      });

      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (statusCode !== 200) {
        throw errorHandler.createError('LLM_PROVIDER_ERROR', `Gemini API error (${statusCode}): ${responseText}`);
      }

      const result = JSON.parse(responseText);
      const outputText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        response: outputText,
        metadata: {
          provider: 'gemini',
          model: model,
          timestamp: new Date().toISOString(),
          finishReason: result.candidates?.[0]?.finishReason
        }
      };

    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('SYSTEM_FAILURE', `[LLMAdapter.chatGemini] ${e.message}`);
    }
  }

  /**
   * Método genérico 'chat' que delega al proveedor configurado (default: Gemini).
   */
  function chat(resolvedPayload) {
    const { model = '' } = resolvedPayload;
    // ROUTING AXIOM: Multi-Provider Sovereignty
    if (model.includes('llama') || model.includes('mixtral') || model.includes('groq')) {
      return chatGroq(resolvedPayload);
    }
    return chatGemini(resolvedPayload);
  }

  /**
   * Ejecuta una petición de chat a Groq (OpenAI Compatible API).
   * @param {object} resolvedPayload - { prompt, systemInstruction, model, accountId, temperature }
   */
  function chatGroq(resolvedPayload) {
    const { 
      prompt, 
      messages: history = [],
      systemInstruction, 
      model: payloadModel = 'llama-3.3-70b-versatile', 
      accountId = null,
      temperature = 0.7 
    } = resolvedPayload;

    const apiKey = _getToken('groq', accountId);
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    // Inject History
    history.forEach(msg => {
      // AXIOMA: Mapeo de Roles (Indra -> OpenAI/Groq)
      const role = (msg.role === 'assistant' || msg.io_behavior === 'assistant') ? 'assistant' : 'user';
      messages.push({ 
        role: role, 
        content: msg.text || msg.content || "" 
      });
    });

    // Inject Current Prompt
    messages.push({ role: 'user', content: prompt || "" });

    const requestBody = {
      model: payloadModel,
      messages: messages,
      temperature: temperature
    };

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      });

      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (responseCode !== 200) {
         throw new Error(`Groq API error (${responseCode}): ${responseText}`);
      }

      const result = JSON.parse(responseText);
      const outputText = result.choices[0].message.content;

      const metadata = {
        provider: 'groq',
        model: payloadModel,
        usage: result.usage,
        timestamp: new Date().toISOString()
      };

      return {
        response: outputText,
        metadata: metadata
      };
    } catch (e) {
      throw errorHandler.createError('LLM_PROVIDER_ERROR', `Groq failure: ${e.message}`);
    }
  }

  /**
   * Obtiene la lista de modelos disponibles para debuggear el 404.
   */
  function getAvailableModels(payload) {
    const { accountId = null } = payload || {};
    const apiKey = _getToken('gemini', accountId);
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      return JSON.parse(response.getContentText());
    } catch (e) {
       throw errorHandler.createError('LLM_PROVIDER_ERROR', `Failed to list models: ${e.message}`);
    }
  }

  /**
   * Verifica la conectividad con los proveedores de LLM.
   */
    function verifyConnection(payload = {}) {
    const results = {};
    let overallSuccess = false;

    // Probar Gemini
    try {
      const gemini = getAvailableModels(payload);
      const isOk = gemini && gemini.models && gemini.models.length > 0;
      results.gemini = { success: isOk, message: isOk ? "OK" : "No models found" };
      if (isOk) overallSuccess = true;
    } catch (e) {
      results.gemini = { success: false, message: e.message };
    }

    // Probar Groq (opcional)
    try {
      if (tokenManager.getToken({ provider: 'groq', accountId: payload.accountId })) {
        const groqTest = chatGroq({ prompt: "hi", accountId: payload.accountId });
        const isOk = !!(groqTest && (groqTest.response || groqTest.content));
        results.groq = { success: isOk, message: isOk ? "OK" : "Empty response" };
        if (isOk) overallSuccess = true;
      }
    } catch (e) {
      if (!e.message.includes('not configured')) {
        results.groq = { success: false, message: e.message };
      }
    }

    return { 
      status: overallSuccess ? "ACTIVE" : "BROKEN",
      success: overallSuccess, 
      providers: results,
      message: overallSuccess ? "Conectividad LLM Establecida" : "Fallo de conectividad LLM"
    };
  }

  // ============================================================
  // RETORNO DE INTERFAZ
  // ============================================================
  
  // --- SOVEREIGN CANON V12.0 (Algorithmic Core) ---
  const CANON = {
    ARCHETYPES: ["ADAPTER", "SERVICE", "COMPUTE"],
    ARCHETYPE: "SERVICE", 
    DOMAIN: "INTELLIGENCE",
    CAPABILITIES: {
        "chat": {
            "io": "PROBE", 
            "desc": "High-integrity cognitive reasoning session (Auto-Routing)",
            "inputs": {
                "prompt": { "type": "string", "desc": "Natural language query." },
                "messages": { "type": "array", "desc": "Context history." },
                "model": { "type": "string", "desc": "Target model ID." }
            }
        },
        "chatGemini": {
            "io": "PROBE", "desc": "Direct Gemini inference circuit"
        },
        "chatGroq": {
            "io": "PROBE", "desc": "Direct Groq inference circuit"
        },
        "getAvailableModels": {
            "io": "SENSOR", "desc": "List active cognitive circuits"
        },
        "verifyConnection": {
            "io": "PROBE", "desc": "Health check protocol"
        }
    }
  };

  return {
    CANON, // <--- EXPOSICIÓN CRÍTICA V8.0
    id: "llm",
    
    // Métodos Operativos
    chat,
    chatGemini,
    chatGroq,
    getAvailableModels,
    verifyConnection,
    
    // Legacy Bridges (Para compatibilidad con sistemas v7)
    get schemas() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                io_interface: { inputs: cap.inputs || {}, outputs: {} }
            };
        }
        return s;
    },
    // Propiedades Legacy (serán sobreescritas por el Assembler usando CANON)
    label: CANON.LABEL,
    archetype: CANON.ARCHETYPE,
    domain: CANON.DOMAIN,
    semantic_intent: CANON.SEMANTIC_INTENT
  };
}






