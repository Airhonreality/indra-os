/**
 * =============================================================================
 * COMPONENTE: Error Handler (Global)
 * RESPONSABILIDAD: Captura y registro de excepciones sistémicas.
 * AXIOMA: Ningún error debe ser silencioso; la transparencia es el primer paso a la curación.
 * =============================================================================
 */

function handleSystemError(error, context) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: error.message || error,
    stack: error.stack || 'No stack trace available',
    context: context || 'Global context'
  };
  
  console.error('[System Error Detected]', logEntry);
  
  // Registrar en el log de auditoría si existe
  try {
    if (typeof logError === 'function') {
      logError(context || 'GLOBAL_HANDLER', error);
    }
  } catch (e) {
    // Si falla el log, al menos lo vimos en la consola
  }
  
  return logEntry;
}

/**
 * Función de conveniencia para envolver ejecuciones críticas.
 */
function tryCatchSystem(fn, context) {
  try {
    return fn();
  } catch (e) {
    return handleSystemError(e, context);
  }
}
