/**
 * directive_executor.js
 * EL ÚNICO GUARDIÁN (ADR_003 §4)
 * Canal de comunicación universal para enviar Directivas (UQO) al Core.
 */

/**
 * Ejecuta una directiva contra el Core.
 * @param {Object} uqo - Universal Query Object { provider, protocol, data, query, ... }
 * @param {string} coreUrl - URL base del core GAS
 * @param {string} sessionSecret - Credencial de acceso (Satellite Key o Session Ticket)
 * @param {string} [shareTicket] - Ticket de acceso compartido opcional (Inyectado desde estado)
 * @returns {Promise<{ items: Array, metadata: Object }>} El Retorno Canónico.
 */
export async function executeDirective(uqo, coreUrl, sessionSecret, shareTicket = null) {
    if (!coreUrl) throw new Error('CORE_URL_MISSING');

    // LIMPIEZA SOBERANA: Eliminar parámetros de cuenta que rompen CORS en GAS
    const cleanCoreUrl = coreUrl.split('?')[0];

    // AXIOMA DE DETERMINISMO RADICAL (ADR-008):
    // No se permiten alias de compatibilidad. El UQO debe ser sincero.
    const payload = {
        ...uqo,
        password: sessionSecret,
        share_ticket: shareTicket || null
    };

    const resolvedProtocol = uqo.protocol || uqo.method || 'UNKNOWN';
    const traceId = `UQO[${resolvedProtocol}]_${Math.random().toString(36).substring(7)}`;

    if (!payload.provider || !payload.protocol) {
        throw new Error(`DETERMINISM_VIOLATION: Se requiere provider y protocol explícitos en el UQO. Trace: ${traceId}`);
    }
    
    // Emitir pulso de salida (Resonancia)
    window.dispatchEvent(new CustomEvent('indra-pulse', { detail: { type: 'OUT', protocol: resolvedProtocol } }));

    // --- HIGIENE SOBERANA (ADR-002) ---
    // Clonamos y sanitizamos para el log de consola (No exponer secretos en pantalla)
    const sanitizedPayload = JSON.parse(JSON.stringify(payload));
    if (sanitizedPayload.password) sanitizedPayload.password = '••••••••';
    if (sanitizedPayload.data?.api_key) sanitizedPayload.data.api_key = '••••••••';
    if (sanitizedPayload.data?.secret) sanitizedPayload.data.secret = '••••••••';

    console.group(`%c ⚡ INDRA_WIRE: ${resolvedProtocol} `, 'background: #222; color: #bada55; font-weight: bold;', traceId);
    console.log('%c UQO_DATA: ', 'color: #777;', uqo.data);
    console.log('%c FULL_PAYLOAD: ', 'color: #444;', sanitizedPayload);


    // --- RESILIENCIA AXIAL (TIMEOUT) ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de paciencia

    const t0 = Date.now();
    try {
        console.log(`%c [wire] Conectando con Core (SANITIZED): ${cleanCoreUrl} `, 'color: #999; font-style: italic;');
        
        const response = await fetch(cleanCoreUrl, {
            method: 'POST',
            mode: 'cors',
            signal: controller.signal,
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        }).catch(err => {
            if (err.name === 'AbortError') {
                throw new Error('CORE_TIMEOUT: El núcleo no respondió en el tiempo esperado (30s).');
            }
            // Sonda de diagnóstico JIT para errores de red
            console.error(`%c [CRITICAL_NETWORK_ERROR] Fallo de conexión física con el Core. `, 'background: red; color: white;');
            throw err;
        });

        clearTimeout(timeoutId);
        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('CORE_HTTP_FAILURE:', response.status, responseText);
            throw new Error(`CORE_HTTP_ERROR: ${response.status} - ${responseText.substring(0, 200)}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.log('%c RAW_RESPONSE (FAILED_JSON): ', 'color: #f44;', responseText);
            console.groupEnd();
            throw new Error(`CORE_PARSING_ERROR: La respuesta no es JSON. Contenido: ${responseText.substring(0, 100)}...`);
        }

        // --- ESCUDO DE RESILIENCIA (ADR-003-B) ---
        // Si hay metadatos de éxito pero el backend fue "perezoso" y no envió 'items',
        // completamos el contrato preventivamente para no romper la ejecución.
        if (result && result.metadata && !result.items) {
            result.items = [];
        }

        // Validar The Return Law (Nivel Estricto)
        if (!result || !result.metadata) {
            console.groupEnd();
            throw new Error('CONTRACT_VIOLATION: Missing metadata in response');
        }

        const latency_ms = Date.now() - t0;
        window.dispatchEvent(new CustomEvent('indra-trace', {
            detail: {
                traceId,
                protocol: resolvedProtocol,
                provider: uqo.provider || 'unknown',
                timestamp_out: t0,
                latency_ms,
                result: result,
                uqo: uqo
            }
        }));

        if (result.metadata.status === 'ERROR' || result.metadata.status === 'ERROR_FLOW') {
            console.log('%c CORE_INTERNAL_ERROR: ', 'color: #f44;', result.metadata);
            
            // --- DHARMA DE ERRORES: Detección y Emisión ---
            const errorAtom = result.items?.find(item => item.class === 'INDRA_ERROR');
            if (errorAtom) {
                window.dispatchEvent(new CustomEvent('indra-error-atom', { detail: errorAtom }));
            }

            console.log('%c FULL_RESULT: ', 'color: #999;', result);
            console.groupEnd();
            
            const err = new Error(result.metadata.error || 'Unknown Core Error');
            err.code = result.metadata.code || (errorAtom ? errorAtom.payload.code : 'UNKNOWN');
            err.metadata = result.metadata;
            err.atom = errorAtom;
            throw err;
        }

        console.log('%c RESPONSE: ', 'color: #4caf50;', result);
        console.groupEnd();
        
        // Emitir pulso de entrada (Asentamiento)
        window.dispatchEvent(new CustomEvent('indra-pulse', { detail: { type: 'IN', protocol: resolvedProtocol } }));
        
        return result;

    } catch (error) {
        // --- AXIOMA DE AUTO-SANACIÓN (v7.5) ---
        // Si el Core informa que el Ledger está desincronizado (IDs Fantasma), 
        // intentamos una reconstrucción automática y reintentamos la directiva original.
        if (error.message.includes('SYSTEM_REBUILD_LEDGER') && uqo.protocol !== 'SYSTEM_REBUILD_LEDGER') {
            console.warn(`%c 🛡️ [Self-Healing] Detectada inconsistencia en Ledger. Intentando reconstrucción... `, 'background: #333; color: #ffeb3b; padding: 2px;');
            try {
                // Ejecutamos la reconstrucción (Recursión segura ya que validamos el protocolo)
                await executeDirective({ protocol: 'SYSTEM_REBUILD_LEDGER', provider: 'system' }, coreUrl, sessionSecret, shareTicket);
                console.log(`%c ✅ [Self-Healing] Ledger reconstruido. Reintentando operación: ${resolvedProtocol}... `, 'color: #4caf50;');
                // Reintento recursivo
                return await executeDirective(uqo, coreUrl, sessionSecret, shareTicket);
            } catch (rebuildErr) {
                console.error(`%c ❌ [Self-Healing] La reconstrucción automática falló. `, 'color: #f44;', rebuildErr);
                // Si la sanación falla, lanzamos el error original para no ocultar el problema base
                throw error;
            }
        }

        if (error.name !== 'Error') console.groupEnd(); // Evitar grupos abiertos en crashes fatales
        console.error(`[directive_executor] Failure [${traceId}]:`, error);
        throw error;
    }
}
