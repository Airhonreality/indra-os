/**
 * =============================================================================
 * OPFSManager (Origin Private File System)
 * RESPONSABILIDAD: Gestionar el almacenamiento local de activos pesados (videos)
 * Garantiza lecturas rápidas sin red (Byte-level read access)
 * =============================================================================
 */

export class OPFSManager {
    constructor() {
        this.rootDirectory = null;
    }

    /**
     * Inicializa el acceso al OPFS.
     */
    async init() {
        if (!navigator.storage || !navigator.storage.getDirectory) {
            console.error("OPFSManager: El navegador no soporta Origin Private File System.");
            return false;
        }

        try {
            this.rootDirectory = await navigator.storage.getDirectory();
            console.log("[OPFSManager] OPFS inicializada correctamente.");
            return true;
        } catch (e) {
            console.error("[OPFSManager] Error al acceder a OPFS", e);
            return false;
        }
    }

    /**
     * Verifica si un archivo `vaultId` ya existe en la caché OPFS.
     */
    async isCached(vaultId) {
        if (!this.rootDirectory) return false;
        try {
            await this.rootDirectory.getFileHandle(`${vaultId}.mp4`, { create: false });
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Guarda un Blob o ArrayBuffer desde el Vault a la OPFS.
     */
    async cacheVaultFile(vaultId, fileBlob) {
        if (!this.rootDirectory) await this.init();
        console.log(`[OPFSManager] Cacheando archivo ${vaultId} en OPFS...`);

        try {
            const fileHandle = await this.rootDirectory.getFileHandle(`${vaultId}.mp4`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(fileBlob);
            await writable.close();
            console.log(`[OPFSManager] Archivo ${vaultId} cacheado exitosamente.`);
            return true;
        } catch (e) {
            console.error(`[OPFSManager] Fallo al cachear ${vaultId}`, e);
            return false;
        }
    }

    /**
     * Devuelve el handle del archivo para ser usado por un Worker (para SyncAccessHandle)
     */
    async getFileHandle(vaultId) {
        if (!this.rootDirectory) await this.init();
        try {
            return await this.rootDirectory.getFileHandle(`${vaultId}.mp4`, { create: false });
        } catch (e) {
            console.error(`[OPFSManager] Archivo ${vaultId} no encontrado en caché.`);
            return null;
        }
    }
}
