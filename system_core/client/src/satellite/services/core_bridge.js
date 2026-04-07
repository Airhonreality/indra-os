/**
 * =============================================================================
 * SATÉLITE: core_bridge.js
 * Capa de comunicación HTTP con el Core de Indra.
 * DHARMA: Cero dependencias de la UI de Indra. Solo fetch() nativo.
 * =============================================================================
 */

/**
 * Ejecuta un UQO directamente contra el Core de Indra.
 * @param {Object} uqo - Universal Query Object
 * @param {string} coreUrl - URL del GAS del arquitecto
 * @param {string} sessionSecret - Token de sesión
 */
export async function executeUqo(uqo, coreUrl, sessionSecret) {
  const response = await fetch(coreUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_secret: sessionSecret,
      uqo
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const result = await response.json();

  if (result.metadata?.status === 'ERROR') {
    throw new Error(result.metadata.error || 'Core returned an error.');
  }

  return result;
}

/**
 * Descubre el Core de un usuario dado su Google ID Token.
 * Llama al endpoint central de descubrimiento de Indra.
 * @param {string} idToken - Google ID Token del usuario
 * @param {string} discoveryUrl - URL del servicio de descubrimiento de Indra
 */
export async function discoverCore(idToken, discoveryUrl) {
  const response = await fetch(discoveryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uqo: {
        provider: 'system',
        protocol: 'SYSTEM_CORE_DISCOVERY',
        data: { id_token: idToken }
      }
    })
  });

  if (!response.ok) throw new Error(`Discovery failed: ${response.status}`);
  const result = await response.json();
  return result; // { core_url, session_secret, user_handle }
}

/**
 * Crea un DATA_SCHEMA en el Core a partir de un esquema local.
 */
export async function syncSchemaToCor(schema, alias, coreUrl, sessionSecret) {
  return executeUqo({
    provider: 'system',
    protocol: 'ATOM_CREATE',
    data: {
      class: 'DATA_SCHEMA',
      name: schema.label || alias,
      handle: { alias, label: schema.label || alias },
      payload: {
        fields: schema.fields || [],
        source: 'SATELLITE_SYNC'
      }
    }
  }, coreUrl, sessionSecret);
}

/**
 * Actualiza un DATA_SCHEMA existente en el Core.
 */
export async function updateSchemaInCore(atomId, schema, coreUrl, sessionSecret) {
  return executeUqo({
    provider: 'system',
    protocol: 'ATOM_UPDATE',
    context_id: atomId,
    data: {
      payload: {
        fields: schema.fields || [],
        source: 'SATELLITE_SYNC'
      }
    }
  }, coreUrl, sessionSecret);
}

/**
 * Ignita la materia física de un esquema.
 */
export async function igniteSchema(schemaAtomId, targetProvider, coreUrl, sessionSecret) {
  return executeUqo({
    provider: 'system',
    protocol: 'SYSTEM_SCHEMA_IGNITE',
    context_id: schemaAtomId,
    data: { target_provider: targetProvider }
  }, coreUrl, sessionSecret);
}

/**
 * Lee todos los DATA_SCHEMA del Core.
 */
export async function fetchCoreSchemas(coreUrl, sessionSecret) {
  const result = await executeUqo({
    provider: 'system',
    protocol: 'ATOM_READ',
    query: { class: 'DATA_SCHEMA' }
  }, coreUrl, sessionSecret);
  return result.items || [];
}
