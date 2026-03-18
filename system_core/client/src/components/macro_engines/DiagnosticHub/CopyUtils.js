/**
 * =============================================================================
 * UTILIDAD: CopyUtils.js
 * RESPONSABILIDAD: Servicio de copiado inteligente para el Diagnostic Hub.
 *   Ofrece tres modos de exportación de una traza al clipboard.
 *
 * AXIOMA DE SOBERANÍA: Ningún dato sale del sistema sin que el operador
 *   lo decida explícitamente. Este módulo es el "portón de salida".
 * =============================================================================
 */

/**
 * MODO 1: Copia el JSON completo de la traza (UQO + Response + Logs).
 * Útil para compartir con otro desarrollador o adjuntar a un bug report.
 * @param {Object} trace - Una IndraceTrace completa
 */
export function copyRaw(trace) {
    if (!trace) return false;
    // Excluimos el UQO de forma segura: si contiene password (no debería, el
    // directive_executor no lo incluye en el detail), lo eliminamos por seguridad.
    const safe = {
        traceId:       trace.traceId,
        protocol:      trace.protocol,
        provider:      trace.provider,
        timestamp_out: new Date(trace.timestamp_out).toISOString(),
        latency_ms:    trace.latency_ms,
        uqo:           { ...trace.uqo, password: '[REDACTED]' },
        result:        trace.result,
    };
    return _toClipboard(JSON.stringify(safe, null, 2));
}

/**
 * MODO 2: Copia un resumen legible para humanos (Informe de Sinceridad).
 * Idóneo para pegar en un chat, un ticket o un documento de trabajo.
 * @param {Object} trace
 */
export function copySincero(trace) {
    if (!trace) return false;
    const logs = trace.result?.metadata?.logs || [];
    const status = trace.result?.metadata?.status || 'UNKNOWN';
    const logLines = logs.map(l => `  [${l.level}] ${l.message}`).join('\n');

    const report = [
        `╔══ INDRA TRACE REPORT ══════════════════════════`,
        `║  ID:        ${trace.traceId}`,
        `║  Protocol:  ${trace.protocol}`,
        `║  Provider:  ${trace.provider}`,
        `║  Status:    ${status}`,
        `║  Latency:   ${trace.latency_ms}ms`,
        `║  Timestamp: ${new Date(trace.timestamp_out).toISOString()}`,
        `╠══ LOGS (${logs.length} entries) ═══════════════════════`,
        logLines || '  (sin logs)',
        `╚════════════════════════════════════════════════`,
    ].join('\n');

    return _toClipboard(report);
}

/**
 * MODO 3: Copia únicamente el UQO (la orden enviada).
 * Permite reutilizar el comando en el UQO Editor sin tener que rescribirlo.
 * @param {Object} trace
 */
export function copyUQO(trace) {
    if (!trace?.uqo) return false;
    // Asegurar que el password no viaje al clipboard
    const { password, ...safeUqo } = trace.uqo;
    return _toClipboard(JSON.stringify(safeUqo, null, 2));
}

/**
 * Escribe texto en el clipboard y devuelve true en éxito, false en fallo.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function _toClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback para entornos sin permisos de clipboard (HTTP no seguro)
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
    }
}
