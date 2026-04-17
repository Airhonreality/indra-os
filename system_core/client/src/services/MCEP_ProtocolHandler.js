/**
 * MCEP_ProtocolHandler.js
 * LAS MANOS DE INDRA (ADR_012)
 * Procesa las respuestas de la IA y ejecuta las intenciones sobre los motores.
 */

import { executeDirective } from './directive_executor';
import { useAppState } from '../state/app_state';

export class MCEP_ProtocolHandler {

    constructor() {
        // Regex para detectar llamadas a herramientas: call: provider.protocol({ data })
        this.callRegex = /call:\s*([\w]+)\.([\w]+)\s*\(([\s\S]*?)\)/g;
    }

    /**
     * Analiza una respuesta de la IA y ejecuta cualquier directiva encontrada.
     * @param {string} responseContent - El texto generado por la IA.
     * @returns {Promise<Array>} - Lista de resultados de ejecución.
     */
    async processInteractions(responseContent) {
        const { coreUrl, sessionSecret } = useAppState.getState();
        const matches = [...responseContent.matchAll(this.callRegex)];
        if (matches.length === 0) return [];

        console.log(`[MCEP_Handler] Detectadas ${matches.length} interacciones agénticas.`);
        
        const executions = matches.map(async (match) => {
            const [fullMatch, provider, protocol, dataString] = match;
            
            try {
                // Parsear el payload (con seguridad básica)
                const data = this._parseData(dataString);
                
                // Ejecutar la directiva real
                console.log(`[MCEP_Handler] Ejecutando: ${provider}.${protocol}`, data);
                const result = await executeDirective({
                    executor: provider,
                    method: protocol,
                    data
                }, coreUrl, sessionSecret);


                return {

                    call: `${provider}.${protocol}`,
                    status: 'SUCCESS',
                    result: result.items || result.results || result.payload || result.metadata || result
                };

            } catch (error) {
                console.error(`[MCEP_Handler] Error en ejecución ${provider}.${protocol}:`, error);
                return {
                    call: `${provider}.${protocol}`,
                    status: 'ERROR',
                    error: error.message
                };
            }
        });

        return await Promise.all(executions);
    }

    /**
     * Intenta parsear el bloque de datos que viene de la IA.
     */
    _parseData(str) {
        try {
            // Intentar JSON directo
            return JSON.parse(str.trim() || '{}');
        } catch (e) {
            // Fallback para formatos relajados que a veces tiran los LLMs
            try {
                const fn = new Function(`return ${str}`);
                return fn();
            } catch (error) {
                console.error('[MCEP_Handler] Fallo crítico al parsear DATA de la IA:', str);
                return {};
            }
        }
    }

    /**
     * Prepara el mensaje de retroalimentación para la IA.
     * Ciclo de Sinceridad (TGS).
     */
    formatFeedbackForAI(results) {
        if (results.length === 0) return null;

        const feedback = results.map(res => {
            return `[EXECUTION_RESULT: ${res.call}]\nStatus: ${res.status}\nData: ${JSON.stringify(res.result || res.error)}`;
        }).join('\n\n');

        return `
            RESULTADOS DE EJECUCIÓN:
            ${feedback}
            
            Continúa con el siguiente paso del ciclo si es necesario.
        `;
    }
}

export const mcepHandler = new MCEP_ProtocolHandler();
