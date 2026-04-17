/**
 * INDRA CORE WRAPPERS
 * Responsibility: Expose logic engines functions to the global scope for protocol_router.
 */

/**
 * Global wrapper for LogicEngine.executeLogicBridge
 * Allows the protocol_router to invoke this via global scope even if LogicEngine is an object.
 */
function SYSTEM_executeLogicBridge(uqo) {
    return LogicEngine.executeLogicBridge(uqo);
}
