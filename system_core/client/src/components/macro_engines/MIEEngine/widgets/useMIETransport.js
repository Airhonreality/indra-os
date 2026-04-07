import { useState, useEffect } from 'react';
import JSZip from 'jszip';

/**
 * useMIETransport
 * RESPONSABILIDAD: Orquestar la exportación final (Destino) de los archivos transcodificados.
 * Puede ser Local FS, Descarga de ZIP, o Subida a un Silo Remoto.
 */
export const useMIETransport = (mieState) => {
    const [isTransporting, setIsTransporting] = useState(false);
    const [transportLog, setTransportLog] = useState("");
    
    // Configuración Local
    const [sourceHandle, setSourceHandle] = useState(null);
    const [destHandle, setDestHandle] = useState(null);
    const [sourceFileHandles, setSourceFileHandles] = useState(new Map());
    const [deleteSource, setDeleteSource] = useState(false);
    const [sortingRule, setSortingRule] = useState('NONE'); // NONE | DATE | TYPE

    // Configuración Remota
    const [remoteDestination, setRemoteDestination] = useState(null); // Artifact de Indra

    // Exportación automática o guiada cuando termina el processing global de MIE
    useEffect(() => {
        const canStartTransport = mieState.results.length > 0 && 
                                  !mieState.isProcessing && 
                                  !isTransporting &&
                                  mieState.jobs.length === mieState.results.length;

        if (canStartTransport) {
            if (destHandle) {
                executeAdvancedTransport();
            } else if (remoteDestination) {
                // TODO: executeRemoteTransport(); (Fase 2, subida por la API de Google/Silo)
            } else {
                // Si no hay handle nativo ni silo remoto, simplemente queda disponible para manual ZIP
                setTransportLog("Cosecha transcodificada. Lista para descarga manual (.ZIP).");
            }
        }
    }, [mieState.results, mieState.isProcessing, destHandle, remoteDestination]);

    /**
     * Resuelve en qué subcarpeta debe ir el archivo basado en el SortingRule.
     */
    const resolveSubFolder = async (rootHandle, job) => {
        if (sortingRule === 'NONE') return rootHandle;
        
        let subName = 'Otros';
        
        if (sortingRule === 'TYPE') {
            if (job.type === 'video') subName = 'Videos';
            else if (job.type === 'image') subName = 'Imágenes';
            else if (job.type === 'audio') subName = 'Audios';
        } else if (sortingRule === 'DATE') {
            // Usa LastModified si existe, sino fecha actual
            const fileDate = job.file?.lastModified ? new Date(job.file.lastModified) : new Date();
            subName = fileDate.toISOString().split('T')[0]; // YYYY-MM-DD
        }

        try {
            return await rootHandle.getDirectoryHandle(subName, { create: true });
        } catch (e) {
            console.error("Error creando subcarpeta", e);
            return rootHandle; // fallback
        }
    };

    /**
     * Transporte Físico Avanzado usando File System Access API
     */
    const executeAdvancedTransport = async () => {
        setIsTransporting(true);
        setTransportLog("Transporte atómico y enrutamiento iniciado...");
        
        let successCount = 0;
        
        try {
            for (const res of mieState.results) {
                const parentJob = mieState.jobs.find(j => j.id === res.original_meta?.id) || {};
                
                // Determinar si va a la raíz o a una subcarpeta basada en la regla
                const targetDirHandle = await resolveSubFolder(destHandle, parentJob);

                setTransportLog(`Escribiendo proxy: ${res.canonicalName}`);
                const fileHandle = await targetDirHandle.getFileHandle(res.canonicalName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(res.canonicalBlob);
                await writable.close();
                
                // Opcional: Eliminar original si el usuario lo forzó y teníamos el identificador físico
                if (deleteSource && sourceHandle) {
                    try {
                        const originalName = res.original_meta?.name;
                        if (originalName && sourceFileHandles.has(originalName)) {
                            await sourceHandle.removeEntry(originalName);
                        }
                    } catch (e) {
                        console.error("No se pudo purgar original", e);
                    }
                }
                
                successCount++;
            }
            
            setTransportLog(`¡Transporte Físico Exitoso! (${successCount} procesados).`);
            setTimeout(() => {
                mieState.clearQueue();
                setTransportLog("");
            }, 4000);
            
        } catch (e) {
            console.error(e);
            setTransportLog("Falla crítica en transporte: " + e.message);
        } finally {
            setIsTransporting(false);
        }
    };

    /**
     * Descarga ZIP Manual Fallback
     */
    const downloadAsZip = async () => {
        if (mieState.results.length === 0) return;
        setIsTransporting(true);
        setTransportLog("Empaquetando Materia en .ZIP...");
        
        try {
            const zip = new JSZip();
            mieState.results.forEach(res => {
                zip.file(res.canonicalName, res.canonicalBlob);
            });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `indra_mie_${new Date().getTime()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error("[MIE Local] Error al crear ZIP:", err);
            setTransportLog("Fallo al crear ZIP.");
        } finally {
            setIsTransporting(false);
            setTimeout(() => setTransportLog(""), 3000);
        }
    };

    return {
        // States Transport
        isTransporting,
        transportLog,
        setTransportLog,
        
        // Settings Local
        sourceHandle, setSourceHandle,
        destHandle, setDestHandle,
        sourceFileHandles, setSourceFileHandles,
        deleteSource, setDeleteSource,
        sortingRule, setSortingRule,
        
        // Settings Remote
        remoteDestination, setRemoteDestination,

        // Executions
        downloadAsZip
    };
};
