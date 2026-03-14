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
 * Orquestador de la Evolución Sistémica.
 */
function runSystemIdentityEvolution() {
    logInfo('🚀 Iniciando INDRA IDENTITY EVOLUTION (ISP v5.0)...');

    const report = {
        scanned: 0,
        sincere: 0,
        evolved: 0,
        failures: 0,
        backups: []
    };

    try {
        const rootId = getSystemConfig('SYS_ROOT_FOLDER_ID');
        if (!rootId) throw new Error('No se encontró el rootId del sistema.');

        // Fase 1: Discovery (Censo de Átomos)
        const folder = DriveApp.getFolderById(rootId);
        _evolveFolderRecursive_(folder, report);

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
    const files = folder.getFiles();
    while (files.hasNext()) {
        const file = files.next();
        if (file.getMimeType() === MimeType.PLAIN_TEXT || file.getName().endsWith('.json')) {
            report.scanned++;
            _processAtomEvolution_(file, report);
        }
    }

    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
        _evolveFolderRecursive_(subfolders.next(), report);
    }
}

/**
 * Proceso quirúrgico de un átomo individual.
 * @private
 */
function _processAtomEvolution_(file, report) {
    const fileId = file.getId();
    let rawContent;
    let atom;

    try {
        rawContent = file.getContent();
        atom = JSON.parse(rawContent);
    } catch (err) {
        logWarn(`[evolution] ARCHIVO_CORRUPTO: "${file.getName()}" (${fileId}) no es JSON válido.`);
        report.failures++;
        return;
    }

    // --- Fase 2: Evaluation (Sincere Read) ---
    // Intentamos pasar el átomo por la Aduana real. 
    // Si la aduana falla, es Materia Oscura y debe evolucionar.
    let isSincere = false;
    try {
        // Usamos el validador interno del router para no disparar efectos secundarios de red
        _validateAtomContract_([atom], 'system', 'DIAGNOSTIC_READ');
        isSincere = true;
        report.sincere++;
    } catch (contractError) {
        logInfo(`[evolution] MATERIA_OSCURA en ${file.getName()}: ${contractError.message}`);
        isSincere = false;
    }

    if (isSincere) return;

    // --- Fase 0: Shadow Vault (Pre-backup) ---
    const backupId = _createShadowBackup_(fileId, atom);
    report.backups.push(backupId);

    // --- Fase 3: Mutation in Limbo (Transformación ADR-008) ---
    const evolvedAtom = _projectToSincerity_(atom, fileId, file.getName());

    // --- Fase 4: Sincerity Verification (Post-repair check) ---
    try {
        _validateAtomContract_([evolvedAtom], 'system', 'VERIFY_EVOLUTION');

        // --- Fase 6: Atomic Writing ---
        file.setContent(JSON.stringify(evolvedAtom, null, 2));
        report.evolved++;
        logInfo(`[evolution] ATOMO_SINCERADO: "${file.getName()}" actualizado con éxito.`);

    } catch (verifyError) {
        logError(`[evolution] FALLO_EVOLUCION: "${file.getName()}" sigue siendo inválido tras reparación. ABORTANDO ESCRITURA.`, verifyError);
        report.failures++;
    }
}

/**
 * Crea una copia de seguridad en la carpeta oculta de sistema.
 * @private
 */
function _createShadowBackup_(fileId, atom) {
    try {
        const archiveFolder = _getOrCreateArchiveFolder_();
        const backupName = `backup_${fileId}_${Date.now()}.json`;
        const backupFile = archiveFolder.createFile(backupName, JSON.stringify(atom, null, 2));
        return backupFile.getId();
    } catch (err) {
        logError(`[evolution] Fallo al crear backup para ${fileId}`, err);
        return null;
    }
}

/**
 * Proyecta un objeto legacy al estándar ADR-008.
 * @private
 */
function _projectToSincerity_(legacy, fileId, fileName) {
    const evolved = { ...legacy };
    const extramatter = legacy.extramatter || {};

    // 1. Forzar ID real (Inmutabilidad de Infraestructura)
    evolved.id = fileId;

    // 2. Inyectar Identidad (IUH v3.0) si falta
    if (!evolved.handle) {
        const label = legacy.name || legacy.label || fileName.replace('.json', '');
        const alias = legacy.alias || _system_slugify_(label);

        // Namespace inferido por clase
        const cls = (legacy.class || 'ITEM').toUpperCase();
        const ns = `com.indra.system.${cls.toLowerCase()}`;

        evolved.handle = { ns, alias, label };
    }

    // 3. ADR-008: Migración de payload.fields (Solo para DATA_SCHEMA)
    if (evolved.class === 'DATA_SCHEMA') {
        evolved.payload = evolved.payload || {};

        // Si fields está en la raíz, moverlo
        let rawFields = legacy.payload?.fields || legacy.fields || legacy.raw?.fields || [];

        const repairFieldsRecursive = (fields) => {
            if (!Array.isArray(fields)) return [];
            return fields.map(f => {
                // Sincronizar Identidad de Campo
                const label = f.label || f.name || 'UNTITLED_FIELD';
                const id = f.id || f.key || `field_${Math.random().toString(36).substr(2, 9)}`;
                const alias = f.alias || _system_slugify_(label) || id;

                const newField = { ...f, id, alias, label };

                // Limpieza de legacy keys
                if (newField.name) delete newField.name;
                if (newField.key) delete newField.key;

                if (newField.children) {
                    newField.children = repairFieldsRecursive(newField.children);
                }
                return newField;
            });
        };

        evolved.payload.fields = repairFieldsRecursive(rawFields);

        // Limpiar rastro legacy del átomo
        if (evolved.fields) delete evolved.fields;
    }

    // 4. Preservación de Materia (Desconocidos a extramatter)
    const knownKeys = ['id', 'class', 'handle', 'payload', 'provider', 'protocols', 'extramatter'];
    Object.keys(legacy).forEach(key => {
        if (!knownKeys.includes(key)) {
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
 * Obtiene o crea la carpeta .system_archive
 * @private
 */
function _getOrCreateArchiveFolder_() {
    const rootId = getSystemConfig('SYS_ROOT_FOLDER_ID');
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
