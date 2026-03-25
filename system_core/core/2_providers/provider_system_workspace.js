/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_workspace.gs
 * RESPONSABILIDAD: El "Alambrado" de contextos activos (PINS).
 * AXIOMA: GESTIÓN DE REFERENCIAS INTERNAS.
 * =============================================================================
 */

/**
 * SYSTEM_PIN: Ancla un átomo al workspace activo.
 * @private
 */
function _system_handlePin(uqo) {
    const workspaceId = uqo.workspace_id;
    const atom = uqo.data && uqo.data.atom;

    if (!workspaceId) throw createError('INVALID_INPUT', 'SYSTEM_PIN requiere workspace_id.');
    if (!atom || !atom.id || !atom.class || !atom.handle) {
        throw createError('INVALID_INPUT', 'SYSTEM_PIN requiere data.atom completo.');
    }

    try {
        const file = _system_findAtomFile(workspaceId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        const pins = Array.isArray(doc.pins) ? doc.pins : [];

        const pinPointer = {
            id: atom.id,
            handle: atom.handle,
            class: atom.class,
            provider: atom.provider,
            protocols: atom.protocols || [],
            pinned_at: new Date().toISOString(),
        };

        const existingIdx = pins.findIndex(p => p.id === atom.id && p.provider === atom.provider);
        if (existingIdx >= 0) pins[existingIdx] = pinPointer;
        else pins.push(pinPointer);

        doc.pins = pins;
        doc.updated_at = new Date().toISOString();
        file.setContent(JSON.stringify(doc, null, 2));

        const responsePayload = atom.payload || {};
        if (atom.class === 'DATA_SCHEMA' && !Array.isArray(responsePayload.fields)) {
            responsePayload.fields = [];
        }

        return { items: [{ ...pinPointer, payload: responsePayload }], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
    }
}

/**
 * SYSTEM_UNPIN: Desancla un átomo del workspace activo.
 */
function _system_handleUnpin(uqo) {
    const workspaceId = uqo.workspace_id;
    const data = uqo.data || {};
    if (!workspaceId || !data.atom_id || !data.provider) throw createError('INVALID_INPUT', 'Faltan parámetros en UNPIN.');

    try {
        const file = _system_findAtomFile(workspaceId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        doc.pins = (doc.pins || []).filter(p => {
          const isMatchId = p.id === data.atom_id;
          const isMatchProvider = p.provider === data.provider || 
                                  p.provider.startsWith(data.provider + ':') ||
                                  data.provider.startsWith(p.provider + ':');
                                  
          return !(isMatchId && isMatchProvider);
        });
        doc.updated_at = new Date().toISOString();
        file.setContent(JSON.stringify(doc, null, 2));
        return { items: [], metadata: { status: 'OK' } };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

function _system_handlePinsRead(uqo) {
    const workspaceId = uqo.workspace_id;
    if (!workspaceId) throw createError('INVALID_INPUT', 'PINS_READ requiere workspace_id.');

    try {
        const file = _system_findAtomFile(workspaceId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        const pins = Array.isArray(doc.pins) ? doc.pins : [];

        let needsWorkspaceSync = false;

        // ─── PORTAL DE SINCERIDAD: Homeostasis de Identidad ─────────
        const sincerePins = pins.map(pin => {
            try {
                // Sincronización Proactiva: Le preguntamos a Drive por la identidad física
                // El ID de Drive es inmutable, el nombre NO.
                const atomFile = DriveApp.getFileById(pin.id);
                
                if (atomFile.isTrashed()) return { ...pin, _orphan: true };

                // El nombre del archivo en Drive es el "Handle Externo".
                // Las extensiones .json se limpian.
                const physicalLabel = atomFile.getName().replace(/\.json$/i, '').replace(/_/g, ' ');

                // ── AXIOMA DE SINCERIDAD TOTAL ──
                // Si es un DATA_SCHEMA, entregamos la materia completa (campos)
                // para evitar fallbacks de hidratación perezosa en el frontend.
                let enhancedPin = { ...pin };
                if (pin.class === 'DATA_SCHEMA') {
                    try {
                        const content = JSON.parse(atomFile.getBlob().getDataAsString());
                        enhancedPin.payload = content.payload || {};
                        if (!Array.isArray(enhancedPin.payload.fields)) {
                             enhancedPin.payload.fields = [];
                        }
                    } catch (e) {
                        logWarn(`[infrastructure] Error parseando payload de Schema ${pin.id}`, e);
                        enhancedPin.payload = { fields: [] }; // Fallback de emergencia
                    }
                }

                // Si el label del Pin es distinto al físico, hay una asincronía (Entropía)
                if (pin.handle?.label !== physicalLabel) {
                    needsWorkspaceSync = true;
                    return { 
                        ...enhancedPin, 
                        handle: { ...pin.handle, label: physicalLabel },
                        _reconciled: true,
                        _orphan: false
                    };
                }

                return { ...enhancedPin, _orphan: false };

            } catch (e) {
                // Si el archivo no existe, es un huérfano real
                return { ...pin, _orphan: true };
            }
        });

        // Axioma de Curación: Si detectamos desincronía, re-escribimos el Workspace
        if (needsWorkspaceSync) {
            // Limpiamos flags efímeros y el 'payload' para mantener el Workspace súper ligero.
            doc.pins = sincerePins.map(({ _orphan, _reconciled, payload, ...p }) => p); 
            file.setContent(JSON.stringify(doc, null, 2));
            logInfo(`[homeostasis] Workspace ${workspaceId} curado automáticamente. Punteros sincronizados.`);
        }

        return {
            items: sincerePins,
            metadata: {
                status: 'OK',
                count: sincerePins.length,
                bridges: doc.bridges || [],
                reconciled: needsWorkspaceSync
            }
        };
    } catch (err) {
        logError(`[infrastructure] Fallo en PINS_READ: ${workspaceId}`, err);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }
}

/**
 * Sincroniza identidades referenciadas.
 */
function _system_propagateNameChange(atomId, newName, providerId) {
    try {
        const wsFolder = _system_getOrCreateSubfolder_(WORKSPACES_FOLDER_NAME_);
        const files = wsFolder.getFiles();
        while (files.hasNext()) {
            const file = files.next();
            if (file.getMimeType() !== 'application/json') continue;
            try {
                const content = JSON.parse(file.getBlob().getDataAsString());
                let changed = false;
                (content.pins || []).forEach(pin => {
                    if (pin.id === atomId && (pin.provider === providerId || pin.provider.startsWith(providerId + ':'))) {
                        if (pin.handle) pin.handle.label = newName;
                        pin.name = newName; // Legacy
                        changed = true;
                    }
                });
                if (changed) file.setContent(JSON.stringify(content, null, 2));
            } catch (e) { }
        }
    } catch (err) { logError('[workspace] Fallo en propagación.', err); }
}

/**
 * Sincroniza alias referenciados en los pins.
 */
function _system_propagateAliasChange(atomId, newAlias, providerId) {
    try {
        const wsFolder = _system_getOrCreateSubfolder_(WORKSPACES_FOLDER_NAME_);
        const files = wsFolder.getFiles();
        while (files.hasNext()) {
            const file = files.next();
            if (file.getMimeType() !== 'application/json') continue;
            try {
                const content = JSON.parse(file.getBlob().getDataAsString());
                let changed = false;
                (content.pins || []).forEach(pin => {
                    if (pin.id === atomId && (pin.provider === providerId || pin.provider.startsWith(providerId + ':'))) {
                        if (pin.handle) pin.handle.alias = newAlias;
                        changed = true;
                    }
                });
                if (changed) file.setContent(JSON.stringify(content, null, 2));
            } catch (e) { }
        }
    } catch (err) { logError('[workspace] Fallo en propagación de alias.', err); }
}
