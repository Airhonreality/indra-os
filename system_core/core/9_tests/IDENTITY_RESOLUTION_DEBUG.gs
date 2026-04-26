function DEBUG_IDENTITY_FLOW_REAL() {
  const CONFIG = {
    "core_url": "https://script.google.com/macros/s/AKfycbzNYqBxqYerE57B3BVvJWPtd4OysYlihHSe3Glv-5RmFGhdLS5Xy-nzkV7pfhZkx6gi/exec",
    "core_token": "indra_satellite_omega",
    "satellite_id": "indra-satellite-seed",
    "workspace_id": "103MitQudDSMinRzzMLuzkWKmPN7UaDNr",
  };

  const TEST_EMAIL = 'javier@indra-os.com';
  
  console.log('🚀 INICIANDO IGNICIÓN DE PRUEBA ULTRA-REALISTA...');
  
  // --- FASE 1: REGISTRO VÍA RED ---
  console.log('\n📡 [Network:Register] Enviando petición al Gateway...');
  
  const registerPayload = {
    protocol: 'SYSTEM_IDENTITY_REGISTER',
    workspace_id: CONFIG.workspace_id,
    password: CONFIG.core_token,
    data: {
      id_token: TEST_EMAIL,
      payload: {
        email: TEST_EMAIL,
        name: 'Javier Real Test',
        role: 'MASTER'
      }
    }
  };

  const regResponse = _sendToCore(CONFIG.core_url, registerPayload);
  console.log('📦 Respuesta Registro:', JSON.stringify(regResponse, null, 2));

  // --- FASE 2: SYNC (LOGIN) VÍA RED ---
  console.log('\n📡 [Network:Sync] Verificando cristalización...');
  
  const syncPayload = {
    protocol: 'SYSTEM_IDENTITY_SYNC',
    workspace_id: CONFIG.workspace_id,
    password: CONFIG.core_token,
    data: {
      id_token: TEST_EMAIL
    }
  };

  const syncResponse = _sendToCore(CONFIG.core_url, syncPayload);
  console.log('📦 Respuesta Sync:', JSON.stringify(syncResponse, null, 2));

  if (syncResponse.metadata && syncResponse.metadata.status === 'OK') {
     console.log('\n✅ ¡PRUEBA SUPERADA! La red y el Core están en resonancia.');
  } else {
     console.error('\n❌ FALLO: El Core respondió pero el sujeto no fue encontrado.');
     
     // --- FASE 3: INSPECCIÓN DE MATERIA FÍSICA ---
     console.log('\n🔍 [Debug:Physical] Inspeccionando contenido del Workspace...');
     DEBUG_WORKSPACE_CONTENT(CONFIG.workspace_id);
  }
}

/**
 * Inspecciona el núcleo de un Workspace específico.
 */
function DEBUG_WORKSPACE_CONTENT(workspaceId) {
  try {
    const ledgerId = _ledger_get_ss_id_(workspaceId);
    console.log(`📍 Spreadsheet del Workspace: https://docs.google.com/spreadsheets/d/${ledgerId}/edit`);
    
    const ss = SpreadsheetApp.openById(ledgerId);
    const sheets = ss.getSheets().map(s => s.getName());
    console.log(`📑 Pestañas encontradas: ${sheets.join(', ')}`);
    
    const entitySheet = ss.getSheetByName('Entidades');
    if (entitySheet) {
      const data = entitySheet.getDataRange().getValues();
      console.log(`👥 Filas en 'Entidades': ${data.length}`);
      if (data.length > 0) {
        console.log('📋 Cabeceras:', JSON.stringify(data[0]));
        if (data.length > 1) {
          console.log('👤 Última Fila:', JSON.stringify(data[data.length - 1]));
        }
      }
    } else {
      console.error("❌ NO EXISTE la pestaña 'Entidades' en esta Spreadsheet.");
    }
  } catch (e) {
    console.error(`❌ Error en inspección física: ${e.message}`);
  }
}

/**
 * Simulador de TransportLayer.js (fetch)
 */
function _sendToCore(url, payload) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const res = UrlFetchApp.fetch(url, options);
  return JSON.parse(res.getContentText());
}

