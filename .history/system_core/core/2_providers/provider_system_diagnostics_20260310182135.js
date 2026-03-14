/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_diagnostics.gs
 * RESPONSABILIDAD: Mantenimiento, Saneamiento y Auditoría del Núcleo.
 * AXIOMA: RECONOCIMIENTO Y REPARACIÓN DEL ESTADO.
 * =============================================================================
 */

/**
 * SYSTEM_WORKSPACE_REPAIR: El Cirujano de Workspaces.
 */
function _system_handleWorkspaceRepair(uqo) {
    const workspaceId = uqo.workspace_id;
    if (!workspaceId) return { items: [], metadata: { status: 'ERROR', error: 'Se requiere workspace_id.' } };

    try {
        const file = _system_findAtomFile(workspaceId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        const pins = Array.isArray(doc.pins) ? doc.pins : [];

        const validPins = [];
        const removedNames = [];

        pins.forEach(pin => {
            let exists = true;
            try {
                if (pin.provider === 'system' || pin.provider.startsWith('drive')) {
                    const atomFile = DriveApp.getFileById(pin.id);
                    if (atomFile.isTrashed()) exists = false;
                }
            } catch (e) { exists = false; }

            if (exists) validPins.push(pin);
            else removedNames.push(pin.handle?.label || pin.name || pin.id);
        });

        if (removedNames.length > 0) {
            doc.pins = validPins;
            doc.updated_at = new Date().toISOString();
            file.setContent(JSON.stringify(doc, null, 2));
        }

        return {
            items: validPins,
            metadata: {
                status: 'OK',
                message: removedNames.length > 0 ? `Saneamiento: ${removedNames.length} rotos eliminados.` : 'Íntegro.',
                removed_count: removedNames.length
            }
        };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

/**
 * SYSTEM_AUDIT: Ejecuta auditoría de resonancia.
 */
function _system_handleAudit(uqo) {
    // Supone que runResonanceAudit() existe globalmente.
    if (typeof runResonanceAudit === 'function') return runResonanceAudit();
    return { items: [], metadata: { status: 'ERROR', error: 'Módulo de auditoría no disponible.' } };
}
