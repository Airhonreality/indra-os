/**
 * 🕵️ VERIFICACIÓN DE REALIDAD (MANUAL)
 * Dharma: Validar que el Core puede reconocer una identidad ya existente en las Sheets.
 */
function verifyExistingIdentity() {
  // IDs extraídos de los logs de la ejecución 15:31:02
  const WS_REAL = "103MitQudDSMinRzzMLuzkWKmPN7UaDNr"; // Veta de Oro Alpha
  const testEmail = "sovereign-test@indra-os.com";

  console.log(`\n--- 🏺 BUSCANDO MATERIA PERSISTENTE EN [${WS_REAL}] ---`);

  try {
    // 1. Intentar Login Atómico
    // Si la fila está en la Sheet 'Identidades' de ese Workspace, el Core DEBE encontrarla.
    const syncRes = AuthService.syncIdentity({
        protocol: 'SYSTEM_IDENTITY_SYNC',
        workspace_id: WS_REAL,
        data: { id_token: testEmail }
    });

    console.log("✅ ¡CONEXIÓN EXITOSA! La materia persiste en la infraestructura real.");
    console.log("🎟️ Token de sesión emitido: " + syncRes.items[0].token);
    console.log("👤 Perfil recuperado de la Sheet: " + JSON.stringify(syncRes.items[0].profile));

  } catch (e) {
    console.warn("⚠️ RESULTADO: " + e.message);
    console.log("---------------------------------------------------------");
    console.log("Interpretación Axiomática:");
    console.log("1. Si dice 'not found', es que el Cleanup de la sonda v2.5 funcionó y borró la fila.");
    console.log("2. Si devuelve el perfil, es que el sistema de persistencia en Sheets es 100% real.");
    console.log("---------------------------------------------------------");
  }
}
