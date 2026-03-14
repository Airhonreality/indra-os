// =============================================================================
// ARTEFACTO: 5_diagnostics/identity_evolution.gs
// CAPA: 5 — Diagnostic Layer (Sincronización)
// RESPONSABILIDAD: El "Cirujano de Identidad 5.0". 
//         Evoluciona átomos legados a la especificación ADR-008.
// 
// INDRA SAFETY PROTOCOL (ISP):
//   1. Shadow Vault (Copia de seguridad previa)
//   2. Mutation in Limbo (Transformación en RAM)
//   3. Customs Verification (Validación real via Router)
//   4. Atomic Writing (Solo si la Aduana aprueba)
// =============================================================================

/**
 * Orquestador de la Evolución Sistémica (v5.1 - Intelligent Mode).
 */
function runSystemIdentityEvolution() {
    logInfo('🚀 Iniciando INDRA IDENTITY EVOLUTION (Intelligent ISP v5.1)...');

    const report = {
        scanned: 0,
        sincere: 0,
        evolved: 0,
        failures: 0,
        backups: [],
        idMap: {} // { oldId: newId } para sincronización de referencias
    };

    try {
        const rootId = readRootFolderId();
        if (!rootId) throw new Error('No se encontró el rootId del sistema.');

        // Fase 1: Discovery (Identificar y Evolucionar Materia)
        const root = DriveApp.getFolderById(rootId);
        _evolveFolderRecursive_(root, report);

        // Fase 2: Linkage (Sincronizar Referencias / Pins)
        if (Object.keys(report.idMap).length > 0) {
            _syncWorkflowReferences_(root, report);
        }

        logInfo(`[evolution] Evolución Completada. Scanned: ${report.scanned} | Evolved: ${report.evolved} | Sincere: ${report.sincere}`);
        return report;

    } catch (err) {
        logError('[evolution] Fallo crítico en motor de evolución', err);
        throw err;
    }
}

/**
 * Procesa una carpeta buscando átomos que evolucionar.
 * @private
 */
function _evolveFolderRecursive_(folder, report) {
    const folderName = folder.getName();
    const files = folder.getFiles();

    while (files.hasNext()) {
        const file = files.next();
        if (file.getMimeType() === MimeType.PLAIN_TEXT || file.getName().endsWith('.json')) {
            report.scanned++;
            _processAtomEvolution_(file, folderName, report);
        }
    }

    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
        _evolveFolderRecursive_(subfolders.next(), report);
    }
}

/**
 * Proceso quirúrgico inteligente.
 * @private
 */
function _processAtomEvolution_(file, folderName, report) {
    const fileId = file.getId();
    let rawContent;
    let atom;

    try {
        rawContent = file.getBlob().getDataAsString();
        atom = JSON.parse(rawContent);
    } catch (err) {
        logWarn(`[evolution] ARCHIVO_CORRUPTO: "${file.getName()}" (${fileId}) no es JSON válido.`);
        report.failures++;
        return;
    }

    // --- Fase 2: Evaluation (Sincere Read) ---
    let isSincere = true;
    try {
        _validateAtomContract_([atom], 'system', 'DIAGNOSTIC_READ');

        // Verificamos si el ID interno coincide con el real (Sinceridad de Infraestructura)
        if (atom.id !== fileId) {
            logInfo(`[evolution] ID_DISCREPANCY en ${file.getName()}: ${atom.id} != ${fileId}`);
            isSincere = false;
        }
    } catch (contractError) {
        logInfo(`[evolution] MATERIA_OSCURA en ${file.getName()}: ${contractError.message}`);
        isSincere = false;
    }

    if (isSincere) {
        report.sincere++;
        return;
    }

    // --- Fase 0: Shadow Vault (Pre-backup) ---
    const backupId = _createShadowBackup_(fileId, atom);
    report.backups.push(backupId);

    // Mapear cambio de ID para fase de Linkage
    if (atom.id && atom.id !== fileId) {
        report.idMap[atom.id] = fileId;
    }

    // --- Fase 3: Mutation in Limbo (Intelligent Projection) ---
    const evolvedAtom = _projectToSincerityIntelligent_(atom, fileId, file.getName(), folderName);

    // --- Fase 4: Sincerity Verification ---
    try {
        _validateAtomContract_([evolvedAtom], 'system', 'VERIFY_EVOLUTION');

        // --- Fase 6: Atomic Writing ---
        file.setContent(JSON.stringify(evolvedAtom, null, 2));
        report.evolved++;
        logInfo(`[evolution] ATOMO_SINCERADO: "${file.getName()}" (${evolvedAtom.class}) actualizado.`);

    } catch (verifyError) {
        logError(`[evolution] FALLO_EVOLUCION: "${file.getName()}" irreparable.`, verifyError);
        report.failures++;
    }
}

