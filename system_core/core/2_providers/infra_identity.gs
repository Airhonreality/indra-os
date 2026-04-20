/**
 * INDRA INFRASTRUCTURE SILO: infra_identity.gs
 * Generado automáticamente por Shredder v1.0
 */



/**
 * ATOM_ALIAS_RENAME: Renombrado canónico de handle.alias con propagación a pins.
 */
function _system_handleAliasRename(uqo) {
    const atomId = uqo.context_id;
    const data = uqo.data || {};
    const dryRun = !!data.dry_run;
    const traceId = _system_buildTraceId_('ATOM_ALIAS_RENAME', atomId);

    if (!atomId) throw createError('INVALID_INPUT', 'ATOM_ALIAS_RENAME requiere context_id.');
    if (!data.new_alias) throw createError('INVALID_INPUT', 'ATOM_ALIAS_RENAME requiere data.new_alias.');

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
        return { items: [], metadata: { status: 'CONFLICT', error: 'LOCK_TIMEOUT', trace_id: traceId } };
    }

    try {
        const file = _system_findAtomFile(atomId);
        const doc = JSON.parse(file.getBlob().getDataAsString());
        const currentAlias = String(doc.handle?.alias || _system_slugify_(doc.handle?.label || '')).toLowerCase();
        const nextAlias = String(_system_slugify_(data.new_alias || '')).toLowerCase();
        const nextLabel = data.new_label ? String(data.new_label).trim() : null;

        if (!nextAlias) {
            return { items: [], metadata: { status: 'ERROR', error: 'INVALID_ALIAS_EMPTY', trace_id: traceId } };
        }
        if (!_system_isValidAlias_(nextAlias)) {
            return { items: [], metadata: { status: 'ERROR', error: 'INVALID_ALIAS_FORMAT', trace_id: traceId } };
        }
        if (data.old_alias && String(data.old_alias).toLowerCase() !== currentAlias) {
            return { items: [], metadata: { status: 'ERROR', error: 'ALIAS_MISMATCH', current_alias: currentAlias, trace_id: traceId } };
        }
        // AXIOMA: Solo es un No-Op si NADA cambia (ni alias ni label).
        const aliasIsIdentical = nextAlias === currentAlias;
        const labelIsIdentical = !nextLabel || nextLabel === (doc.handle?.label || '');
        
        if (aliasIsIdentical && labelIsIdentical) {
            // Absolutamente nada que cambiar → NOOP en cualquier modo
            return {
                items: [_system_toAtom(doc, file.getId(), uqo.provider)],
                metadata: { status: 'NOOP', trace_id: traceId, old_alias: currentAlias, new_alias: nextAlias }
            };
        }
        
        if (aliasIsIdentical && !labelIsIdentical) {
            // CASO CLAVE: El alias no cambia (sin riesgo de colisión) pero el label SÍ cambió.
            // En dry_run: informamos que es seguro (NOOP de alias, pero con label pendiente).
            // En commit real: persistimos solo el nuevo label.
            if (dryRun) {
                return {
                    items: [_system_toAtom(doc, file.getId(), uqo.provider)],
                    metadata: { status: 'NOOP', trace_id: traceId, old_alias: currentAlias, new_alias: nextAlias, label_change_pending: true }
                };
            }
            // Commit: persistir el nuevo label directamente
            const labelUpdateRes = _system_updateAtom(atomId, {
                handle: { label: nextLabel }
            }, uqo.provider);
            if (nextLabel) _system_propagateNameChange(atomId, nextLabel, uqo.provider || 'system');
            return {
                items: labelUpdateRes.items || [],
                metadata: { status: 'OK', trace_id: traceId, old_alias: currentAlias, new_alias: nextAlias, label_updated: true }
            };
        }
        if (_system_aliasExistsInSystem_(nextAlias, atomId)) {
            return { items: [], metadata: { status: 'ERROR', error: 'ALIAS_COLLISION', new_alias: nextAlias, trace_id: traceId } };
        }

        const impact = _system_collectAtomAliasImpact_(atomId, uqo.provider);
        const collisions = _system_scanAliasCollisions_({
            target: 'ATOM_ALIAS',
            alias: nextAlias,
            atom_id: atomId
        });
        if (dryRun) {
            return {
                items: [_system_toAtom(doc, file.getId(), uqo.provider)],
                metadata: {
                    status: 'DRY_RUN',
                    trace_id: traceId,
                    old_alias: currentAlias,
                    new_alias: nextAlias,
                    impacted_pins: impact.impacted_pins,
                    impacted_workspaces: impact.impacted_workspaces,
                    collisions: collisions.collisions,
                    has_blockers: collisions.has_blockers
                }
            };
        }

        const updateRes = _system_updateAtom(atomId, {
            handle: {
                alias: nextAlias,
                ...(nextLabel ? { label: nextLabel } : {})
            }
        }, uqo.provider);

        if (updateRes.metadata?.status !== 'OK') {
            return { items: [], metadata: { status: 'ERROR', error: updateRes.metadata?.error || 'ATOM_UPDATE_FAILED', trace_id: traceId } };
        }

        _system_propagateAliasChange(atomId, nextAlias, uqo.provider || 'system');
        if (nextLabel) _system_propagateNameChange(atomId, nextLabel, uqo.provider || 'system');

        return {
            items: updateRes.items || [],
            metadata: {
                status: 'OK',
                trace_id: traceId,
                old_alias: currentAlias,
                new_alias: nextAlias,
                impacted_pins: impact.impacted_pins,
                impacted_workspaces: impact.impacted_workspaces
            }
        };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, trace_id: traceId } };
    } finally {
        lock.releaseLock();
    }
}



