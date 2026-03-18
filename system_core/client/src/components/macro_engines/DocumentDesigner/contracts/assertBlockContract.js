/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/contracts/assertBlockContract.js
 * RESPONSABILIDAD: Validar contrato estructural mínimo de los bloques renderizables.
 * AXIOMA: Si el contrato está roto, el sistema falla ruidosamente en la frontera.
 * =============================================================================
 */

export function assertBlockContract(componentName, block) {
    if (!block || typeof block !== 'object') {
        throw new Error(`[${componentName}] Contrato inválido: \`block\` debe ser un objeto no nulo.`);
    }

    if (!block.id || typeof block.id !== 'string') {
        throw new Error(`[${componentName}] Contrato inválido: \`block.id\` debe existir y ser string.`);
    }

    if (!block.type || typeof block.type !== 'string') {
        throw new Error(`[${componentName}] Contrato inválido: \`block.type\` debe existir y ser string.`);
    }

    if (!block.props || typeof block.props !== 'object' || Array.isArray(block.props)) {
        throw new Error(`[${componentName}] Contrato inválido: \`block.props\` debe ser un objeto.`);
    }
}
