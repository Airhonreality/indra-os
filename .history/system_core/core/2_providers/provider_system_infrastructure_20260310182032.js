/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_infrastructure.gs
 * RESPONSABILIDAD: Operaciones puras de infraestructura y Drive.
 * AXIOMA: Solo gestiona la persistencia física de átomos en el Core.
 * =============================================================================
 */

/**
 * ATOM_READ: Lista todos los workspaces o lee uno específico.
 * @private
 */
function _system_handleRead(uqo) {
    let contextId = uqo.context_id;
    if (contextId === uqo.provider || contextId === 'system') contextId = 'workspaces';

    let targetClass = null;
    if (contextId === 'workspaces') targetClass = WORKSPACE_CLASS_;
    if (contextId === 'workflows') targetClass = WORKFLOW_CLASS_;
    if (contextId === 'schemas') targetClass = DATA_SCHEMA_CLASS_;
    if (contextId === 'formulas') targetClass = FORMULA_CLASS_;

    if (targetClass) {
        return _system_listAtomsByClass(targetClass, uqo.provider);
    }
    return _system_readAtom(contextId, uqo.provider);
}

function _system_handleCreate(uqo) {
    const data = uqo.data || {};
    const label = data.handle?.label || data.label || 'Sin título';
    const atomClass = data.class || WORKSPACE_CLASS_;
    return _system_createAtom(atomClass, label.trim(), data, uqo.provider);
}

function _system_handleDelete(uqo) {
    if (!uqo.context_id) throw createError('INVALID_INPUT', 'atom_delete requiere context_id.');
    return _system_deleteWorkspace(uqo.context_id);
}

function _system_handleUpdate(uqo) {
    if (!uqo.context_id || !uqo.data) throw createError('INVALID_INPUT', 'atom_update requiere context_id y data.');
    return _system_updateAtom(uqo.context_id, uqo.data, uqo.provider);
}

// ... (todas las funciones _system_... de infraestructura irán aquí)
// (Viendo que ya tengo indra_utils para slugify y deepMerge)