/**
 * SCHEMA_FIELD_ALIAS_RENAME: Renombra alias de campo y actualiza referencias tipadas.
 */
function _system_handleSchemaFieldAliasRename(uqo) {
    const schemaId = uqo.context_id;
    const data = uqo.data || {};
    const dryRun = !!data.dry_run;
    const traceId = _system_buildTraceId_('SCHEMA_FIELD_ALIAS_RENAME', schemaId);

    if (!schemaId) throw createError('INVALID_INPUT', 'SCHEMA_FIELD_ALIAS_RENAME requiere context_id.');
    if (!data.new_alias) throw createError('INVALID_INPUT', 'SCHEMA_FIELD_ALIAS_RENAME requiere data.new_alias.');

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
        return { items: [], metadata: { status: 'CONFLICT', error: 'LOCK_TIMEOUT', trace_id: traceId } };
    }

    try {
        const schemaFile = _system_findAtomFile(schemaId);
        const schemaDoc = JSON.parse(schemaFile.getBlob().getDataAsString());
        if (schemaDoc.class !== DATA_SCHEMA_CLASS_) {
            return { items: [], metadata: { status: 'ERROR', error: 'NOT_DATA_SCHEMA', trace_id: traceId } };
        }

        const fields = Array.isArray(schemaDoc.payload?.fields) ? schemaDoc.payload.fields : [];
        const target = _system_findSchemaFieldBySelector_(fields, data.field_id, data.old_alias);
        if (!target) {
            return { items: [], metadata: { status: 'ERROR', error: 'FIELD_NOT_FOUND', trace_id: traceId } };
        }

        const oldAlias = String(target.alias || '').toLowerCase();
        const nextAlias = String(_system_slugify_(data.new_alias || '')).toLowerCase();
        if (!nextAlias || !_system_isValidAlias_(nextAlias)) {
            return { items: [], metadata: { status: 'ERROR', error: 'INVALID_ALIAS_FORMAT', trace_id: traceId } };
        }
        if (oldAlias === nextAlias) {
            return {
                items: [_system_toAtom(schemaDoc, schemaFile.getId(), uqo.provider)],
                metadata: { status: 'NOOP', trace_id: traceId, old_alias: oldAlias, new_alias: nextAlias }
            };
        }
        if (_system_schemaHasFieldAlias_(fields, nextAlias, target.id)) {
            return { items: [], metadata: { status: 'ERROR', error: 'ALIAS_COLLISION', trace_id: traceId, new_alias: nextAlias } };
        }

        const impact = _system_collectFieldAliasImpact_(schemaId, oldAlias, nextAlias);
        const collisions = _system_scanAliasCollisions_({
            target: 'FIELD_ALIAS',
            alias: nextAlias,
            schema_id: schemaId,
            field_id: target.id
        });
        if (dryRun) {
            return {
                items: [_system_toAtom(schemaDoc, schemaFile.getId(), uqo.provider)],
                metadata: {
                    status: 'DRY_RUN',
                    trace_id: traceId,
                    schema_id: schemaId,
                    field_id: target.id,
                    old_alias: oldAlias,
                    new_alias: nextAlias,
                    impacts: impact,
                    collisions: collisions.collisions,
                    has_blockers: collisions.has_blockers
                }
            };
        }

        _system_renameFieldAliasInFields_(fields, target.id, oldAlias, nextAlias);
        const schemaUpdate = _system_updateAtom(schemaId, {
            payload: { ...(schemaDoc.payload || {}), fields: fields }
        }, uqo.provider);

        if (schemaUpdate.metadata?.status !== 'OK') {
            return { items: [], metadata: { status: 'ERROR', error: schemaUpdate.metadata?.error || 'SCHEMA_UPDATE_FAILED', trace_id: traceId } };
        }

        const cascade = _system_applyFieldAliasCascade_(schemaId, oldAlias, nextAlias);

        return {
            items: schemaUpdate.items || [],
            metadata: {
                status: 'OK',
                trace_id: traceId,
                schema_id: schemaId,
                field_id: target.id,
                old_alias: oldAlias,
                new_alias: nextAlias,
                impacts: impact,
                updated_artifacts: cascade.updated_artifacts,
                updated_refs: cascade.updated_refs
            }
        };
    } catch (err) {
        return { items: [], metadata: { status: 'ERROR', error: err.message, trace_id: traceId } };
    } finally {
        lock.releaseLock();
    }
}



