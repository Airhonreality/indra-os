// =============================================================================
// ARTEFACTO: 5_diagnostics/sonde_notion_deep_scan.gs
// RESPONSABILIDAD: Prueba de estrés y diagnóstico de jerarquía para Notion.
// OBJETIVO: Validar token y demostrar escaneo multi-nivel (Estrategia v12.1).
// =============================================================================

function TEST_NOTION_DEEP_SCAN() {
  const accountId = 'default';
  console.log('🚀 INICIANDO SONDA DE ESCANEO PROFUNDO: NOTION');
  
  // 1. Verificar Token
  const token = _notion_getNotionApiKey(accountId);
  if (!token) {
    console.error('❌ FALLO CRÍTICO: No se encontró token para Notion en la Bóveda.');
    return;
  }
  console.log('✅ TOKEN RECUPERADO: ' + token.substring(0, 10) + '...');

  // 2. Ejecutar Escaneo con Profundidad 3 (Prueba de Inferencia)
  console.log('🔍 ESCANEANDO JERARQUÍA (Nivel 0: ROOT)...');
  const uqo = {
    provider: 'notion',
    protocol: 'HIERARCHY_TREE',
    context_id: 'ROOT',
    query: { depth: 3 } // Esto es lo que queremos inyectar como estándar
  };

  try {
    const result = handleNotion(uqo);
    
    if (result.metadata && result.metadata.status === 'ERROR') {
      console.error('❌ ERROR EN PROTOCOLO:', result.metadata.error);
      return;
    }

    console.log(`📦 ELEMENTOS RECUPERADOS EN RAÍZ: ${result.items.length}`);
    
    // Simulación de Escaneo Profundo Manual si el protocolo aún no es recursivo
    result.items.forEach(item => {
      console.log(`   [${item.class}] ${item.handle.label} (${item.id})`);
      if (item.class === 'FOLDER' || item.class === 'DOCUMENT') {
        _sonde_trace_children(item.id, token, 1, 3);
      }
    });

  } catch (e) {
    console.error('💥 COLAPSO EN LA SONDA:', e.message);
  }
}

/**
 * Función recursiva de diagnóstico para trazar profundidad.
 * @private
 */
function _sonde_trace_children(parentId, apiKey, currentDepth, maxDepth) {
  if (currentDepth >= maxDepth) return;

  const indent = '   '.repeat(currentDepth + 1);
  console.log(`${indent} ∟ Escaneando hijos de ${parentId}...`);

  try {
    const uqo = { provider: 'notion', protocol: 'HIERARCHY_TREE', context_id: parentId };
    const res = handleNotion(uqo);
    
    if (res.items && res.items.length > 0) {
      res.items.forEach(child => {
        console.log(`${indent}   • [${child.class}] ${child.handle.label}`);
        // Recursión controlada
        if (child.class === 'FOLDER' || child.class === 'DOCUMENT') {
          _sonde_trace_children(child.id, apiKey, currentDepth + 1, maxDepth);
        }
      });
    }
  } catch (e) {
    console.warn(`${indent} ⚠️  Error descendiendo en ${parentId}: ${e.message}`);
  }
}
