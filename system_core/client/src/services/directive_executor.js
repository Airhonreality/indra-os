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

    // Inyectar password en el payload (Muro de Soberanía)
    const payload = {
        ...uqo,
        password: password
    };

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
            throw new Error(`CORE_HTTP_ERROR: ${response.status} - ${responseText.substring(0, 200)}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[directive_executor] Raw response (non-JSON):', responseText);
            throw new Error(`CORE_PARSING_ERROR: La respuesta del servidor no es un JSON válido. Contenido: ${responseText.substring(0, 100)}...`);
        }

        // Validar The Return Law
        if (!result || !result.metadata) {
            throw new Error('CONTRACT_VIOLATION: Missing metadata in response');
        }

        if (result.metadata.status === 'ERROR' || result.metadata.status === 'ERROR_FLOW') {
            const err = new Error(result.metadata.error || 'Unknown Core Error');
            err.code = result.metadata.code;
            throw err;
        }

        return result;

    } catch (error) {
        console.error('[directive_executor] Failure:', error);
        throw error;
    }
}
