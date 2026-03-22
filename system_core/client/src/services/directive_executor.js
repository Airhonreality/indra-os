/**
 * directive_executor.js
 * EL ÚNICO GUARDIÁN (ADR_003 §4)
 * Canal de comunicación universal para enviar Directivas (UQO) al Core.
 */

/**
 * Ejecuta una directiva contra el Core.
 * @param {Object} uqo - Universal Query Object { provider, protocol, data, query, ... }
 * @param {string} coreUrl - URL base del core GAS
 * @param {string} password - Credencial de acceso
 * @returns {Promise<{ items: Array, metadata: Object }>} The Return Law.
 */
export async function executeDirective(uqo, coreUrl, password) {
    if (!coreUrl) throw new Error('CORE_URL_MISSING');

    // AXIOMA DE DETERMINISMO RADICAL (ADR-008):
    // No se permiten alias de compatibilidad. El UQO debe ser sincero.
    const payload = {
        ...uqo,
        password: password,
        share_ticket: localStorage.getItem('indra-share-ticket') || null
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


    const t0 = Date.now();
    try {
        const response = await fetch(coreUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('CORE_HTTP_FAILURE:', response.status, responseText);
            console.groupEnd();
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

        // Validar The Return Law
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
            console.log('%c FULL_RESULT: ', 'color: #999;', result);
            console.groupEnd();
            
            const err = new Error(result.metadata.error || 'Unknown Core Error');
            err.code = result.metadata.code;
            err.metadata = result.metadata; // Adjuntamos para inspección
            throw err;
        }

        console.log('%c RESPONSE: ', 'color: #4caf50;', result);
        console.groupEnd();
        
        // Emitir pulso de entrada (Asentamiento)
        window.dispatchEvent(new CustomEvent('indra-pulse', { detail: { type: 'IN', protocol: resolvedProtocol } }));
        
        return result;

    } catch (error) {
        if (error.name !== 'Error') console.groupEnd(); // Evitar grupos abiertos en crashes fatales
        console.error(`[directive_executor] Failure [${traceId}]:`, error);
        throw error;
    }
}
