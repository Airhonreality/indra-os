// =============================================================================
// ARTEFACTO: 5_diagnostics/integrity_check.gs
// CAPA: 5 — Diagnostics (Mantenimiento)
// RESPONSABILIDAD: El "Detective de Materia". Identifica archivos corruptos
//         o vacíos y permite su restauración desde backups.
// =============================================================================

/**
 * Escanea el sistema en busca de archivos JSON corruptos (0 bytes o JSON inválido).
 * Cubre schemas, workspaces y workflows.
 */
function runIntegrityCheck() {
    logInfo('🕵️ Iniciando Chequeo de Integridad de Materia...');

    const report = {
        scanned: 0,
        corrupt: [],
        zombies: [], // Archivos de 0 bytes
        summary: { total: 0, errors: 0 }
    };

    const rootId = readRootFolderId();
    if (!rootId) throw new Error('RootId no encontrado.');
    const root = DriveApp.getFolderById(rootId);

    const checkFolder = (folder) => {
        const files = folder.getFiles();
        while (files.hasNext()) {
            const file = files.next();
            if (!file.getName().endsWith('.json')) continue;

            report.scanned++;
            const size = file.getSize();

            if (size === 0) {
                report.zombies.push({ id: file.getId(), name: file.getName(), folder: folder.getName() });
                report.summary.errors++;
                continue;
            }

            try {
                JSON.parse(file.getBlob().getDataAsString());
            } catch (e) {
                report.corrupt.push({ id: file.getId(), name: file.getName(), folder: folder.getName(), error: e.message });
                report.summary.errors++;
            }
        }

        const subfolders = folder.getFolders();
        while (subfolders.hasNext()) {
            const sub = subfolders.next();
            if (sub.getName() === '.system_archive') continue;
            checkFolder(sub);
        }
    };

    checkFolder(root);
    report.summary.total = report.scanned;

    logInfo(`[integrity] Chequeo completado. Escaneados: ${report.scanned} | Errores: ${report.summary.errors}`);
    return report;
}

/**
 * Intenta restaurar un archivo específico desde el backup más reciente en .system_archive.
 * @param {string} targetFileId - El ID del archivo real que queremos restaurar.
 */
function restoreFromBackup(targetFileId) {
    logInfo(`[recovery] Iniciando protocolo de restauración para: ${targetFileId}`);

    const rootId = readRootFolderId();
    const root = DriveApp.getFolderById(rootId);
    const archiveFolders = root.getFoldersByName('.system_archive');

    if (!archiveFolders.hasNext()) {
        throw new Error('No se encontró la carpeta .system_archive.');
    }

    const archive = archiveFolders.next();
    const backups = archive.getFiles();
    let bestBackup = null;
    let newestDate = 0;

    // Patrón: backup_{fileId}_{timestamp}.json
    const pattern = new RegExp(`backup_${targetFileId}_(\\d+)\\.json`);

    while (backups.hasNext()) {
        const file = backups.next();
        const match = file.getName().match(pattern);
        if (match) {
            const ts = parseInt(match[1]);
            if (ts > newestDate) {
                newestDate = ts;
                bestBackup = file;
            }
        }
    }

    if (!bestBackup) {
        throw new Error(`No se encontró ningún backup para el archivo ${targetFileId} en el archivo histórico.`);
    }

    logInfo(`[recovery] Backup encontrado: ${bestBackup.getName()}. Restaurando...`);

    const content = bestBackup.getBlob().getDataAsString();
    const targetFile = DriveApp.getFileById(targetFileId);
    targetFile.setContent(content);

    logInfo(`[recovery] Sincronización de emergencia completada para ${targetFile.getName()}.`);
    return { status: 'OK', restored: targetFile.getName(), timestamp: new Date(newestDate).toISOString() };
}
