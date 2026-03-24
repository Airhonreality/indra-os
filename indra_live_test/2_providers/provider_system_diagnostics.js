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

        // ─── PORTAL DE SINCERIDAD ───────────────────────────────────────────
        const pinIds = pins.map(p => p.id);
        const existenceMap = _system_batchVerifyExistence_(pinIds);

        const validPins = pins.filter(pin => existenceMap[pin.id]);
        const removedCount = pins.length - validPins.length;

        if (removedCount > 0) {
            doc.pins = validPins;
            doc.updated_at = new Date().toISOString();
            file.setContent(JSON.stringify(doc, null, 2));
            logInfo(`[diagnostics] Workspace ${workspaceId} saneado: ${removedCount} pins removidos.`);
        }

        return {
            items: validPins,
            metadata: {
                status: 'OK',
                message: removedCount > 0 ? `Saneamiento: ${removedCount} huérfanos purgados.` : 'Estado íntegro.',
                purged_count: removedCount
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
