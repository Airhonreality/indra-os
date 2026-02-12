/**
 * @file SimpleDialog.gs
 * @dharma Ser la Interfaz Minimalista con el Usuario Humano.
 * @description Invoca los diálogos nativos de la UI de Google Sheets.
 * 
 * CONTRATO CANÓNICO:
 * - RF-M-1: Exporta fábrica createSimpleDialog({ errorHandler })
 * - RF-X-1: Método showPrompt(title, message) retorna string o null
 * - RF-X-2: Método showAlert(title, message)
 * 
 * NOTAS AXIOMÁTICAS:
 * - AN-1: Acoplamiento inevitable a SpreadsheetApp.getUi() está aislado aquí
 * - AN-2: No contiene lógica de presentación ni flujo, es passthrough puro
 * 
 * DEPENDENCIAS:
 * - 4_Infra/ErrorHandler.gs
 */

/**
 * Factory para crear SimpleDialog
 * @param {Object} dependencies - Dependencias inyectadas
 * @param {Object} dependencies.errorHandler - ErrorHandler instance
 * @returns {Object} Instancia inmutable de SimpleDialog
 */
function createSimpleDialog({ errorHandler }) {
    // Axioma: Fail-Fast Principle - Validación paranoica
    if (!errorHandler || typeof errorHandler.createError !== 'function') {
        throw new TypeError('createSimpleDialog: errorHandler contract not fulfilled');
    }

    /**
     * RF-X-1: Muestra un diálogo de prompt al usuario
     * @param {string} title - Título del diálogo
     * @param {string} message - Mensaje a mostrar
     * @returns {string|null} Texto ingresado por el usuario o null si cancela
     */
    function showPrompt(title, message) {
        // Fail-Fast validation
        if (typeof title !== 'string' || typeof message !== 'string') {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'showPrompt: title and message must be strings',
                { 
                    title: title, 
                    titleType: typeof title,
                    message: message,
                    messageType: typeof message
                }
            );
        }

        try {
            const ui = SpreadsheetApp.getUi();
            const response = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
            
            // Contrato explícito: retorna null si el usuario cancela
            if (response.getSelectedButton() === ui.Button.OK) {
                return response.getResponseText();
            } else {
                return null;
            }
        } catch (e) {
            throw errorHandler.createError(
                'SYSTEM_FAILURE',
                `Failed to show prompt: ${e.message}`,
                { 
                    title: title,
                    message: message,
                    originalError: e.toString() 
                }
            );
        }
    }

    /**
     * RF-X-2: Muestra un diálogo de alerta informativa
     * @param {string} title - Título del diálogo
     * @param {string} message - Mensaje a mostrar
     */
    function showAlert(title, message) {
        // Fail-Fast validation
        if (typeof title !== 'string' || typeof message !== 'string') {
            throw errorHandler.createError(
                'CONFIGURATION_ERROR',
                'showAlert: title and message must be strings',
                { 
                    title: title,
                    titleType: typeof title,
                    message: message,
                    messageType: typeof message
                }
            );
        }

        try {
            const ui = SpreadsheetApp.getUi();
            ui.alert(title, message, ui.ButtonSet.OK);
        } catch (e) {
            throw errorHandler.createError(
                'SYSTEM_FAILURE',
                `Failed to show alert: ${e.message}`,
                { 
                    title: title,
                    message: message,
                    originalError: e.toString() 
                }
            );
        }
    }

    // Axioma 4.2: Retornar instancia congelada (inmutabilidad)
    return Object.freeze({
        id: "service_dialog_core",
        label: "UI Master",
        description: "Industrial engine for simple user interactions and institutional alerts.",
        semantic_intent: "BRIDGE",
        archetype: "SERVICE",
        domain: "SYSTEM_INFRA",
        showPrompt: showPrompt,
        showAlert: showAlert
    });
}