/**
 * Evoluciona un átomo basándose en el contexto del sistema de archivos.
 * @private
 */
function _projectToSincerityIntelligent_(legacy, fileId, fileName, folderName) {
    const evolved = { ...legacy };
    const extramatter = legacy.extramatter || {};

    // 1. Inferencia por Paisaje (Deducir clase por carpeta)
    const folderToClass = {
        'workspaces': 'WORKSPACE',
        'schemas': 'DATA_SCHEMA',
        'workflows': 'WORKFLOW',
        'formulas': 'FORMULA',
        'documents': 'DOCUMENT'
    };

    // Si la clase no coincide con la carpeta, la carpeta manda (Sinceridad Física)
    const inferredClass = folderToClass[folderName] || legacy.class || 'ITEM';
    evolved.class = inferredClass.toUpperCase();
    evolved.id = fileId; // ID soberano de Drive

    // 2. Reconstrucción Semántica de Identidad
    const label = legacy.handle?.label || legacy.name || legacy.label || fileName.replace('.json', '');
    const alias = legacy.handle?.alias || legacy.alias || _system_slugify_(label);
    const ns = legacy.handle?.ns || `com.indra.system.${evolved.class.toLowerCase()}`;

    evolved.handle = { ns, alias, label };

    // 3. Evolución de Payload para Schemas
    if (evolved.class === 'DATA_SCHEMA') {
        _evolveSchemaPayload_(evolved, legacy);
    }

    // 4. Limpieza Axiomática (Movimiento a extramatter)
    const knownKeys = ['id', 'class', 'handle', 'payload', 'provider', 'protocols', 'extramatter', 'created_at', 'updated_at', 'pins', 'bridges'];
    Object.keys(legacy).forEach(key => {
        if (!knownKeys.includes(key) && !key.startsWith('_')) {
            extramatter[key] = legacy[key];
            delete evolved[key];
        }
    });

    if (Object.keys(extramatter).length > 0) {
        evolved.extramatter = extramatter;
    }

    return evolved;
}

/**
 * Sincroniza las referencias cruzadas (Pins en Workspaces).
 * @private
 */
function _syncWorkflowReferences_(root, report) {
    logInfo(`[linkage] Iniciando sincronización de referencias (${Object.keys(report.idMap).length} cambios)...`);

    // Buscamos la carpeta de workspaces
    const wsFolders = root.getFoldersByName('workspaces');
    if (!wsFolders.hasNext()) return;

    const wsFolder = wsFolders.next();
    const files = wsFolder.getFiles();

    while (files.hasNext()) {
        const file = files.next();
        let content;
        try {
            content = JSON.parse(file.getBlob().getDataAsString());
        } catch (e) { continue; }

        let changed = false;
        if (content.pins && Array.isArray(content.pins)) {
            content.pins = content.pins.map(pin => {
                if (report.idMap[pin.id]) {
                    logInfo(`[linkage] Actualizando PIN en "${file.getName()}": ${pin.id} -> ${report.idMap[pin.id]}`);
                    pin.id = report.idMap[pin.id];
                    changed = true;
                }
                return pin;
            });
        }

        if (changed) {
            file.setContent(JSON.stringify(content, null, 2));
        }
    }
}

/**
 * Específicamente evoluciona la estructura interna de los campos de un esquema.
 * @private
 */
function _evolveSchemaPayload_(evolved, legacy) {
    evolved.payload = evolved.payload || {};
    let rawFields = legacy.payload?.fields || legacy.fields || legacy.raw?.fields || [];

    const repairFieldsRecursive = (fields) => {
        if (!Array.isArray(fields)) return [];
        return fields.map(f => {
            const label = f.label || f.name || 'UNTITLED_FIELD';
            const id = f.id || f.key || `field_${Math.random().toString(36).substr(2, 9)}`;
            const alias = f.alias || _system_slugify_(label) || id;

            const newField = { ...f, id, alias, label };
            if (newField.name) delete newField.name;
            if (newField.key) delete newField.key;

            if (newField.children) newField.children = repairFieldsRecursive(newField.children);
            return newField;
        });
    };

    evolved.payload.fields = repairFieldsRecursive(rawFields);
    if (evolved.fields) delete evolved.fields;
}

/**
 * Obtiene o crea la carpeta .system_archive
 * @private
 */
function _getOrCreateArchiveFolder_() {
    const rootId = readRootFolderId();
    const root = DriveApp.getFolderById(rootId);
    const folders = root.getFoldersByName('.system_archive');

    if (folders.hasNext()) return folders.next();

    const archive = root.createFolder('.system_archive');
    // Opcional: oculatación (en GAS no hay hidden pero la convención del punto ayuda)
    return archive;
}

/**
 * Función global para invocar desde el dashboard.
 */
function DIAGNOSTIC_EVOLVE_SYSTEM() {
    return runSystemIdentityEvolution();
}
