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
 * SYSTEM_KEYCHAIN_GENERATE: Protocolo para emitir nuevas llaves soberanas.
 */
function _keychain_generate(uqo) {
    const data = uqo.data || {};
    const name = data.name || "Nuevo Satélite";
    const scopes = data.scopes || ["ALL"];
    
    // El token es determinista pero incluye entropía aleatoria
    const newToken = 'indra_' + _system_slugify_(name) + '_' + Math.random().toString(36).substring(2, 11);
    const ledger = _keychain_getLedger_();
    
    ledger[newToken] = {
        name: name,
        status: "ACTIVE",
        class: "MASTER", // Los tokens de satélite heredan soberanía total por defecto
        created_at: new Date().toISOString(),
        scopes: scopes
    };
    
    _keychain_saveLedger_(ledger);
    logInfo(`[keychain] Nueva llave generada para: ${name}`);
    
    return { 
        items: [{ id: newToken, label: name }], 
        metadata: { status: 'OK', message: 'Llave generada con éxito.' } 
    };
}

/**
 * SYSTEM_KEYCHAIN_REVOKE: Protocolo para invalidar una llave de forma inmediata.
 */
function _keychain_revoke(uqo) {
    const token = uqo.context_id || uqo.data?.token;
    if (!token) throw createError('INVALID_INPUT', 'Se requiere el token para revocar.');
    
    const ledger = _keychain_getLedger_();
    if (ledger[token]) {
        ledger[token].status = "REVOKED";
        ledger[token].revoked_at = new Date().toISOString();
        _keychain_saveLedger_(ledger);
        logInfo(`[keychain] Llave revocada: ${token}`);
        return { metadata: { status: 'OK', message: 'Llave revocada correctamente.' } };
    }
    
    return { metadata: { status: 'ERROR', error: 'Token no encontrado.' } };
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
    const raw = PropertiesService.getScriptProperties().getProperty(KEYCHAIN_STORAGE_KEY_);
    if (!raw) return _keychain_bootstrap_();

    try {
        return JSON.parse(raw);
    } catch (e) {
        logError("[keychain] LEDGER CORRUPTO. Recuperación de emergencia.", e);
        return _keychain_bootstrap_();
    }
}

function _keychain_saveLedger_(ledger) {
    PropertiesService.getScriptProperties().setProperty(KEYCHAIN_STORAGE_KEY_, JSON.stringify(ledger));
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
