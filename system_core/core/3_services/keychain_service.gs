/**
 * =============================================================================
 * ARTEFACTO: 3_services/keychain_service.gs
 * CAPA: 3 — Service Layer (Servicios de Orquestación)
 * RESPONSABILIDAD: Gestión del Ledger de Identidades (Llavero) y Tokens de Satélite.
 * ADR-041: Implementación del Motor de Soberanía vía Tokens Maestros (OMEGA).
 * =============================================================================
 */

const KEYCHAIN_STORAGE_KEY_ = 'INDRA_KEYCHAIN_LEDGER';
const DEFAULT_SATELLITE_TOKEN_ = 'indra_satellite_omega';

/**
 * Valida si un token existe y está activo.
 * Retorna el contexto del satélite si es válido, o null si no.
 * Es invocado por el api_gateway en cada petición entrante.
 */
function _keychain_validate(token) {
    if (!token) return null;
    const ledger = _keychain_getLedger_();
    const entry = ledger[token];
    
    if (entry && entry.status === 'ACTIVE') {
        return entry; // Retornamos el perfil completo (clase MASTER, scopes, etc.)
    }
    
    return null;
}

/**
 * SYSTEM_KEYCHAIN_GENERATE: Protocolo para emitir nuevas llaves (Soberanía Fractal).
 */
function _keychain_generate(uqo) {
    const data = uqo.data || {};
    const name = data.name || "Nuevo Satélite";
    
    // 1. Validar Identidad del Emisor (Padre)
    const parentToken = uqo.satellite_token || null;
    const parentContext = parentToken ? _keychain_validate(parentToken) : null;
    
    // Si el emisor no es MASTER y no tiene permiso de delegar, abortamos
    if (parentContext && parentContext.can_delegate === false) {
        throw createError('SECURITY_VIOLATION', 'Este token no tiene autoridad para delegar soberanía.');
    }

    // 2. Axioma de Herencia: Limitar Scopes al alcance del padre
    let finalScopes = data.scope_id ? [data.scope_id] : ["ALL"];
    let isMaster = !data.scope_id && (!parentContext || parentContext.class === 'MASTER');

    if (parentContext && parentContext.class !== 'MASTER') {
        // Un hijo solo puede tener scopes que el padre ya poseía
        if (data.scope_id && !parentContext.scopes.includes(data.scope_id)) {
            throw createError('SCOPE_VIOLATION', 'No puedes delegar acceso a un Workspace que tú no controlas.');
        }
        // Si el usuario no especificó scope, hereda los del padre
        if (!data.scope_id) finalScopes = parentContext.scopes;
        isMaster = false; // Un hijo de un SCOPED nunca puede ser MASTER
    }

    const newToken = 'indra_' + _system_slugify_(name) + '_' + Math.random().toString(36).substring(2, 11);
    const ledger = _keychain_getLedger_();
    
    ledger[newToken] = {
        name: name,
        status: "ACTIVE",
        class: isMaster ? "MASTER" : "SCOPED",
        parent_id: parentToken, // Vínculo de Sangre
        can_delegate: data.can_delegate !== undefined ? data.can_delegate : true,
        created_at: new Date().toISOString(),
        scopes: finalScopes,
        scope_label: data.scope_label || (isMaster ? "Acceso Universal" : "Acceso Heredado")
    };
    
    _keychain_saveLedger_(ledger);
    logInfo(`[keychain] Nueva llave jerárquica generada: ${name} (Hijo de ${parentToken || 'RAIZ'})`);
    
    return { 
        items: [{ id: newToken, label: name }], 
        metadata: { status: 'OK', message: 'Llave jerárquica generada con éxito.' } 
    };
}

/**
 * SYSTEM_KEYCHAIN_REVOKE: Protocolo para invalidar una llave y TODA su descendencia.
 */
/**
 * SYSTEM_KEYCHAIN_REVOKE: Comando de Nivel 1 (Protocol Router)
 * Recibe la intención y valida el permiso de ejecución.
 */
function SYSTEM_KEYCHAIN_REVOKE(uqo) {
  const token = uqo.context_id || uqo.data?.token;
  if (!token) throw createError('INVALID_INPUT', 'Se requiere el token para revocar.');
  
  logWarn(`[keychain] ☢️ COMANDO DE PURGADO RECIBIDO PARA: ${token}`);
  
  // Iniciamos la transacción 2PC (Two-Phase Commit)
  const masterLedger = ledger_keychain_read_all();
  _keychain_execute_purge_(token, masterLedger);
  
  return { metadata: { status: 'OK', message: 'Identidad y descendencia purgadas bajo protocolo 2PC.' } };
}

/**
 * PROTOCOLO DE DOS FASES (2PC) - Ejecutor Interno
 * 1. Fase Física: Purgado de recursos (Drive).
 * 2. Fase Lógica: Purgado de Ledger.
 */
