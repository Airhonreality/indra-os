/**
 * 🔬 SONDA: SessionRevokeAudit.gs
 * Misión: Validar la aniquilación física de sesiones L2 mediante el protocolo SYSTEM_SESSION_REVOKE.
 * 
 * Axioma: "Una sesión revocada no solo debe ser olvidada por el satélite, 
 * debe ser declarada muerta en el Libro Mayor (Keychain) del Core."
 */

function AUDIT_SESSION_REVOCATION_PROTOCOL() {
  const TEST_EMAIL = "sovereign-test@indra-os.com";
  const WORKSPACE_ID = "103MitQudDSMinRzzMLuzkWKmPN7UaDNr"; // Veta de Oro Alpha

  console.log("--- 🏗️ INICIANDO AUDITORÍA DE REVOCACIÓN [AUDIT_REVOKE_" + Date.now() + "] ---");

  try {
    // 1. GÉNESIS: Emitir una sesión real mediante el protocolo de Sync
    console.log("🔹 [PASO 1] Emitiendo sesión L2 para: " + TEST_EMAIL);
    const syncResponse = route({
      protocol: 'SYSTEM_IDENTITY_SYNC',
      workspace_id: WORKSPACE_ID,
      data: { id_token: TEST_EMAIL } // El Core acepta el email como token en sandbox
    });

    if (syncResponse.metadata.status !== 'OK') throw new Error("Fallo en emisión de sesión: " + syncResponse.metadata.error);
    
    const sessionToken = syncResponse.items[0].token;
    console.log("   ✅ Sesión emitida: " + sessionToken);

    // 2. VERIFICACIÓN DE VIDA: Validar que el Keychain reconoce el token como ACTIVE
    console.log("🔹 [PASO 2] Verificando estado inicial en el Llavero...");
    const initialStatus = _keychain_validate(sessionToken);
    if (!initialStatus || initialStatus.status !== 'ACTIVE') throw new Error("El token no nació vivo.");
    console.log("   ✅ Estado inicial: ACTIVE");

    // 3. EJECUCIÓN DEL PROTOCOLO: Llamar a SYSTEM_SESSION_REVOKE (Simulando Logout de Satélite)
    console.log("🔹 [PASO 3] Despachando protocolo de aniquilación: SYSTEM_SESSION_REVOKE");
    const revokeResponse = route({
      protocol: 'SYSTEM_SESSION_REVOKE',
      token: sessionToken // Pasamos el token como credencial de la petición
    });

    if (revokeResponse.metadata.status !== 'OK') throw new Error("El protocolo de revocación falló: " + revokeResponse.metadata.message);
    console.log("   ✅ Respuesta del Core: " + revokeResponse.metadata.message);

    // 4. VERIFICACIÓN DE MUERTE: Intentar validar el token de nuevo
    console.log("🔹 [PASO 4] Intentando usar el token revocado...");
    const postRevokeStatus = _keychain_validate(sessionToken);
    
    if (postRevokeStatus === null) {
      console.log("   ✅ ÉXITO: El token ha sido erradicado del circuito de validación.");
    } else {
      throw new Error("ERROR CRÍTICO: El token sigue siendo válido tras la revocación. Estado: " + postRevokeStatus.status);
    }

    console.log("\n--- 🏁 RESULTADO: PROTOCOLO AXIOMÁTICO VALIDADO ---");
    console.log("La soberanía del sujeto ha sido protegida. El logout es ahora una realidad física.");

  } catch (e) {
    console.error("❌ FALLO DE AUDITORÍA: " + e.message);
  }
}