/**
 * ALIAS_COLLISION_SCAN: Sensor canónico de colisiones de alias.
 */
function _system_handleAliasCollisionScan(uqo) {
    const data = uqo.data || {};
    const target = String(data.target || '').toUpperCase();
    const alias = String(_system_slugify_(data.alias || '')).toLowerCase();

    if (!target) throw createError('INVALID_INPUT', 'ALIAS_COLLISION_SCAN requiere data.target.');
    if (!alias) throw createError('INVALID_INPUT', 'ALIAS_COLLISION_SCAN requiere data.alias.');

    const scan = _system_scanAliasCollisions_({
        target: target,
        alias: alias,
        schema_id: uqo.context_id || data.schema_id,
        field_id: data.field_id,
        atom_id: data.atom_id
    });

    return {
        items: [],
        metadata: {
            status: 'OK',
            target: target,
            alias: alias,
            collisions: scan.collisions,
            has_blockers: scan.has_blockers
        }
    };
}



function _system_isValidAlias_(alias) {
    return /^[a-z0-9_\-]{2,120}$/.test(String(alias || '').toLowerCase());
}



function _system_aliasExistsInSystem_(alias, excludeAtomId) {
    const candidate = String(alias || '').toLowerCase();
    if (!candidate) return false;

    const files = _system_listAllAtomFiles_();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || file.getId() === excludeAtomId) continue;
        try {
            const doc = JSON.parse(file.getBlob().getDataAsString());
            const existing = String(doc.handle?.alias || '').toLowerCase();
            if (existing && existing === candidate) return true;
        } catch (e) {}
    }
    return false;
}



function _system_scanAliasCollisions_(input) {
    const target = String(input?.target || '').toUpperCase();
    const alias = String(input?.alias || '').toLowerCase();
    const schemaId = input?.schema_id || null;
    const fieldId = input?.field_id || null;
    const atomId = input?.atom_id || null;
    const collisions = [];

    if (!alias) return { collisions: [], has_blockers: false };

    if (target === 'ATOM_ALIAS') {
        const files = _system_listAllAtomFiles_();
        files.forEach(file => {
            if (!file) return;
            if (atomId && file.getId() === atomId) return;
            try {
                const doc = JSON.parse(file.getBlob().getDataAsString());
                const existingAlias = String(doc.handle?.alias || '').toLowerCase();
                if (existingAlias === alias) {
                    collisions.push({
                        severity: 'BLOCKER',
                        scope: 'SYSTEM',
                        target: 'ATOM_ALIAS',
                        atom_id: file.getId(),
                        atom_class: doc.class || 'UNKNOWN',
                        atom_alias: existingAlias,
                        atom_label: doc.handle?.label || ''
                    });
                }
            } catch (e) {}
        });
    }

    if (target === 'FIELD_ALIAS') {
        const files = _system_listAllAtomFiles_();
        files.forEach(file => {
            if (!file) return;
            try {
                const doc = JSON.parse(file.getBlob().getDataAsString());
                if (doc.class !== DATA_SCHEMA_CLASS_) return;
                const hits = _system_collectAliasFieldHits_(doc.payload?.fields || [], alias);
                if (!hits.length) return;

                const isCurrentSchema = schemaId && file.getId() === schemaId;
                hits.forEach(hit => {
                    if (isCurrentSchema && fieldId && hit.field_id === fieldId) return;
                    collisions.push({
                        severity: isCurrentSchema ? 'BLOCKER' : 'WARNING',
                        scope: isCurrentSchema ? 'INTRA_SCHEMA' : 'CROSS_SCHEMA',
                        target: 'FIELD_ALIAS',
                        schema_id: file.getId(),
                        schema_alias: String(doc.handle?.alias || '').toLowerCase(),
                        schema_label: doc.handle?.label || '',
                        field_id: hit.field_id,
                        field_label: hit.field_label,
                        field_alias: alias
                    });
                });
            } catch (e) {}
        });
    }

    const hasBlockers = collisions.some(c => c.severity === 'BLOCKER');
    return { collisions: collisions, has_blockers: hasBlockers };
}



