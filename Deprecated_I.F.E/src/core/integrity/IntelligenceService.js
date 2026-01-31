/**
 * 🛰️ INDRA INTELLIGENCE PROXY (core/integrity/IntelligenceService.js)
 * Purpose: Frontend-Backend bridge for AI interactions.
 * Axiom: Zero Reasoning in Frontend.
 */

import { CoreBridge } from '../bridge/CoreBridge';

export const IntelligenceService = {
    /**
     * Delegates AI Architect interaction to the Core.
     * @param {string} prompt - User request.
     * @param {string} model - Selected AI model.
     * @param {string} accountId - Specific credential account.
     * @param {object} currentFlow - Current JSON state of the canvas.
     * @param {array} history - Conversation history.
     */
    async ask(prompt, model = 'llama-3.3-70b-versatile', accountId = 'default', currentFlow = null, history = []) {
        try {
            // AXIOMA: Delegación de Inteligencia al Core.
            const result = await CoreBridge.callCore('intelligence', 'askArchitect', { prompt, model, accountId, currentFlow, history });

            const text = result.response;
            const detection = this._detectCommand(text);

            return {
                text,
                ...detection
            };

        } catch (error) {
            console.error('INTELLIGENCE_PROXY_FAILURE:', error);
            throw error;
        }
    },

    /**
     * Extracts JSON commands from LLM text output.
     * (Kept in frontend to trigger UI actions immediately after Core response)
     */
    _detectCommand(text) {
        try {
            const jsonRegex = /\{[\s\S]*"command"[\s\S]*\}/g;
            const matches = text.match(jsonRegex);

            if (matches && matches.length > 0) {
                const payload = JSON.parse(matches[0]);
                return {
                    commandDetected: true,
                    commandName: payload.command,
                    payload: payload.payload
                };
            }
        } catch (e) {
            console.warn('COMMAND_PARSE_ERROR:', e.message);
        }
        return { commandDetected: false };
    }
};

export default IntelligenceService;
