/**
 * =============================================================================
 */

function FORMULA_EVAL(uqo) { return system_evaluateFormula(uqo); }

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
            protocols: [],
            type: 'PROBE'
        }));

        return { items: options, metadata: { status: 'OK' } };
    } catch (e) {
        return { items: [], metadata: { status: 'ERROR', error: e.message } };
    }
}

/**
 * TABULAR_STREAM: Proyecta una colección de átomos como un flujo de datos.
 */
function _system_handleTabularStream(uqo) {
    if (uqo.provider === 'sheets') {
        logInfo(`[system_logic] Enrutando TABULAR_STREAM hacia el proveedor de Sheets.`);
        return _sheets_handleTabularStream(uqo);
    }

    const contextId = uqo.context_id;
    const result = _system_handleRead(uqo);

    // DETERMINISMO RADICAL: Intentamos recuperar la estructura real del átomo
    let dynamicFields = [
        { id: 'id', alias: 'id', label: 'ID', type: 'TEXT' },
        { id: 'label', alias: 'label', label: 'Label', type: 'TEXT' }
    ];
    let schemaLabel = 'System Stream';

    try {
        if (contextId) {
            const file = _system_findAtomFile(contextId);
            const atom = JSON.parse(file.getBlob().getDataAsString());
            
            // Si el átomo es un esquema, heredamos su ADN (payload.fields)
            if (atom.class === 'DATA_SCHEMA' && atom.payload?.fields) {
                dynamicFields = atom.payload.fields;
                schemaLabel = atom.handle?.label || schemaLabel;
            }
        }
    } catch (e) {
        logWarn(`[tabular_stream] No se pudo heredar esquema para ${contextId}. Usando genérico.`);
    }

    const schema = {
        id: contextId || 'system_generic_stream',
        handle: { ns: 'com.indra.system.schema', alias: 'dynamic', label: schemaLabel },
        fields: dynamicFields
    };

    return {
        items: result.items || [],
        metadata: {
            ...result.metadata,
            schema: schema
        }
    };
}

/**
 * NATIVE_DOCUMENT_RENDER: Procesa un Documento Indra y genera un PDF en memoria.
 * context_id: ID del átomo DOCUMENT (plantilla).
 * data.variables: Mapa de variables para inyección {{key}}.
 * 
 * @private
 */
function _system_handleNativeDocumentRender(uqo) {
    const docId = uqo.context_id;
    if (!docId) {
        return { items: [], metadata: { status: 'ERROR', error: 'NATIVE_DOCUMENT_RENDER requiere context_id (Document ID).' } };
    }

    try {
        // 1. Cargar el Átomo del sistema (Soberanía Indra)
        const docFile = _system_findAtomFile(docId);
        const docAtom = JSON.parse(docFile.getBlob().getDataAsString());

        if (docAtom.class !== 'DOCUMENT') {
            return { items: [], metadata: { status: 'ERROR', error: 'El átomo no es de clase DOCUMENT.' } };
        }

        // 2. Ejecutar el motor de renderizado nativo
        const variables = (uqo.data && uqo.data.variables) || {};
        const pdfBlob = NativeDocumentEngine.renderToPdf(docAtom, variables);

        // 3. Retornar el Blob en Base64 para transporte agnóstico por el Workflow Engine
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const fileName = pdfBlob.getName();
        const mimeType = pdfBlob.getContentType();

        return {
            items: [{
                id: 'generated_pdf_blob',
                handle: { 
                  ns: 'com.indra.system.pdf', 
                  alias: _system_slugify_(fileName.replace('.pdf', '')), 
                  label: fileName 
                },
                class: 'DATA',
                mime_type: mimeType,
                file_name: fileName,
                file_base64: base64,
                payload: {
                    source_doc_id: docId,
                    size: pdfBlob.getSize()
                }
            }],
            metadata: { 
                status: 'OK', 
                file_name: fileName,
                mime_type: mimeType
            }
        };

    } catch (e) {
        logError(`[system_logic] Error en render documento ${docId}:`, e);
        return { items: [], metadata: { status: 'ERROR', error: e.message } };
    }
}
