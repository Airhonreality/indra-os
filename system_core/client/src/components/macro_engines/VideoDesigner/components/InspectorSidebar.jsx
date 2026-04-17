import { IndraEngineHood } from '../../../utilities/IndraEngineHood';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../../utilities/IndraActionTrigger';

/**
 * Módulo: InspectorSidebar
 * Dharma: Inspección de atributos y gestión de recursos (Vault).
 */
export const InspectorSidebar = ({ selectedClip, project, onUpdateClip, onRemoveClip, vaultFiles, mutateProject, activeDimension, onUploadLocal }) => {
    const [activeTab, setActiveTab] = React.useState('PROPS');

    return (
        <div className="inspector-sidebar stack fill" style={{ 
            backgroundColor: 'transparent', 
            width: '300px'
        }}>
            {/* MICRO-HEADER */}
            <IndraEngineHood
                leftSlot={
                    <div className="shelf--tight px-2">
                        <span className="font-mono text-xs uppercase" style={{ color: 'var(--indra-dynamic-accent)', opacity: 0.6 }}>INSPECTOR // {activeTab}</span>
                    </div>
                }
            />

            {/* TAB NAV */}
            <div className="shelf--tight bg-void" style={{ gap: '1px' }}>
                <div 
                    className={`indra-tab fill center ${activeTab === 'PROPS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PROPS')}
                >
                    <span className="font-mono">PROPERTIES</span>
                </div>
                <div 
                    className={`indra-tab fill center ${activeTab === 'VAULT' ? 'active' : ''}`}
                    onClick={() => setActiveTab('VAULT')}
                >
                    <span className="font-mono">VAULT</span>
                </div>
            </div>

            {/* CONTENT */}
            <div className="fill stack p-2" style={{ overflowY: 'auto' }}>
                {activeTab === 'PROPS' ? (
                    selectedClip ? (
                        <div className="stack--tight">
                            <span className="font-mono mb-2" style={{ fontSize: '10px', color: 'var(--indra-dynamic-accent)' }}>CLIP: {selectedClip.id.slice(0, 8)}</span>
                            
                            <div className="stack--tight">
                                <label className="font-mono uppercase" style={{ fontSize: '9px', color: 'var(--indra-dynamic-accent)', opacity: 0.5 }}>{activeDimension} Attributes</label>
                                <div className="stack--tight">
                                    {activeDimension === 'visual' && (
                                        <>
                                            <div className="fill stack--tight p-2" style={{ backgroundColor: 'var(--indra-dynamic-bg)', border: '1px solid var(--indra-dynamic-border)', borderRadius: 'var(--indra-ui-radius)' }}>
                                                <span className="font-mono text-xs" style={{ color: 'var(--indra-dynamic-accent)', opacity: 0.4 }}>POS_START (MS)</span>
                                                <input 
                                                    className="font-mono text-sm bg-transparent border-none outline-none w-full" 
                                                    style={{ color: 'var(--indra-dynamic-accent)' }}
                                                    type="number"
                                                    value={selectedClip.start_at_ms || 0} 
                                                    onChange={(e) => onUpdateClip(selectedClip.id, { start_at_ms: parseInt(e.target.value) || 0 })} 
                                                />
                                            </div>
                                            <div className="fill stack--tight p-2 mt-1" style={{ backgroundColor: 'var(--indra-dynamic-bg)', border: '1px solid var(--indra-dynamic-border)', borderRadius: 'var(--indra-ui-radius)' }}>
                                                <span className="font-mono text-xs" style={{ color: 'var(--indra-dynamic-accent)', opacity: 0.4 }}>OPACITY</span>
                                                <div className="shelf--tight fill">
                                                    <input 
                                                        className="font-mono text-sm bg-transparent border-none outline-none fill" 
                                                        style={{ color: 'var(--indra-dynamic-accent)' }}
                                                        type="number" step="0.1" min="0" max="1"
                                                        value={selectedClip.automation?.opacity?.[0]?.value ?? 1.0}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.opacity) clip.automation.opacity = [{ timeMs: 0, value: 1.0, easing: 'linear' }];
                                                                    clip.automation.opacity[0].value = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    />
                                                    <select 
                                                        className="font-mono text-xs bg-black border-none outline-none text-accent"
                                                        style={{ background: 'transparent' }}
                                                        value={selectedClip.automation?.opacity?.[0]?.easing || 'linear'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.opacity) clip.automation.opacity = [{ timeMs: 0, value: 1.0, easing: 'linear' }];
                                                                    clip.automation.opacity[0].easing = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    >
                                                        <option value="linear">LIN</option>
                                                        <option value="step">STP</option>
                                                        <option value="bezier">BZR</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeDimension === 'sound' && (
                                        <>
                                            <div className="fill stack--tight p-2 mca-surface">
                                                <span className="font-mono text-xs opacity-40">VOLUME</span>
                                                <div className="shelf--tight fill">
                                                    <input 
                                                        className="font-mono text-sm bg-transparent border-none outline-none fill" 
                                                        type="number" step="0.05" min="0"
                                                        value={selectedClip.automation?.volume?.[0]?.value ?? 1.0}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.volume) clip.automation.volume = [{ timeMs: 0, value: 1.0, easing: 'linear' }];
                                                                    clip.automation.volume[0].value = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    />
                                                    <select 
                                                        className="font-mono text-xs bg-black border-none outline-none"
                                                        style={{ background: 'transparent', color: 'var(--indra-dynamic-accent)' }}
                                                        value={selectedClip.automation?.volume?.[0]?.easing || 'linear'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.volume) clip.automation.volume = [{ timeMs: 0, value: 1.0, easing: 'linear' }];
                                                                    clip.automation.volume[0].easing = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    >
                                                        <option value="linear">LIN</option>
                                                        <option value="step">STP</option>
                                                        <option value="bezier">BZR</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="fill stack--tight p-2 mca-surface">
                                                <span className="font-mono text-xs opacity-40">PAN_L_R</span>
                                                <div className="shelf--tight fill">
                                                    <input 
                                                        className="font-mono text-sm bg-transparent border-none outline-none fill" 
                                                        type="number" step="0.1" min="-1" max="1"
                                                        value={selectedClip.automation?.pan?.[0]?.value ?? 0}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.pan) clip.automation.pan = [{ timeMs: 0, value: 0, easing: 'linear' }];
                                                                    clip.automation.pan[0].value = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    />
                                                    <select 
                                                        className="font-mono text-xs bg-black border-none outline-none text-accent"
                                                        style={{ background: 'transparent' }}
                                                        value={selectedClip.automation?.pan?.[0]?.easing || 'linear'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.pan) clip.automation.pan = [{ timeMs: 0, value: 0, easing: 'linear' }];
                                                                    clip.automation.pan[0].easing = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    >
                                                        <option value="linear">LIN</option>
                                                        <option value="step">STP</option>
                                                        <option value="bezier">BZR</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeDimension === 'time' && (
                                        <>
                                            <div className="fill stack--tight p-2 mca-surface">
                                                <span className="font-mono text-xs opacity-40">SPEED_REL</span>
                                                <div className="shelf--tight fill">
                                                    <input 
                                                        className="font-mono text-sm bg-transparent border-none outline-none fill" 
                                                        type="number" step="0.1"
                                                        value={selectedClip.automation?.speed?.[0]?.value ?? 1.0}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.speed) clip.automation.speed = [{ timeMs: 0, value: 1.0, easing: 'linear' }];
                                                                    clip.automation.speed[0].value = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    />
                                                    <select 
                                                        className="font-mono text-xs bg-black border-none outline-none text-accent"
                                                        style={{ background: 'transparent' }}
                                                        value={selectedClip.automation?.speed?.[0]?.easing || 'linear'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            mutateProject(ast => {
                                                                const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                                if (clip) {
                                                                    if (!clip.automation) clip.automation = {};
                                                                    if (!clip.automation.speed) clip.automation.speed = [{ timeMs: 0, value: 1.0, easing: 'linear' }];
                                                                    clip.automation.speed[0].easing = val;
                                                                }
                                                                return ast;
                                                            });
                                                        }}
                                                    >
                                                        <option value="linear">LIN</option>
                                                        <option value="step">STP</option>
                                                        <option value="bezier">BZR</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="fill stack--tight p-2 mca-surface">
                                                <span className="font-mono text-xs opacity-40">REVERSE_MODE</span>
                                                <button 
                                                    className={`btn btn--xs px-2 ${selectedClip.automation?.reverse?.[0]?.value ? 'btn--accent' : 'btn--ghost'}`}
                                                    onClick={() => {
                                                        const isRev = selectedClip.automation?.reverse?.[0]?.value;
                                                        mutateProject(ast => {
                                                            const clip = ast.timeline.lanes.flatMap(l => l.clips).find(c => c.id === selectedClip.id);
                                                            if (clip) {
                                                                if (!clip.automation) clip.automation = {};
                                                                clip.automation.reverse = [{ timeMs: 0, value: isRev ? 0 : 1, easing: 'step' }];
                                                            }
                                                            return ast;
                                                        });
                                                    }}
                                                >
                                                    <span className="font-mono" style={{ fontSize: '9px' }}>{selectedClip.automation?.reverse?.[0]?.value ? 'ACTIVE' : 'OFF'}</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="spacer" style={{ height: '20px' }} />
                            
                            <div className="mt-4" onClick={e => e.stopPropagation()}>
                                <IndraActionTrigger 
                                    variant="destructive"
                                    label="REMOVE_CLIP_DEFINITIVE"
                                    onClick={() => onRemoveClip(selectedClip.id)}
                                    size="10px"
                                    style={{ width: '100%', height: '32px' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="center fill opacity-30 font-mono text-xs uppercase">SELECT_A_CLIP_TO_INSPECT</div>
                    )
                ) : (
                    <div className="stack--tight">
                         <div className="shelf--between align-center mb-2">
                            <span className="font-mono text-hint" style={{ fontSize: '10px' }}>OPFS_ASSETS</span>
                            {/* ACCIONES DE IMPORTACIÓN: Local + Silo */}
                            <div className="shelf--tight">
                                <button 
                                    className="btn btn--ghost btn--xs shelf--tight align-center" 
                                    style={{ border: '1px solid var(--indra-dynamic-border)', padding: '2px 6px' }}
                                    title="Importar archivo de video local"
                                    onClick={onUploadLocal}
                                >
                                    <IndraIcon name="FILE" size="10px" />
                                    <span className="font-mono uppercase" style={{ fontSize: '9px' }}>LOCAL</span>
                                </button>
                                <button 
                                    className="btn btn--ghost btn--xs shelf--tight align-center" 
                                    style={{ border: '1px solid var(--indra-dynamic-border)', padding: '2px 6px' }}
                                    title="Importar desde Google Drive (Silo)"
                                    onClick={() => {
                                        const event = new CustomEvent('open-silo-selector');
                                        window.dispatchEvent(event);
                                    }}
                                >
                                    <IndraIcon name="DRIVE" size="10px" />
                                    <span className="font-mono uppercase" style={{ fontSize: '9px' }}>SILO</span>
                                </button>
                            </div>
                         </div>
                         
                         {vaultFiles?.length === 0 && (
                             <div className="center p-8 opacity-20 stack--tight">
                                 <IndraIcon name="FILE" size="24px" />
                                 <span className="font-mono text-xs">VAULT_EMPTY</span>
                             </div>
                         )}

                         {vaultFiles?.map(file => {
                             // LEY DE SINCERIDAD: Limpiar el ID local para mostrar el nombre humano
                             const humanName = file.name
                                .replace(/^silo_[a-z]+_/, '') // Quitar prefijo silo_provider_
                                .replace(/^local_\d+_/, '')   // Quitar prefijo local y timestamp
                                .replace(/\.mp4$/i, '')        // Quitar extensión
                                .replace(/[_-]/g, ' ')         // Cambiar guiones/barras por espacios
                                .toUpperCase();

                             const isSilo = file.name.startsWith('silo_');

                             return (
                                 <div 
                                     key={file.id} 
                                     draggable="true"
                                     onDragStart={(e) => e.dataTransfer.setData('text/plain', file.id)}
                                     onClick={() => {
                                        // CLIC SIMPLE = PREVISUALIZAR desde el caché OPFS (no añade al timeline)
                                        const event = new CustomEvent('preview-vault-asset', { detail: { vaultId: file.id } });
                                        window.dispatchEvent(event);
                                     }}
                                     className="mca-surface p-2 shelf--tight align-center cursor-pointer hover-bg-primary group"
                                     style={{ border: '1px solid transparent', borderRadius: 'var(--indra-ui-radius)' }}
                                 >
                                     <IndraIcon name={isSilo ? "DRIVE" : "FILE"} size="12px" style={{ 
                                         color: isSilo ? 'var(--color-accent)' : 'var(--indra-dynamic-accent)',
                                         flexShrink: 0
                                     }} />
                                     <div className="stack--tight fill overflow-hidden">
                                         <div className="shelf--tight align-center" style={{ gap: 4 }}>
                                             <span className="font-mono truncate" style={{ fontSize: '10px' }}>{humanName}</span>
                                             {isSilo && (
                                                 <span style={{ 
                                                     fontSize: '7px', fontFamily: 'var(--font-mono)', 
                                                     padding: '1px 3px', borderRadius: 2,
                                                     backgroundColor: 'rgba(0,200,255,0.15)', 
                                                     color: 'var(--color-accent)',
                                                     flexShrink: 0
                                                 }}>SILO</span>
                                             )}
                                         </div>
                                         <span className="font-mono opacity-20" style={{ fontSize: '7px' }}>{file.name}</span>
                                     </div>
                                     <div className="shelf--tight vault-item-actions" 
                                          style={{ opacity: 0, transition: 'opacity 0.15s' }}
                                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                          onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                     >
                                         <IndraIcon 
                                             name="PLUS" 
                                             size="10px" 
                                             className="cursor-pointer hover-text-primary" 
                                             title="Añadir al timeline"
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 const event = new CustomEvent('add-vault-asset', { detail: { vaultId: file.id } });
                                                 window.dispatchEvent(event);
                                             }}
                                         />
                                         <div onClick={e => e.stopPropagation()}>
                                             <IndraActionTrigger 
                                                 variant="destructive"
                                                 label="ELIMINAR"
                                                 onClick={() => {
                                                     const event = new CustomEvent('delete-vault-asset', { detail: { vaultId: file.id } });
                                                     window.dispatchEvent(event);
                                                 }}
                                                 size="10px"
                                             />
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}

                    </div>
                )}
            </div>
        </div>
    );
};
