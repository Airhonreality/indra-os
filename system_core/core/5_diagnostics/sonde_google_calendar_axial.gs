// =============================================================================
// ARTEFACTO: 5_diagnostics/sonde_google_calendar_axial.gs
// RESPONSABILIDAD: Prueba de integridad del sistema de Calendario v16.2.
// EJECUCIÓN: Manual desde el editor de GAS.
// =============================================================================

function SONDE_CALENDAR_AXIAL() {
  const SONDE_ID = "INDRA_SONDE_" + Math.random().toString(36).substring(7).toUpperCase();
  console.log(`🚀 [Sonda:Calendar] INICIANDO PRUEBA AXIAL CANÓNICA: ${SONDE_ID}`);
  
  try {
    // ─── FASE 1: DESCUBRIMIENTO ───
    console.log("🔍 [Sonda] Fase 1: Validando Protocolo Canónico ATOM_DISCOVER...");
    const listRes = handleGoogleCalendar({ protocol: 'ATOM_DISCOVER' });
    if (!listRes.items || listRes.items.length === 0) throw new Error("No se detectaron calendarios.");
    console.log(`✅ [Sonda] Detectados ${listRes.items.length} calendarios.`);
    
    const primaryCal = listRes.items.find(c => c.handle.is_primary) || listRes.items[0];
    console.log(`📌 [Sonda] Usando calendario: ${primaryCal.handle.label} (${primaryCal.id})`);

    // ─── FASE 2: ESCRITURA CANÓNICA ───
    console.log("✍️ [Sonda] Fase 2: Probando ATOM_CREATE...");
    const writeRes = handleGoogleCalendar({
      protocol: 'ATOM_CREATE',
      context_id: primaryCal.id,
      data: {
        title: `🧪 [SONDA] Ignición Canónica v16.2: ${SONDE_ID}`,
        description: "Esta es una prueba de integridad bajo protocolo ATOM.",
        start: new Date().toISOString(),
        end: new Date(Date.now() + 3600000).toISOString(),
        colorId: "11"
      }
    });

    const eventId = writeRes.items[0].id;
    console.log(`✅ [Sonda] Átomo creado exitosamente. ID: ${eventId}`);

    // ─── FASE 3: LECTURA UNIVERSAL ───
    console.log("📡 [Sonda] Fase 3: Validando ATOM_READ...");
    const readRes = handleGoogleCalendar({
      protocol: 'ATOM_READ',
      context_id: primaryCal.id,
      data: { start: new Date(Date.now() - 60000).toISOString() }
    });

    const eventCheck = readRes.items.find(ev => ev.id === eventId);
    if (!eventCheck) throw new Error("El átomo creado no se encuentra en el log de lectura.");
    console.log(`✅ [Sonda] Resonancia confirmada: El átomo "${eventCheck.handle.label}" es real.`);

    // ─── FASE 4: LIMPIEZA PROTOCOLAR ───
    console.log("🧹 [Sonda] Fase 4: Ejecutando ATOM_DELETE...");
    const deleteRes = handleGoogleCalendar({
      protocol: 'ATOM_DELETE',
      context_id: primaryCal.id,
      data: { id: eventId }
    });

    if (deleteRes.metadata.status === 'OK') {
      console.log("✅ [Sonda] Basura espacial eliminada vía ATOM_DELETE.");
    }

    console.log(`✨ [Sonda] PRUEBA AXIAL EXITOSA. Calendario v16.2 es 100% CANÓNICO.`);

  } catch (e) {
    console.error(`❌ [Sonda] FALLO EN PROTOCOLO CANÓNICO: ${e.message}`);
  }
}