function _system_collectAliasFieldHits_(fields, alias) {
    const hits = [];
    const target = String(alias || '').toLowerCase();
    const walk = (list) => {
        (list || []).forEach(field => {
            if (String(field.alias || '').toLowerCase() === target) {
                hits.push({
                    field_id: field.id,
                    field_label: field.label || ''
                });
            }
            if (Array.isArray(field.children)) walk(field.children);
        });
    };
    walk(Array.isArray(fields) ? fields : []);
    return hits;
}



function _system_collectAtomAliasImpact_(atomId, providerId) {
    const provider = providerId || 'system';
    let impactedPins = 0;
    let impactedWorkspaces = 0;
    const wsFolder = _system_getOrCreateSubfolder_(WORKSPACES_FOLDER_NAME_);
    const files = wsFolder.getFiles();

    while (files.hasNext()) {
        const file = files.next();
        if (file.getMimeType() !== 'application/json') continue;
        try {
            const doc = JSON.parse(file.getBlob().getDataAsString());
            const hits = (doc.pins || []).filter(pin => pin.id === atomId && (pin.provider === provider || pin.provider === 'system'));
            if (hits.length > 0) {
                impactedWorkspaces += 1;
                impactedPins += hits.length;
            }
        } catch (e) {}
    }

    return {
        impacted_pins: impactedPins,
        impacted_workspaces: impactedWorkspaces
    };
}



function _system_findSchemaFieldBySelector_(fields, fieldId, oldAlias) {
    let found = null;
    const aliasNorm = String(oldAlias || '').toLowerCase();
    const walk = (list) => {
        for (let i = 0; i < list.length; i++) {
            const field = list[i];
            if (fieldId && field.id === fieldId) {
                found = field;
                return;
            }
            if (!fieldId && aliasNorm && String(field.alias || '').toLowerCase() === aliasNorm) {
                found = field;
                return;
            }
            if (Array.isArray(field.children)) walk(field.children);
            if (found) return;
        }
    };
    walk(Array.isArray(fields) ? fields : []);
    return found;
}



function _system_schemaHasFieldAlias_(fields, alias, excludeFieldId) {
    const candidate = String(alias || '').toLowerCase();
    let exists = false;
    const walk = (list) => {
        for (let i = 0; i < list.length; i++) {
            const field = list[i];
            if (field.id !== excludeFieldId && String(field.alias || '').toLowerCase() === candidate) {
                exists = true;
                return;
            }
            if (Array.isArray(field.children)) walk(field.children);
            if (exists) return;
        }
    };
    walk(Array.isArray(fields) ? fields : []);
    return exists;
}



function _system_replaceAliasWord_(value, oldAlias, newAlias) {
    const source = String(value || '');
    const escaped = oldAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    return source.replace(regex, newAlias);
}



function _system_renameFieldAliasInFields_(fields, fieldId, oldAlias, newAlias) {
    const walk = (list) => {
        (list || []).forEach(field => {
            if (field.id === fieldId) field.alias = newAlias;
            if (typeof field.formula_expression === 'string') {
                field.formula_expression = _system_replaceAliasWord_(field.formula_expression, oldAlias, newAlias);
            }
            if (field.config && typeof field.config.show_if === 'string') {
                field.config.show_if = _system_replaceAliasWord_(field.config.show_if, oldAlias, newAlias);
            }
            if (Array.isArray(field.children)) walk(field.children);
        });
    };
    walk(Array.isArray(fields) ? fields : []);
}



