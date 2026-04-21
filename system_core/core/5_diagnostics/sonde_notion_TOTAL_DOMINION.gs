// =============================================================================
// ARTEFACTO: 5_diagnostics/sonde_notion_TOTAL_DOMINION.gs
// RESPONSABILIDAD: Prueba de estrés total, escritura y autoliquidación.
// OBJETIVO: Validar cada capacidad del proveedor y limpiar la basura espacial.
// =============================================================================

function INDRA_NOTION_DOMINION_TEST() {
  const accountId = 'default';
  const junkIds = []; // Registro de basura espacial para limpieza
  
  console.log('🌌 INICIANDO OPERACIÓN: DOMINIO TOTAL (NOTION)');

  try {
    const apiKey = _notion_getNotionApiKey(accountId);
    if (!apiKey) throw new Error('No se pudo recuperar la llave de la Bóveda.');

    // 1. TEST: HIERARCHY (ROOT)
    console.log('📡 [1/6] Probando Resonancia de Jerarquía...');
    const root = handleNotion({ provider: 'notion', protocol: 'HIERARCHY_TREE' });
    if (root.metadata.status !== 'OK') throw new Error('Fallo en Jerarquía: ' + root.metadata.error);
    console.log(`   ✅ Éxito. Detectados ${root.items.length} nodos en la raíz.`);
    
    // BUSCAR UN ANCLA REAL: No podemos crear en "ROOT", necesitamos una página real como padre
    const anchor = root.items.find(item => item.class === 'FOLDER' || item.class === 'DOCUMENT');
    if (!anchor) throw new Error('No se encontró ninguna página compartida para usar como ancla de test.');
    const realParentId = anchor.id;
    console.log(`   ⚓ Ancla detectada: ${anchor.handle.label} (${realParentId})`);

    // 2. TEST: ATOM_CREATE (PÁGINA)
    console.log('🌱 [2/6] Probando Génesis de Átomos (Página)...');
    const pageRes = handleNotion({
      provider: 'notion',
      protocol: 'ATOM_CREATE',
      context_id: realParentId, // Usamos el ancla real
      data: { 
        name: '🧪 INDRA_TEST_PAGE [BORRAR]', 
        class: 'DOCUMENT',
        icon: '🧠'
      }
    });
    if (pageRes.items.length === 0) throw new Error('No se pudo crear la página de prueba.');
    const testPageId = pageRes.items[0].id;
    junkIds.push({ id: testPageId, proto: 'ATOM_DELETE', label: 'Página Test' });
    console.log(`   ✅ Página creada: ${testPageId}`);

    // 3. TEST: ATOM_CREATE (DATABASE INTERNA)
    console.log('🧬 [3/6] Probando Creación de Estructura (Database)...');
    const dbRes = handleNotion({
      provider: 'notion',
      protocol: 'ATOM_CREATE',
      context_id: testPageId,
      data: {
        name: '📊 DB_EXPERIMENTAL',
        class: 'TABULAR',
        fields: [
          { label: 'Indicie', type: 'NUMBER' },
          { label: 'Nota Científica', type: 'TEXT' }
        ]
      }
    });
    if (dbRes.items.length === 0) throw new Error('No se pudo crear la Database.');
    const testDbId = dbRes.items[0].id;
    // junkIds.push({ id: testDbId, proto: 'ATOM_DELETE', label: 'Database Test' }); // Borrar el padre (página) suele borrar al hijo en Notion, pero registramos por seguridad.
    console.log(`   ✅ Database Creada: ${testDbId}`);

    // 4. TEST: SCHEMA_MUTATE (NUEVA COLUMNA)
    console.log('🛠️  [4/6] Probando Mutación de ADN (Nueva Columna)...');
    const mutation = handleNotion({
      provider: 'notion',
      protocol: 'SCHEMA_MUTATE',
      context_id: testDbId,
      data: {
        payload: {
          fields: [{ label: 'Estado Fractal', type: 'SELECT' }]
        }
      }
    });
    if (mutation.metadata.status !== 'OK') throw new Error('Fallo en mutación: ' + mutation.metadata.error);
    console.log('   ✅ Columna SELECT inyectada con éxito.');

    // 5. TEST: ATOM_DECOMPOSE
    console.log('🔍 [5/6] Probando Descomposición Atómica (Blocks)...');
    const decomposition = handleNotion({
      provider: 'notion',
      protocol: 'ATOM_DECOMPOSE',
      context_id: testPageId
    });
    console.log(`   ✅ Página descompuesta. Bloques detectados: ${decomposition.items.length}`);

    // 6. LIMPIEZA TOTAL
    console.log('🧹 [6/6] Iniciando Purga de Basura Espacial...');
    // Borramos en orden inverso (hijos primero, aunque Notion archiva en cascada)
    for (const junk of junkIds.reverse()) {
      handleNotion({ provider: 'notion', protocol: 'ATOM_DELETE', context_id: junk.id });
      console.log(`   🗑️  Eliminado: ${junk.label} (${junk.id})`);
    }

    console.log('✨ OPERACIÓN COMPLETADA CON ÉXITO. Sistema Impecable.');

  } catch (e) {
    console.error('💥 ERROR EN LA PRUEBA DE DOMINIO:', e.message);
    console.log('⚠️  Intentando limpieza de emergencia...');
    junkIds.forEach(j => {
      try { handleNotion({ provider: 'notion', protocol: 'ATOM_DELETE', context_id: j.id }); } catch(err){}
    });
  }
}
