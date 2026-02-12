/**
 * @file ErrorHandler.gs
 * @dharma Ser el Creador y Clasificador Universal de Errores.
 * @description Transforma excepciones caóticas en errores estructurados, 
 * predecibles y clasificados por severidad.
 * 
 * CONTRATO CANÓNICO:
 * - RF-M-1: Exporta fábrica createErrorHandler() sin argumentos
 * - RF-G-1: Define listas internas RECOVERABLE_ERRORS y CRITICAL_ERRORS
 * - RF-X-1: Método createError(code, message, details)
 * - RF-X-2: Severity calculada automáticamente
 * - RF-X-3: Método isRecoverable(error)
 * - RF-X-4: Método requiresImmediateAttention(error)
 */

/**
 * Factory para crear el ErrorHandler
 * @returns {Object} Instancia inmutable del ErrorHandler
 */
function createErrorHandler() {
    // RF-G-1: Listas de códigos de error
    const RECOVERABLE_ERRORS = [
        'RATE_LIMIT',
        'NETWORK_TIMEOUT',
        'TEMPORARY_UNAVAILABLE',
        'SERVICE_BUSY',
        'QUOTA_EXCEEDED'
    ];

    const CRITICAL_ERRORS = [
        'INVALID_CREDENTIALS',
        'PERMISSION_DENIED',
        'RESOURCE_NOT_FOUND',
        'CONFIGURATION_ERROR',
        'SYSTEM_FAILURE',
        'INVALID_CONTRACT',
        'AUTHENTICATION_FAILED'
    ];

    function createError(code, message, details) {
        const error = new Error(message);
        error.code = code;
        error.timestamp = new Date().toISOString();
        
        // AXIOMA: Guardia de Circularidad (L9 - Catch-22)
        // Evita que el ErrorHandler crashee al intentar procesar un objeto circular.
        try {
            if (details) {
                const cache = [];
                const safeDetails = JSON.parse(JSON.stringify(details, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) return '[Circular]';
                        cache.push(value);
                    }
                    return value;
                }));
                error.details = safeDetails;
            } else {
                error.details = {};
            }
        } catch (e) {
            error.details = { _error: "Circularity or Serialization Failure", _hint: e.message };
        }
        
        error.context = error.details; // Alias para compatibilidad con tests de Axioma 5
        
        // RF-X-2: Calcular severidad automáticamente
        error.severity = CRITICAL_ERRORS.includes(code) ? 'CRITICAL' : 'WARNING';
        
        return error;
    }

    /**
     * RF-X-3: Verifica si un error es recuperable
     * @param {Error} error - Error a verificar
     * @returns {boolean} True si es recuperable
     */
    function isRecoverable(error) {
        if (!error || !error.code) {
            return false;
        }
        return RECOVERABLE_ERRORS.includes(error.code);
    }

    /**
     * RF-X-4: Verifica si un error requiere atención inmediata
     * @param {Error} error - Error a verificar
     * @returns {boolean} True si requiere atención inmediata
     */
    function requiresImmediateAttention(error) {
        if (!error || !error.severity) {
            return false;
        }
        return error.severity === 'CRITICAL';
    }

    const schemas = {
        createError: {
            description: "Produces a structured, immutable error object with severity classification and technical context.",
            semantic_intent: "TRIGGER",
            io_interface: { 
                inputs: {
                    code: { type: "string", role: "GATE", description: "Unique mnemonic error identifier." },
                    message: { type: "string", role: "STREAM", description: "Human-readable fault description." },
                    details: { type: "object", role: "STREAM", description: "Technical metadata for forensic analysis." }
                }, 
                outputs: {
                    error: { type: "object", role: "PROBE", description: "Canonical error object." }
                } 
            }
        },
        isRecoverable: {
            description: "Assesses if a target error code permits automatic retry logic.",
            semantic_intent: "PROBE",
            io_interface: { 
                inputs: {
                    error: { type: "object", role: "STREAM", description: "The structured error object to evaluate." }
                }, 
                outputs: {
                    recoverable: { type: "boolean", role: "PROBE", description: "Recovery eligibility status." }
                } 
            }
        },
        requiresImmediateAttention: {
            description: "Determines if an error is classified as CRITICAL, requiring architectural intervention.",
            semantic_intent: "PROBE",
            io_interface: { 
                inputs: {
                    error: { type: "object", role: "STREAM", description: "The error object to be audited." }
                }, 
                outputs: {
                    critical: { type: "boolean", role: "PROBE", description: "Criticality status." }
                } 
            }
        }
    };

    // Axioma 4.2: Retornar instancia congelada (inmutabilidad)
    return Object.freeze({
        id: "service_error_handler_core",
        label: "Error Master",
        description: "Industrial engine for error classification, severity analysis, and recovery orchestration.",
        semantic_intent: "PROBE",
        archetype: "SERVICE",
        domain: "SYSTEM_INFRA",
        schemas: schemas,
        createError: createError,
        isRecoverable: isRecoverable,
        requiresImmediateAttention: requiresImmediateAttention
    });
}
