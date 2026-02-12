/**
 * BackendLogger.js
 * DHARMA: Interceptor de logs del backend para mostrarlos en el frontend
 * AXIOMA: "Los logs del backend son visibles en desarrollo"
 */

class BackendLogger {
    constructor() {
        this.enabled = localStorage.getItem('BACKEND_LOGS_ENABLED') === 'true' || true; // Default: enabled
    }

    /**
     * Procesa la respuesta del backend y muestra logs si existen
     */
    processResponse(response, endpoint) {
        if (!this.enabled || !response._logs) {
            return response;
        }

        console.group(`📡 [BACKEND] ${endpoint}`);

        response._logs.forEach(log => {
            const emoji = {
                DEBUG: '🔍',
                INFO: 'ℹ️',
                WARN: '⚠️',
                ERROR: '❌',
                FATAL: '💀',
                USER: '👤'
            }[log.level] || '📝';

            const style = {
                DEBUG: 'color: #888',
                INFO: 'color: #0066cc',
                WARN: 'color: #ff9900',
                ERROR: 'color: #cc0000',
                FATAL: 'color: #ff0000; font-weight: bold',
                USER: 'color: #00cc00'
            }[log.level] || '';

            console.log(
                `%c${emoji} [${log.component}] ${log.message}`,
                style,
                log.data || ''
            );
        });

        console.groupEnd();

        // Limpiar logs de la respuesta para no contaminar el estado
        delete response._logs;

        return response;
    }

    /**
     * Habilita/deshabilita logs del backend
     */
    toggle(enabled) {
        this.enabled = enabled;
        localStorage.setItem('BACKEND_LOGS_ENABLED', enabled.toString());
        console.log(`Backend logs ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Verifica si está habilitado
     */
    isEnabled() {
        return this.enabled;
    }
}

// Instancia global
const backendLogger = new BackendLogger();

export default backendLogger;
