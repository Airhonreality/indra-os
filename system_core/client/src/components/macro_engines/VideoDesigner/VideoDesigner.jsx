import React from 'react';
import { useVideoEngine } from './hooks/useVideoEngine';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAssetIngestor } from './hooks/useAssetIngestor';
import { useWorkspace } from '../../../context/WorkspaceContext';

// NEW MODULAR COMPONENTS
import { EngineHood } from './components/EngineHood';
import { StreamHood } from './components/StreamHood';
import { TimelineHood } from './components/TimelineHood';
import { InspectorSidebar } from './components/InspectorSidebar';
import { KineticTimeline } from './components/KineticTimeline';
import { RealityStreamer } from './components/RealityStreamer';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { executeDirective } from '../../../services/directive_executor';
import { useAppState } from '../../../state/app_state';

import './VideoDesigner.css';

/**
 * =============================================================================
 * MACRO ENGINE: VideoDesigner (ASSEMBLER)
 * RESPONSABILIDAD: Orquestación de módulos especializados (Dharma).
 * Sigue el canon de industrialización de Indra y estética DAW.
 * =============================================================================
 */

export function VideoDesigner({ atom, bridge }) {
    const { updatePinIdentity } = useWorkspace();
    const { coreUrl, sessionSecret } = useAppState();
    const {
        currentTime,
        isPlaying,
        isReady,
        duration,
        project,
        actions
    } = useVideoEngine(atom?.payload);

    const [localLabel, setLocalLabel] = React.useState(atom?.handle?.label || 'UNTITLED_VIDEO');
    const [isSaving, setIsSaving] = React.useState(false);
    const [selectedClip, setSelectedClip] = React.useState(null);
    const [vaultFiles, setVaultFiles] = React.useState([]);
    const [showSilo, setShowSilo] = React.useState(false);
    // SOBERANÍA LOCAL: Estado del previsualizador de caché
    const [previewAsset, setPreviewAsset] = React.useState(null); // { vaultId, identity }

    // --- EFFECT: Indexing Vault ---
    const fetchVault = React.useCallback(async () => {
        const opfs = actions.getOpfsManager();
        if (opfs) {
            const files = await opfs.listVault();
            setVaultFiles(files);
        }
    }, [actions]);

    React.useEffect(() => {
        fetchVault();
        const interval = setInterval(fetchVault, 5000); // Poll cada 5s
        return () => clearInterval(interval);
    }, [fetchVault]);

    // --- EVENT LISTENERS FOR MODULAR COMMUNICATION ---
    // ORDEN CORRECTO: handleDropAsset debe declararse ANTES de los refs que lo apuntan
    // (Ley de la Zona Muerta Temporal en JavaScript)
    const handleDropAsset = React.useCallback(async (laneId, vaultId, timeMs) => {
        const opfs = actions.getOpfsManager();
        if (!opfs) return;

        const identity = await opfs.getIdentityMap(vaultId);
        const durationMs = identity?.duration_ms || 5000;

        actions.mutateProject(ast => {
            if (!ast.timeline) ast.timeline = { lanes: [] };
            // Si no hay lanes, crear lane_1 automáticamente
            if (ast.timeline.lanes.length === 0) {
                ast.timeline.lanes.push({ id: 'lane_1', clips: [], activeDimension: 'visual' });
            }
            // Buscar la lane pedida. Si no existe, usar la primera disponible
            let lane = ast.timeline.lanes.find(l => l.id === laneId);
            if (!lane) lane = ast.timeline.lanes[0];
            if (lane) {
                lane.clips.push({
                    id: `clip_${vaultId}_${Date.now()}`,
                    vault_id: vaultId,
                    start_at_ms: timeMs,
                    duration_ms: durationMs,
                    offset_ms: 0,
                    automation: { opacity: [{ timeMs: 0, value: 1.0, easing: 'linear' }] }
                });
            }
            return ast;
        });
    }, [actions]);

    // FIX: Usamos refs para capturar los valores más recientes sin recrear el effect
    const currentTimeRef = React.useRef(currentTime);
    React.useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
    const handleDropAssetRef = React.useRef(handleDropAsset);
    React.useEffect(() => { handleDropAssetRef.current = handleDropAsset; }, [handleDropAsset]);

    React.useEffect(() => {
        const handleOpenSilo = () => setShowSilo(true);
        // FIX DE RAÍZ: Leer currentTime y handleDropAsset desde refs para evitar stale closure
        const handleAddAsset = (e) => {
            const { vaultId } = e.detail;
            handleDropAssetRef.current('lane_1', vaultId, currentTimeRef.current);
        };
        // NUEVO: Preview soberano desde OPFS
        const handlePreviewAsset = async (e) => {
            const { vaultId } = e.detail;
            const opfs = actions.getOpfsManager();
            const identity = opfs ? await opfs.getIdentityMap(vaultId) : null;
            setPreviewAsset({ vaultId, identity });
        };
        const handleDeleteAsset = async (e) => {
            const { vaultId } = e.detail;
            const opfs = actions.getOpfsManager();
            if (opfs) {
                // SOBERANÍA TOTAL: Confirmar antes de destruir
                const confirmLocal = window.confirm(`¿DESTRUIR ACTIVO LOCAL: ${vaultId}? Esta acción es irreversible en la OPFS.`);
                if (!confirmLocal) return;

                await opfs.removeFile(vaultId);
                fetchVault();
                
                // ¿Soberanía en la nube?
                if (vaultId.startsWith('silo_')) {
                    const parts = vaultId.split('_');
                    const remoteProvider = parts[1];
                    const remoteId = parts.slice(2).join('_');

                    const confirmRemote = window.confirm(`HEMOS ELIMINADO EL CACHÉ. ¿Deseas purgar también el archivo original del SILO (${remoteProvider.toUpperCase()})?`);
                    if (confirmRemote) {
                        try {
                            console.log(`[VideoDesigner] Purga remota en curso: ${remoteId}`);
                            await executeDirective({
                                provider: remoteProvider,
                                protocol: 'ATOM_DELETE',
                                context_id: remoteId
                            }, coreUrl, sessionSecret);
                            alert("Soberanía ejercida: Activo eliminado del Silo.");
                        } catch (err) {
                            console.error("[VideoDesigner] Error en purga remota:", err);
                        }
                    }
                }
            }
        };

        window.addEventListener('open-silo-selector', handleOpenSilo);
        window.addEventListener('add-vault-asset', handleAddAsset);
        window.addEventListener('preview-vault-asset', handlePreviewAsset);
        window.addEventListener('delete-vault-asset', handleDeleteAsset);
        return () => {
            window.removeEventListener('open-silo-selector', handleOpenSilo);
            window.removeEventListener('add-vault-asset', handleAddAsset);
            window.removeEventListener('preview-vault-asset', handlePreviewAsset);
            window.removeEventListener('delete-vault-asset', handleDeleteAsset);
        };
    }, [fetchVault, actions, coreUrl, sessionSecret]); // currentTime removido: se lee por ref

    const [currentTool, setCurrentTool] = React.useState('select');
    const [snapEnabled, setSnapEnabled] = React.useState(true);
    const [isExporting, setIsExporting] = React.useState(false);

    const { ingestLocalFile } = useAssetIngestor(actions, currentTime);
    const fileInputRef = React.useRef(null);

    // --- IMPORT FROM SILO ---
    const handleSiloSelect = async (artifact) => {
        setShowSilo(false);
        setIsSaving(true); // Reusamos el spinner de guardado para la ingesta
        try {
            console.log("[VideoDesigner] Importando desde Silo:", artifact);
            // 1. Leer el átomo del Silo (Drive) para obtener el Blob/Data
            const result = await executeDirective({
                provider: artifact.provider,
                protocol: 'ATOM_READ',
                id: artifact.id
            }, coreUrl, sessionSecret);

            if (result && result.payload) {
                // 2. Convertir payload a Blob si no lo es (Depende del provider)
                let blob = result.payload;
                if (!(blob instanceof Blob)) {
                    // Si el provider devolvió base64 o similar
                    console.warn("[VideoDesigner] Payload no es Blob, intentando conversión...");
                }

                // 3. Crear un objeto File simulado para el ingestor
                const file = new File([blob], artifact.handle?.label || 'silo_asset.mp4', { type: 'video/mp4' });
                
                // 4. Ingestar y transcodificar localmente con metadatos de Silo para Soberanía
                const newClip = await ingestLocalFile(file, {
                    remoteId: artifact.id,
                    remoteProvider: artifact.provider
                });

                if (newClip) {
                    actions.mutateProject(ast => {
                        if (!ast.timeline) ast.timeline = { lanes: [] };
                        if (ast.timeline.lanes.length === 0) {
                            ast.timeline.lanes.push({ id: 'lane_1', clips: [], activeDimension: 'visual' });
                        }
                        const firstLane = ast.timeline.lanes[0];
                        firstLane.clips.push(newClip);
                        return ast;
                    });
                    setSelectedClip(newClip);
                    fetchVault();
                }
            }
        } catch (err) {
            console.error("[VideoDesigner] Error importing from Silo:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // --- ACCIONES DE PERSISTENCIA ---
    const handleManualSave = async (overrideLabel = null) => {
        if (!project) return;
        setIsSaving(true);
        try {
            const labelToSave = overrideLabel !== null ? overrideLabel : localLabel;
            const sincereAtom = {
                ...atom,
                payload: project,
                handle: { ...atom.handle, label: labelToSave }
            };
            await bridge.save(sincereAtom);
        } catch (err) {
            console.error('[VideoDesigner] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTitleChange = (newLabel) => {
        const cleanLabel = newLabel === '' ? 'UNTITLED_VIDEO' : newLabel;
        setLocalLabel(cleanLabel);
        updatePinIdentity(atom.id, atom.provider, { label: cleanLabel });
        handleManualSave(cleanLabel);
    };

    // --- ACCIONES DE LÍNEA DE TIEMPO ---
    const handleClipMove = (clip, deltaMs) => {
        actions.mutateProject(project => {
            const currentClip = project.timeline.lanes.flatMap(l => l.clips).find(c => c.id === clip.id);
            if (currentClip) {
                currentClip.start_at_ms = Math.max(0, currentClip.start_at_ms + deltaMs);
            }
            return project;
        });
    }

    const handleClipSplit = (clipId, splitTimeMs) => {
        actions.mutateProject(ast => {
            let targetClip = null;
            let targetTrack = null;
            
            for (const lane of ast.timeline.lanes) {
                targetClip = lane.clips.find(c => c.id === clipId);
                if (targetClip) {
                    targetTrack = lane;
                    break;
                }
            }

            if (targetClip && targetTrack) {
                const relativeSplitPoint = splitTimeMs - targetClip.start_at_ms;
                
                if (relativeSplitPoint > 0 && relativeSplitPoint < targetClip.duration_ms) {
                    const segmentB = JSON.parse(JSON.stringify(targetClip));
                    segmentB.id = `${targetClip.id}_part2_${Date.now()}`;
                    segmentB.start_at_ms = splitTimeMs;
                    segmentB.duration_ms = targetClip.duration_ms - relativeSplitPoint;
                    segmentB.offset_ms = (targetClip.offset_ms || 0) + relativeSplitPoint;

                    targetClip.duration_ms = relativeSplitPoint;
                    targetTrack.clips.push(segmentB);
                }
            }
            return ast;
        });
    }

    const handleClipTrim = (clip, type, deltaMs) => {
        actions.mutateProject((ast) => {
             const lane = ast.timeline.lanes.find(l => l.clips.some(c => c.id === clip.id));
             const c = lane?.clips.find(c => c.id === clip.id);
             if (c) {
                 if (type === 'left') {
                     const oldStart = c.start_at_ms;
                     const newStart = Math.max(0, oldStart + deltaMs);
                     const actualDelta = newStart - oldStart;
                     c.start_at_ms = newStart;
                     c.duration_ms = Math.max(100, c.duration_ms - actualDelta);
                     c.offset_ms = (c.offset_ms || 0) + actualDelta;
                 } else {
                     c.duration_ms = Math.max(100, c.duration_ms + deltaMs);
                 }
             }
             return ast;
        }, false);
    };

    const handleRemoveClip = (clipId) => {
        actions.mutateProject(ast => {
            ast.timeline.lanes.forEach(lane => {
                lane.clips = lane.clips.filter(c => c.id !== clipId);
            });
            return ast;
        });
        if (selectedClip?.id === clipId) setSelectedClip(null);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await actions.exportVideo();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `INDRA_EXPORT_${Date.now()}.mp4`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export falló", e);
        } finally {
            setIsExporting(false);
        }
    };


    const handleFileSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const newClip = await ingestLocalFile(file);
        if (newClip) {
            actions.mutateProject((ast) => {
                if (!ast.timeline) ast.timeline = { lanes: [] };
                if (ast.timeline.lanes.length === 0) {
                    ast.timeline.lanes.push({ id: 'lane_1', clips: [], activeDimension: 'visual' });
                }
                const firstLane = ast.timeline.lanes[0];
                const lastClip = firstLane.clips[firstLane.clips.length - 1];
                newClip.start_at_ms = lastClip ? (lastClip.start_at_ms + lastClip.duration_ms) : 0;
                firstLane.clips.push(newClip);
                return ast;
            });
            setSelectedClip(newClip);
        }
    };

    if (!isReady) {
        return (
            <div className="fill center stack text-hint font-mono">
                <div className="mini-spinner" style={{ animation: 'indra-spin 1s linear infinite', border: '2px solid var(--color-accent)', width: 24, height: 24, borderTopColor: 'transparent', borderRadius: '50%' }} />
                <br />
                <span>INDRA_VIDEO_CORE_INIT...</span>
            </div>
        );
    }
     const accentColor = atom?.color || '#0096ff';
    const dynamicStyles = {
        '--indra-dynamic-accent': accentColor,
        '--indra-dynamic-border': `${accentColor}26`, // 15% opacity
        '--indra-dynamic-bg': `${accentColor}08`,     // 3% opacity
        backgroundColor: 'var(--color-bg-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--indra-ui-gap)'
    };

    return (
        <div className="macro-designer fill" style={dynamicStyles}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="video/mp4,video/webm" onChange={handleFileSelected} />

            {showSilo && (
                <ArtifactSelector 
                    title="SILO_VIDEO_SELECTOR"
                    onCancel={() => setShowSilo(false)}
                    onSelect={handleSiloSelect}
                />
            )}

            {/* 0. INDRA MACRO HEADER (Canónico) */}
            <IndraMacroHeader
                atom={{ ...atom, handle: { ...atom.handle, label: localLabel } }}
                onClose={() => bridge?.close?.()}
                isLive={atom?.raw?.status === 'LIVE'}
                onTitleChange={handleTitleChange}
                isSaving={isSaving}
            />

            {/* 1. TOP HOOD: ENGINE FUNCTIONS */}
            <div className="indra-container">
                <div className="indra-header-label">ENGINE_CONTROL_SYSTEM</div>
                <EngineHood 
                    project={project} 
                    onSave={handleManualSave} 
                    onExport={handleExport}
                    isSaving={isSaving}
                    atom={atom}
                />
            </div>

            {/* 2. MIDDLE BODY: STREAM + INSPECTOR */}
            <div className="designer-body fill overflow-hidden">
                {/* LEFT: CANONICAL STREAMER (RealityStreamer) */}
                <div className="indra-container stack fill overflow-hidden" style={{ flex: 7 }}>
                    <RealityStreamer 
                        engineActions={actions}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        duration={duration}
                        project={project}
                        previewAsset={previewAsset}
                        onClosePreview={() => setPreviewAsset(null)}
                        onAddToTimeline={() => {
                            handleDropAsset('lane_1', previewAsset.vaultId, currentTime);
                            setPreviewAsset(null);
                        }}
                    />
                </div>

                {/* RIGHT: AUXILIARY PANEL (INSPECTOR / VAULT) */}
                <div className="indra-container auxiliary-panel-section bg-deep overflow-hidden stack" style={{ flex: 3 }}>
                    <div className="indra-header-label">AUXILIARY_REALITY_PANEL</div>
                    <InspectorSidebar 
                        selectedClip={selectedClip} 
                        vaultFiles={vaultFiles}
                        project={project}
                        activeDimension={project?.timeline?.lanes?.find(l => l.clips.some(c => c.id === selectedClip?.id))?.activeDimension || 'visual'}
                        onUpdateClip={(clipId, updates) => actions.mutateProject(ast => {
                            ast.timeline.lanes.forEach(l => {
                                const c = l.clips.find(clip => clip.id === clipId);
                                if (c) Object.assign(c, updates);
                            });
                            return ast;
                        })}
                        onRemoveClip={handleRemoveClip}
                        mutateProject={actions.mutateProject}
                        onUploadLocal={handleUploadClick}
                    />
                </div>
            </div>

            {/* 3. TIMELINE TOOLS HOOD */}
            <div className="indra-container px-2 py-1 shelf--tight">
                <div className="indra-header-label">TIMELINE_TRADUCTOR_TOOLS</div>
                <TimelineHood 
                    currentTool={currentTool}
                    onSelectTool={setCurrentTool}
                    onSnapToggle={() => setSnapEnabled(!snapEnabled)}
                    snapEnabled={snapEnabled}
                    onAddTrack={() => handleUploadClick()}
                />
            </div>

            {/* 4. TIMELINE PISTAS */}
            <div className="indra-container timeline-section relative overflow-hidden stack" style={{ height: '350px', flexShrink: 0 }}>
                <div className="indra-header-label">TEMPORAL_FABRIC_ENCODER</div>
                <KineticTimeline 
                    project={project}
                    currentTimeMs={currentTime}
                    onSeek={actions.seek}
                    onStartDrag={handleClipMove}
                    onSplitClip={handleClipSplit}
                    currentTool={currentTool}
                    selectedClip={selectedClip}
                    onSelectClip={setSelectedClip}
                    onClipMove={handleClipMove}
                    onClipTrim={handleClipTrim}
                    onDropAsset={handleDropAsset}
                    snapEnabled={snapEnabled}
                    mutateProject={actions.mutateProject}
                    actions={actions}
                />
            </div>
        </div>
    );
}
