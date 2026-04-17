import { IndraIcon } from '../../../utilities/IndraIcons';
import { AutomationOverlay } from './AutomationOverlay';

/**
 * Módulo: TimelineTrack
 * Dharma: Gestión de pista individual y sus capas paramétricas.
 */
export const TimelineTrack = ({ mode = 'STAGE', track, pixelsPerSecond, onStartDrag, onClipClick, isSelected, onDropAsset, mutateProject, actions, activeParam: propActiveParam }) => {
    const activeDimension = track.activeDimension || 'visual';
    const [localActiveParam, setLocalActiveParam] = React.useState(activeDimension === 'sound' ? 'volume' : 'opacity');
    const activeParam = propActiveParam || localActiveParam;
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [waveforms, setWaveforms] = React.useState({}); 

    React.useEffect(() => {
        if (mode !== 'STAGE' || !actions) return;
        
        const loadWaveforms = async () => {
            const opfs = actions.getOpfsManager();
            if (!opfs) return;
            const newWaveforms = {};
            for (const clip of track.clips) {
                const identity = await opfs.getIdentityMap(clip.vault_id);
                if (identity?.audio?.peakMap) newWaveforms[clip.id] = identity.audio.peakMap;
            }
            setWaveforms(newWaveforms);
        };
        loadWaveforms();
    }, [track.clips, track.activeDimension, actions, mode]);

    const handleAutomationUpdate = (clipId, param, keyframes) => {
        mutateProject(ast => {
            const laneRef = ast.timeline.lanes.find(l => l.id === track.id);
            const clip = laneRef?.clips.find(c => c.id === clipId);
            if (clip) {
                if (!clip.automation) clip.automation = {};
                clip.automation[param] = keyframes;
            }
            return ast;
        });
    };

    const handleDimensionSwitch = (dim) => {
        mutateProject(ast => {
            const lane = ast.timeline.lanes.find(l => l.id === track.id);
            if (lane) {
                lane.activeDimension = dim;
                lane.activeParam = dim === 'sound' ? 'volume' : (dim === 'time' ? 'speed' : 'opacity');
            }
            return ast;
        });
        setLocalActiveParam(dim === 'sound' ? 'volume' : (dim === 'time' ? 'speed' : 'opacity'));
    };

    if (mode === 'HEADER') {
        return (
            <div className="track-header stack--tight p-1 fill h-full relative" style={{ backgroundColor: 'var(--color-bg-deep)' }}>
                <div className="shelf--tight justify-between align-center px-1">
                    <div className="shelf--tight">
                        {['visual', 'sound', 'time'].map(dim => (
                            <button 
                                key={dim}
                                className={`btn btn--xs font-mono px-1 ${activeDimension === dim ? 'btn--primary' : 'btn--ghost opacity-50'}`}
                                onClick={() => handleDimensionSwitch(dim)}
                                style={{ minWidth: '22px' }}
                            >
                                {dim[0].toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div style={{ width: '24px', height: '24px', border: '1px solid var(--indra-blue-border)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                         <span className="font-mono" style={{ fontSize: '8px' }}>FX</span>
                    </div>
                </div>

                {/* AUTOMATION STACK */}
                <div className="automation-stack fill mt-1 px-1 overflow-hidden" style={{ border: '1px solid rgba(0,150,255,0.05)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    {(activeDimension === 'visual' ? ['opacity', 'position_x', 'scale'] : 
                      activeDimension === 'sound' ? ['volume', 'pan'] : 
                      ['speed', 'reverse']).map(param => (
                        <div 
                            key={param} 
                            className={`shelf--tight align-center py-1 cursor-pointer transition-opacity ${activeParam === param ? 'opacity-100' : 'opacity-30 hover-opacity-60'}`}
                            onClick={() => {
                                mutateProject(ast => {
                                    const lane = ast.timeline.lanes.find(l => l.id === track.id);
                                    if (lane) lane.activeParam = param;
                                    return ast;
                                });
                                setLocalActiveParam(param);
                            }}
                        >
                            <div style={{ 
                                width: 4, height: 4, borderRadius: '50%', 
                                backgroundColor: activeParam === param ? 'var(--color-accent)' : 'white' 
                            }} />
                            <span className="font-mono text-xs uppercase" style={{ fontSize: '8px' }}>{param}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`track-stage fill h-full relative ${isDragOver ? 'bg-primary-soft' : ''}`} 
            style={{ backgroundColor: isDragOver ? 'rgba(0, 150, 255, 0.05)' : 'transparent' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                e.preventDefault(); setIsDragOver(false);
                const assetId = e.dataTransfer.getData('text/plain');
                const rect = e.currentTarget.getBoundingClientRect();
                const dropTimeMs = ((e.clientX - rect.left) / pixelsPerSecond) * 1000;
                onDropAsset(track.id, assetId, dropTimeMs);
            }}
        >
            {track.clips?.map(clip => (
                <div 
                    key={clip.id}
                    className={`clip-block absolute h-full ${isSelected === clip.id ? 'is-selected' : ''}`}
                    onClick={(e) => onClipClick(e, clip)}
                    onMouseDown={(e) => { e.stopPropagation(); onStartDrag(clip, 'move', e.clientX); }}
                    style={{
                        left: `${(clip.start_at_ms / 1000) * pixelsPerSecond}px`, 
                        width: `${(clip.duration_ms / 1000) * pixelsPerSecond}px`,
                        backgroundColor: activeDimension === 'visual' ? 'rgba(0, 150, 255, 0.2)' : 
                                         activeDimension === 'sound' ? 'rgba(0, 255, 100, 0.2)' : 
                                         'rgba(255, 150, 0, 0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    {/* TRIM HANDLES */}
                    <div className="trim-handle trim-handle--left" onMouseDown={(e) => { e.stopPropagation(); onStartDrag(clip, 'left', e.clientX); }} />
                    <div className="trim-handle trim-handle--right" onMouseDown={(e) => { e.stopPropagation(); onStartDrag(clip, 'right', e.clientX); }} />
                    
                    {/* WAVEFORM */}
                    {activeDimension === 'sound' && waveforms[clip.id] && (
                        <div className="waveform-container pointer-events-none absolute fill shelf--tight align-center opacity-30 px-1">
                            {waveforms[clip.id].map((peak, idx) => (
                                <div key={idx} className="bg-accent fill" style={{ height: `${Math.max(4, peak * 100)}%`, width: '1px' }} />
                            ))}
                        </div>
                    )}

                    <span className="font-mono p-1 block truncate relative z-10" style={{ fontSize: '7px', fontWeight: 'bold' }}>
                        {clip.vault_id}
                    </span>

                    <AutomationOverlay 
                        clip={clip} param={activeParam} pixelsPerSecond={pixelsPerSecond} 
                        onUpdateAutomation={(param, kfs) => handleAutomationUpdate(clip.id, param, kfs)}
                        color={activeDimension === 'visual' ? 'var(--color-primary)' : (activeDimension === 'sound' ? 'var(--color-accent)' : 'var(--color-warm)')}
                    />
                </div>
            ))}
        </div>
    );
};