function _keychain_execute_purge_(targetId, ledger) {
  const entry = ledger[targetId];
  if (!entry) return;

  // 1. RECURSIÓN: Purgar descendencia primero (Cascada)
  Object.keys(ledger).forEach(key => {
    if (ledger[key].parent_id === targetId) {
      _keychain_execute_purge_(key, ledger);
    }
  });

  // 2. FASE FÍSICA: Purgado Territorial
  const territorialScopes = (entry.scopes || []).filter(s => 
    ['DEPLOY_TARGET', 'WORKSPACE_ROOT', 'DATA_VAULT'].includes(s.type)
  );
  
  territorialScopes.forEach(scope => {
    if (scope.value) {
      try {
        logInfo(`[keychain] Liberando espacio físico: ${scope.type} -> ${scope.value}`);
        DriveApp.getFolderById(scope.value).setTrashed(true);
      } catch (e) {
        logWarn(`[keychain] Fallo en purga física (No-bloqueante): ${e.message}`);
      }
    }
  });

  // 3. FASE LÓGICA: Borrado en Ledger
  ledger_keychain_delete(targetId);
}

/**
 * SYSTEM_KEYCHAIN_AUDIT: Inspección de todas las llaves activas en el sistema.
 */
function _keychain_audit() {
    const ledger = _keychain_getLedger_();
    // AXIOMA v7.7: La auditoría solo reconoce la vida (ACTIVE). 
    // Los muertos no votan ni se listan.
    const items = Object.keys(ledger)
        .filter(token => ledger[token].status === 'ACTIVE')
        .map(token => ({
            id: token,
            ...ledger[token]
        }));
    return { items, metadata: { status: 'OK', total: items.length } };
}

/**
 * SYSTEM_KEYCHAIN_SCHEMA: Retorna el contrato de datos del Llavero.
 * AXIOMA: La UI no inventa, el Core dicta.
 */
function SYSTEM_KEYCHAIN_SCHEMA() {
    return {
        items: [{
            fields: [
                { id: 'name', label: 'NOMBRE_DE_IDENTIDAD', placeholder: 'Ej: Agente Operativo Alpha', required: true },
                { id: 'class', label: 'CLASE_DE_IDENTIDAD', options: ['MASTER', 'SCOPED'], default: 'SCOPED' },
                { id: 'scopes', label: 'ALCANCE_DE_ACCESO', placeholder: 'ALL o WorkspaceID' }
            ],
            metadata: {
                ledger_version: 'v7.9',
                sincerity_standard: 'ADR-041'
            }
        }],
        metadata: { status: 'OK', total: 1 }
    };
}

/**
 * Procedimiento de Exorcismo: Limpia las ScriptProperties que causan interferencia.
 */
function system_purge_legacy_karma() {
    const keysToPurge = [
        "SYS_CORE_OWNER_UID",
        "SYS_MOUNT_DRIVE_ROOT_ID",
        "SYS_MOUNT_ROOT_ID",
        "SYS_IS_BOOTSTRAPPED",
        "SYS_ROOT_FOLDER_ID"
    ];
    const props = PropertiesService.getScriptProperties();
    keysToPurge.forEach(k => {
        props.deleteProperty(k);
        logInfo(`[exorcism] Karma purgado: ${k}`);
    });
    return { status: 'CLEAN' };
}

// ─── MOTOR INTERNO (PERSISTENCIA) ───────────────────────────────────────────

function _keychain_getLedger_() {
    // 1. Intentar leer desde el Ledger (Nuevo Estándar)
    const ledger = ledger_keychain_read_all();
    
    // 2. Si el Ledger tiene datos, es la Verdad Central
    if (Object.keys(ledger).length > 0) return ledger;

    // ─── PROCESO DE MIGRACIÓN LEGACY (v4.40 Renaissance) ───
    const rawLegacy = PropertiesService.getScriptProperties().getProperty(KEYCHAIN_STORAGE_KEY_);
    if (rawLegacy) {
        logWarn("[keychain] Detectado Llavero Legacy. Iniciando migración al Master Ledger...");
        try {
            const legacyData = JSON.parse(rawLegacy);
            Object.keys(legacyData).forEach(token => {
                ledger_keychain_sync(token, legacyData[token]);
            });
            // Una vez migrado, purgamos el legacy para liberar los 9KB
            PropertiesService.getScriptProperties().deleteProperty(KEYCHAIN_STORAGE_KEY_);
            logSuccess("[keychain] Migración completada. Espacio de PropertiesService liberado.");
            return legacyData;
        } catch (e) {
            logError("[keychain] Fallo en migración legacy.", e);
        }
    }

    // 3. Si no hay nada, bootstrap inicial
    return _keychain_bootstrap_();
}

function _keychain_saveLedger_(ledger) {
    // Ya no guardamos todo el objeto en una sola propiedad (Adiós límite de 9KB)
    // Sincronizamos entrada por entrada (Peristaltismo)
    Object.keys(ledger).forEach(token => {
        ledger_keychain_sync(token, ledger[token]);
    });
}

/**
 * Protocolo de Bootstrap: Genera la llave indra_satellite_omega si el llavero está vacío.
 */
function _keychain_bootstrap_() {
    const initial = {};
    initial[DEFAULT_SATELLITE_TOKEN_] = {
        name: "Sistema Monolítico (Bootstrap)",
        status: "ACTIVE",
        class: "MASTER", 
        created_at: new Date().toISOString(),
        scopes: ["ALL"]
    };
    _keychain_saveLedger_(initial);
    logWarn("[keychain] Bootstrap de Llavero ejecutado con éxito.");
    return initial;
}
