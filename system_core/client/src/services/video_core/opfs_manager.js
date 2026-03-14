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
     * Guarda el Mapa de Identidad (JSON) en la OPFS.
     */
    async cacheIdentityMap(vaultId, identityMap) {
        if (!this.rootDirectory) await this.init();
        console.log(`[OPFSManager] Cacheando Mapa de Identidad para ${vaultId}...`);

        try {
            const fileHandle = await this.rootDirectory.getFileHandle(`${vaultId}_identity.json`, { create: true });
            const writable = await fileHandle.createWritable();
            const blob = new Blob([JSON.stringify(identityMap)], { type: 'application/json' });
            await writable.write(blob);
            await writable.close();
            console.log(`[OPFSManager] Mapa de Identidad de ${vaultId} cacheado exitosamente.`);
            return true;
        } catch (e) {
            console.error(`[OPFSManager] Fallo al cachear Mapa de Identidad de ${vaultId}`, e);
            return false;
        }
    }

    /**
     * Recupera el Mapa de Identidad (JSON) de la OPFS.
     */
    async getIdentityMap(vaultId) {
        if (!this.rootDirectory) await this.init();
        try {
            const fileHandle = await this.rootDirectory.getFileHandle(`${vaultId}_identity.json`, { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (e) {
            console.error(`[OPFSManager] Mapa de Identidad de ${vaultId} no encontrado.`);
            return null;
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

    /**
     * Lista todos los archivos del Vault guardados en OPFS.
     */
    async listVault() {
        if (!this.rootDirectory) await this.init();
        const files = [];
        for await (const entry of this.rootDirectory.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.mp4')) {
                files.push({
                    name: entry.name,
                    id: entry.name.replace('.mp4', ''),
                    kind: 'video'
                });
            }
        }
        return files;
    }
    /**
     * Elimina un archivo y su mapa de identidad de la OPFS.
     */
    async removeFile(vaultId) {
        if (!this.rootDirectory) await this.init();
        try {
            await this.rootDirectory.removeEntry(`${vaultId}.mp4`);
            try {
                await this.rootDirectory.removeEntry(`${vaultId}_identity.json`);
            } catch (e) {
                // El mapa de identidad podría no existir, no es crítico
            }
            console.log(`[OPFSManager] Archivo ${vaultId} eliminado de OPFS.`);
            return true;
        } catch (e) {
            console.error(`[OPFSManager] Fallo al eliminar ${vaultId}`, e);
            return false;
        }
    }
}
