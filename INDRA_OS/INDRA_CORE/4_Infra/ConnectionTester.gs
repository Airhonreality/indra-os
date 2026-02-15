// ======================================================================
// ARTEFACTO: 4_Infra/ConnectionTester.gs
// DHARMA: Ser el Especialista Centralizado en 'Pings' de Conectividad.
// ======================================================================

/**
 * Factory para crear una instancia del ConnectionTester.
 * @param {object} dependencies - Dependencias inyectadas
 * @param {object} dependencies.errorHandler - Manejador de errores del sistema
 * @returns {object} Instancia congelada del ConnectionTester
 */
function createConnectionTester({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createConnectionTester: errorHandler contract not fulfilled');
  }

  /**
   * Lógica específica para validar un token de API de Notion.
   * @private
   * @param {object} credentials - { apiToken: string }
   * @returns {{isValid: boolean, reason?: string}}
   */
  function _testNotion(credentials) {
    const apiToken = credentials ? credentials.apiToken : null;
    if (!apiToken || typeof apiToken !== 'string' || apiToken.trim() === '') {
      return { isValid: false, reason: 'El token de API no fue proporcionado.' };
    }

    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + apiToken,
        'Notion-Version': '2022-06-28'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://api.notion.com/v1/users/me', options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      return { isValid: true };
    }
    
    return { isValid: false, reason: `El token es inválido o no tiene permisos (Error HTTP ${responseCode}).` };
  }

  /**
   * Lógica específica para validar la accesibilidad de una URL.
   * @private
   * @param {object} credentials - { url: string }
   * @returns {{isValid: boolean, reason?: string}}
   */
  function _testUrl(credentials) {
    const url = credentials ? credentials.url : null;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return { isValid: false, reason: 'La URL proporcionada no parece válida.' };
    }

    // --- INICIO DE INTERVENCIÓN ---
    // Se reemplaza el método 'head' (no soportado por UrlFetchApp) por 'get'.
    // Aunque menos eficiente, es la alternativa correcta y funcional en el entorno GAS.
    const options = {
      method: 'get',
      muteHttpExceptions: true
    };
    // --- FIN DE INTERVENCIÓN ---
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    // Cualquier respuesta por debajo de 500 indica que la URL es accesible, incluso si es un error del cliente (4xx)
    if (responseCode < 500) {
      return { isValid: true };
    }

    return { isValid: false, reason: `El servidor en la URL no está respondiendo correctamente (Error HTTP ${responseCode}).` };
  }

  /**
   * Ejecuta una prueba de conexión simple. Retorna un objeto de resultado,
   * NUNCA lanza un error al llamador.
   * @public
   * @param {string} connectionType - El tipo de conexión (ej. 'notion_api_key')
   * @param {object} credentials - Un objeto con las credenciales a probar
   * @returns {{isValid: boolean, reason?: string}}
   */
  function test(connectionType, credentials) {
    console.log(`[ConnectionTester] Probing connection: ${connectionType}`);
    try {
      const normalizedType = (connectionType || '').toUpperCase();
      switch (normalizedType) {
        case 'NOTION_API_KEY':
          return _testNotion(credentials);

        case 'PDF_GENERATOR_FUNCTION_URL':
        case 'DEPLOYMENT_URL':
          return _testUrl(credentials);

        case 'ADMIN_EMAIL':
        case 'CORE_SATELLITE_API_KEY':
        default:
          console.log(`[ConnectionTester] No active probe needed for ${normalizedType}. Returning valid.`);
          return { isValid: true, reason: 'No se requiere validación para este tipo.' };
      }
    } catch (error) {
      // Axioma AN-3: Capturar cualquier error inesperado (ej. de red/DNS) y convertirlo en un resultado.
      console.error(`Error inesperado en ConnectionTester al probar '${connectionType}': ${error.message}`);
      return { isValid: false, reason: `Ocurrió un error de red o DNS: ${error.message}` };
    }
  }

  const schemas = {
    test: {
      description: "Executes an active technical probe to verify external API availability and credential authorization.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          connectionType: { type: "string", role: "GATE", description: "Standardized identifier for the connection type." },
          credentials: { type: "object", role: "STREAM", description: "Security tokens or endpoint URLs to be tested." },
          accountId: { type: "string", role: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          isValid: { type: "boolean", role: "PROBE", description: "Boolean confirmation of connectivity success." },
          reason: { type: "string", role: "PROBE", description: "Technical feedback or failure cause." }
        } 
      }
    }
  };

  return Object.freeze({
    id: "service_connection_tester",
    label: "Circuit Master",
    description: "Industrial diagnostic engine for verifying external API accessibility and credential validity.",
    semantic_intent: "PROBE",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    schemas,
    test
  });
}





