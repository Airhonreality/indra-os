/**
 * 🛠️ INSPECCIÓN FÍSICA DIRECTA
 * Dharma: Validar la existencia de la materia en la Sheet de Entidades, ignorando el Ledger Maestro.
 * RESPONSABILIDAD: Identificar si el fallo es de ESCRITURA (Sheet vacía) o de INDEXACIÓN (Ledger no lo ve).
 */
function checkEntidadesSheet() {
  const WS_ID = "103MitQudDSMinRzzMLuzkWKmPN7UaDNr";
  
  console.log(`\n--- 🕵️ INSPECCIÓN DE MATERIA EN ${WS_ID} ---`);

  try {
    // Intentamos leer directamente por clase usando el protocolo estándar de lectura de átomos
    // pero forzando una lectura fresca sin filtros de autoridad pesados.
    const res = _system_handleRead({
      protocol: 'ATOM_READ',
      workspace_id: WS_ID,
      provider: 'system', // Usamos el proveedor de sistema para ver la 'verdad'
      data: { 
          class: 'IDENTITY'
      }
    });

    const items = res.items || [];
    console.log(`📊 Se encontraron ${items.length} registros en la clase IDENTITY.`);

    items.forEach((item, idx) => {
        let p = item.payload;
        if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch(e) { p = { raw: p }; }
        }
        console.log(`   [${idx}] ID: ${item.id} | Email: ${p?.email || 'N/A'}`);
    });

    if (items.length === 0) {
        console.warn("⚠️ LA SHEET DE ENTIDADES ESTÁ VACÍA. El ATOM_CREATE falló en la escritura física.");
    } else {
        console.log("✅ LA MATERIA EXISTE. El problema es que el Ledger Maestro NO la está indexando.");
    }

  } catch (e) {
    console.error("❌ ERROR EN INSPECCIÓN: " + e.message);
  }
}
