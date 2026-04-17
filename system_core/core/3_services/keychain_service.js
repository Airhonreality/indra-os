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
function _keychain_revoke(uqo) {
    const token = uqo.context_id || uqo.data?.token;
    if (!token) throw createError('INVALID_INPUT', 'Se requiere el token para revocar.');
    
    const ledger = _keychain_getLedger_();
    if (!ledger[token]) throw createError('NOT_FOUND', 'Token no encontrado.');

    // Protocolo de Matanza de Herencia (Cascading Revocation)
    const revokeRecursive = (targetId) => {
        if (!ledger[targetId]) return;
        
        // Revocar el actual
        ledger[targetId].status = "REVOKED";
        ledger[targetId].revoked_at = new Date().toISOString();
        logInfo(`[keychain] Revocado: ${targetId}`);

        // Buscar hijos
        Object.keys(ledger).forEach(childId => {
            if (ledger[childId].parent_id === targetId && ledger[childId].status === 'ACTIVE') {
                revokeRecursive(childId);
            }
        });
    };

    revokeRecursive(token);
    _keychain_saveLedger_(ledger);
    
    return { metadata: { status: 'OK', message: 'Llave y toda su descendencia han sido revocadas.' } };
}

/**
 * SYSTEM_KEYCHAIN_AUDIT: Inspección de todas las llaves activas en el sistema.
 */
function _keychain_audit() {
    const ledger = _keychain_getLedger_();
    const items = Object.keys(ledger).map(token => ({
        id: token,
        ...ledger[token]
    }));
    return { items, metadata: { status: 'OK', total: items.length } };
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
