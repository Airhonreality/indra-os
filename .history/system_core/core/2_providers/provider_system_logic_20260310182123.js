/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_logic.gs
 * RESPONSABILIDAD: Handlers de lógica, fórmulas y flujos vinculados al sistema.
 * AXIOMA: LÓGICA AGNOSTICA AL ALMACENAMIENTO.
 * =============================================================================
 */

/**
 * FORMULA_EVAL: El Motor de Fórmulas del Core.
 */
function system_evaluateFormula(uqo) {
    const query = uqo.query || {};
    let formula = query.formula;
    const variables = query.variables || {};
    const contextId = uqo.context_id;

    try {
        if (!formula && contextId && contextId !== 'formulas') {
            const file = _system_findAtomFile(contextId);
            const atom = JSON.parse(file.getBlob().getDataAsString());
            if (atom.class === FORMULA_CLASS_ && atom.raw && atom.raw.script) {
                formula = atom.raw.script;
            }
        }

        if (!formula || typeof formula !== 'string') throw createError('INVALID_INPUT', 'Falta fórmula.');

        const keys = Object.keys(variables);
        const values = Object.values(variables);
        const evaluator = new Function(...keys, `return (${formula});`);
        const result = evaluator(...values);

        return {
            items: [{
                id: 'calculation_result',
                handle: { ns: 'com.indra.system.logic', alias: 'result', label: String(result) },
                class: 'DATA',
                protocols: ['ATOM_READ'],
                value: result,
                formula: formula,
                timestamp: new Date().toISOString()
            }],
            metadata: { status: 'OK' }
        };
    } catch (e) {
        logError(`[logic] Error al evaluar: "${formula}"`, e);
        return { items: [], metadata: { status: 'ERROR', error: `Evaluación fallida: ${e.message}` } };
    }
}

/**
 * SCHEMA_SUBMIT: Ejecuta un workflow asociado a un formulario.
 */
function _system_handleSchemaSubmit(uqo) {
    const schemaId = uqo.context_id;
    const triggerData = (uqo.data && uqo.data.trigger_data) || {};

    try {
        const schemaFile = _system_findAtomFile(schemaId);
        const schemaAtom = JSON.parse(schemaFile.getBlob().getDataAsString());
        const workflowId = schemaAtom.raw?.on_submit?.workflow_id;

        if (!workflowId) return { items: [], metadata: { status: 'ERROR', error: 'Sin workflow asociado.' } };

        const wfFile = _system_findAtomFile(workflowId);
        const workflowObj = JSON.parse(wfFile.getBlob().getDataAsString());

        const workflowUqo = {
            protocol: 'WORKFLOW_EXECUTE',
            data: { workflow: workflowObj, trigger_data: triggerData },
            workspace_id: uqo.workspace_id
        };

        return handleWorkflowExecute(workflowUqo);
    } catch (e) {
        return { items: [], metadata: { status: 'ERROR', error: e.message } };
    }
}

/**
 * SCHEMA_FIELD_OPTIONS: Resuelve las opciones de un campo de relación.
 */
function _system_handleSchemaFieldOptions(uqo) {
    const schemaId = uqo.context_id;
    const fieldKey = uqo.query?.field_key;
    if (!fieldKey) throw createError('INVALID_INPUT', 'field_key requerida.');

    try {
        const file = _system_findAtomFile(schemaId);
        const schema = JSON.parse(file.getBlob().getDataAsString());
        const fields = (schema.payload?.fields) || (schema.raw?.fields) || [];
        const field = fields.find(f => f.id === fieldKey || f.key === fieldKey);

        if (!field || field.type !== 'relation_select' || !field.source) {
            throw createError('NOT_FOUND', 'Campo no es de tipo relación o le falta "source".');
        }

        const streamUqo = {
            provider: field.source.provider,
            protocol: 'TABULAR_STREAM',
            context_id: field.source.context_id,
            query: { limit: 100 }
        };

        const result = route(streamUqo);
        const options = (result.items || []).map(item => ({
            id: 'opt_' + (item.id || Math.random()),
            value: item.id,
            handle: {
                ns: 'com.indra.system.option',
                alias: item.handle?.alias || _system_slugify_(item.handle?.label || item.id),
                label: item.handle?.label || item.name || String(item.id)
            },
            class: 'OPTION',
            protocols: []
        }));

        return { items: options, metadata: { status: 'OK' } };
    } catch (e) {
        return { items: [], metadata: { status: 'ERROR', error: e.message } };
    }
}