function _system_collectFieldAliasImpact_(schemaId, oldAlias, newAlias) {
    const allAtoms = ledger_list_all_records(); // Nueva función proactiva
    let impactedArtifacts = 0;
    let impactedRefs = 0;

    allAtoms.forEach(atom => {
        if (!atom || atom.id === schemaId) return;
        if (!['DOCUMENT', 'BRIDGE', 'WORKFLOW'].includes(atom.class)) return;
        
        try {
            const probe = _system_rewriteFieldAliasReferencesInDoc_(atom, oldAlias, newAlias, true);
            if (probe.refs > 0) {
                impactedArtifacts += 1;
                impactedRefs += probe.refs;
            }
        } catch (e) {}
    });

    return {
        impacted_artifacts: impactedArtifacts,
        impacted_refs: impactedRefs
    };
}



function _system_applyFieldAliasCascade_(schemaId, oldAlias, newAlias) {
    const files = _system_listAllAtomFiles_();
    let updatedArtifacts = 0;
    let updatedRefs = 0;

    files.forEach(file => {
        if (!file || file.getId() === schemaId) return;
        try {
            const doc = JSON.parse(file.getBlob().getDataAsString());
            if (!['DOCUMENT', 'BRIDGE', 'WORKFLOW'].includes(doc.class)) return;

            const rewrite = _system_rewriteFieldAliasReferencesInDoc_(doc, oldAlias, newAlias, false);
            if (rewrite.changed) {
                doc.updated_at = new Date().toISOString();
                file.setContent(JSON.stringify(doc, null, 2));
                updatedArtifacts += 1;
                updatedRefs += rewrite.refs;
            }
        } catch (e) {
            logWarn(`[infra] Cascada alias parcial fallida en ${file.getId()}: ${e.message}`);
        }
    });

    return { updated_artifacts: updatedArtifacts, updated_refs: updatedRefs };
}



function _system_rewriteFieldAliasReferencesInDoc_(doc, oldAlias, newAlias, dryRun) {
    let refs = 0;
    const sourceTokenOld = `source.${oldAlias}`;
    const sourceTokenNew = `source.${newAlias}`;
    const mustEqualKeys = {
        content_alias: true,
        source_alias: true,
        field_alias: true,
        relation_label_field: true
    };
    const expressionKeys = {
        formula_expression: true,
        show_if: true
    };

    const visit = (node, parentKey) => {
        if (node === null || node === undefined) return node;

        if (Array.isArray(node)) {
            return node.map(item => visit(item, parentKey));
        }

        if (typeof node === 'object') {
            const result = dryRun ? node : node;
            Object.keys(node).forEach(key => {
                const current = node[key];
                if (parentKey === 'handle' && key === 'alias') return;

                if (typeof current === 'string') {
                    let next = current;

                    if (mustEqualKeys[key] && current === oldAlias) {
                        next = newAlias;
                    } else if (current === sourceTokenOld) {
                        next = sourceTokenNew;
                    } else if (expressionKeys[key]) {
                        next = _system_replaceAliasWord_(current, oldAlias, newAlias);
                    }

                    const slotPattern = `{{${oldAlias}}}`;
                    if (next.indexOf(slotPattern) !== -1) {
                        next = next.split(slotPattern).join(`{{${newAlias}}}`);
                    }

                    if (next !== current) {
                        refs += 1;
                        if (!dryRun) result[key] = next;
                    }
                } else {
                    const child = visit(current, key);
                    if (!dryRun) result[key] = child;
                }
            });
            return result;
        }

        return node;
    };

    if (!dryRun) visit(doc, null);
    else visit(JSON.parse(JSON.stringify(doc)), null);
    return { changed: refs > 0, refs: refs };
}



function _system_normalizeSchemaFieldAliases_(fields) {
    const usedAliases = new Set();

    const collect = (list) => {
        (list || []).forEach(field => {
            const existing = String(field?.alias || '').trim().toLowerCase();
            if (existing) usedAliases.add(existing);
            if (Array.isArray(field?.children)) collect(field.children);
        });
    };

    const ensure = (list, pathPrefix = 'field') => {
        (list || []).forEach((field, index) => {
            const current = String(field?.alias || '').trim().toLowerCase();
            if (!current) {
                const rawBase = field?.id || field?.label || `${pathPrefix}_${index + 1}`;
                const base = String(_system_slugify_(rawBase || '')).toLowerCase() || `${pathPrefix}_${index + 1}`;
                let nextAlias = base;
                let seq = 2;
                while (usedAliases.has(nextAlias)) {
                    nextAlias = `${base}_${seq}`;
                    seq += 1;
                }
                field.alias = nextAlias;
                usedAliases.add(nextAlias);
            }

            if (Array.isArray(field?.children)) {
                ensure(field.children, `${pathPrefix}_${index + 1}`);
            }
        });
    };

    collect(fields || []);
    ensure(fields || []);
}

