import React from 'react';
import { TimelineTrack } from './TimelineTrack';

/**
 * Módulo: KineticTimeline
 * Dharma: El motor de la cinta del tiempo. Orquesta las pistas y el cursor maestro.
 */
export const KineticTimeline = ({ project, currentTimeMs, onSeek, onStartDrag, currentTool, onSelectClip, selectedClip, onClipMove, onClipTrim, snapEnabled, mutateProject, actions, onSplitClip, onDropAsset }) => {
    const timelineRef = React.useRef(null);
    const PIXELS_PER_SECOND = 100;
    const [isDragging, setIsDragging] = React.useState(null);

    // Sincronización de la cinta con el tiempo (Hardware acceleration)
    React.useEffect(() => {
        if (timelineRef.current) {
            const offsetPx = (currentTimeMs / 1000) * PIXELS_PER_SECOND;
            timelineRef.current.style.transform = `translateX(-${offsetPx}px)`;
        }
    }, [currentTimeMs, PIXELS_PER_SECOND]);

    /**
     * LEY DE PRECISIÓN: Calcular punto de snap magnético.
     */
    const getSnapTime = (targetTimeMs, excludeClipId) => {
        if (!snapEnabled) return targetTimeMs;
        const SNAP_THRESHOLD_MS = 150; // Umbral de "conciencia" magnética
        let bestSnap = targetTimeMs;
        let minDelta = SNAP_THRESHOLD_MS;

        const snapPoints = [0, currentTimeMs]; // Playhead y origen

        project?.timeline?.lanes?.forEach(lane => {
            lane.clips?.forEach(clip => {
                if (clip.id === excludeClipId) return;
                snapPoints.push(clip.start_at_ms);
                snapPoints.push(clip.start_at_ms + clip.duration_ms);
            });
        });

        // Snap a segundos exactos
        const closestSecond = Math.round(targetTimeMs / 1000) * 1000;
        snapPoints.push(closestSecond);

        snapPoints.forEach(p => {
            const delta = Math.abs(targetTimeMs - p);
            if (delta < minDelta) {
                minDelta = delta;
                bestSnap = p;
            }
        });

        return bestSnap;
    };

    const handleTimelineClick = (e) => {
        if (currentTool === 'cut') return;
        const rect = timelineRef.current.parentElement.getBoundingClientRect();
        const x = e.clientX - rect.left - (rect.width * 0.2); // Relativo al playhead (20%)
        const deltaMs = (x / PIXELS_PER_SECOND) * 1000;
        onSeek(currentTimeMs + deltaMs);
    };

    const handleClipClick = (e, clip) => {
        if (currentTool === 'cut') {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const clickTimeMs = clip.start_at_ms + ((e.clientX - rect.left) / PIXELS_PER_SECOND) * 1000;
            onSplitClip(clip.id, clickTimeMs);
        } else {
            onSelectClip(clip);
        }
    };

    const handleMouseDown = (clip, type, startX) => {
        setIsDragging({ clip, type, startX, originalStart: clip.start_at_ms, originalDuration: clip.duration_ms });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - isDragging.startX;
        const rawDeltaMs = (deltaX / PIXELS_PER_SECOND) * 1000;

        if (isDragging.type === 'move') {
            const targetTime = isDragging.originalStart + rawDeltaMs;
            const snappedTime = getSnapTime(targetTime, isDragging.clip.id);
            onClipMove(isDragging.clip, snappedTime - isDragging.clip.start_at_ms);
        } else {
            // Trim logic
            if (isDragging.type === 'left') {
                const targetStart = isDragging.originalStart + rawDeltaMs;
                const snappedStart = getSnapTime(targetStart, isDragging.clip.id);
                onClipTrim(isDragging.clip, 'left', snappedStart - isDragging.clip.start_at_ms);
            } else {
                const targetEnd = isDragging.originalStart + isDragging.originalDuration + rawDeltaMs;
                const snappedEnd = getSnapTime(targetEnd, isDragging.clip.id);
                onClipTrim(isDragging.clip, 'right', snappedEnd - (isDragging.clip.start_at_ms + isDragging.clip.duration_ms));
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    return (
        <div className="kinetic-timeline shelf fill overflow-hidden" style={{ backgroundColor: 'var(--color-bg-deep)' }}>
            
            {/* FIXED SIDEBAR: TRACK HEADERS */}
            <div className="timeline-sidebar stack border-right" style={{ width: '200px', zIndex: 10, backgroundColor: 'var(--color-bg-deep)', borderColor: 'var(--indra-blue-border)' }}>
                {project?.timeline?.lanes?.map(lane => (
                    <div key={lane.id} className="track-header-wrapper" style={{ height: '80px', borderBottom: '1px solid var(--indra-blue-border)' }}>
                        <TimelineTrack 
                            track={lane} 
                            mode="HEADER"
                            activeParam={lane.activeParam || (lane.activeDimension === 'sound' ? 'volume' : 'opacity')}
                            mutateProject={mutateProject}
                        />
                    </div>
                ))}
                <div className="fill bg-void opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100% 40px' }} />
            </div>

            {/* SCROLLABLE CANVAS: TRACK STAGES */}
            <div 
                className="timeline-canvas-container relative fill overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleTimelineClick}
                style={{ cursor: currentTool === 'cut' ? 'crosshair' : 'default' }}
            >
                {/* PLAYHEAD FIXED AT 20% OF CONTAINER */}
                <div className="playhead" style={{
                    position: 'absolute',
                    left: '20%',
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: 'var(--color-danger)',
                    zIndex: 100,
                    pointerEvents: 'none',
                    boxShadow: '0 0 10px rgba(var(--rgb-danger), 0.5)'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: '8px solid var(--color-danger)'
                    }}/>
                </div>

                {/* THE TAPE (TRANSFORMED HORIZONTALLY) */}
                <div ref={timelineRef} className="timeline-tape" style={{
                    position: 'absolute',
                    left: '20%',
                    top: 0,
                    bottom: 0,
                    width: '10000px',
                    willChange: 'transform'
                }}>
                    {project?.timeline?.lanes?.map(lane => (
                        <div key={lane.id} style={{ height: '80px', borderBottom: '1px solid var(--indra-blue-border)' }}>
                            <TimelineTrack 
                                track={lane} 
                                mode="STAGE"
                                pixelsPerSecond={PIXELS_PER_SECOND}
                                onStartDrag={handleMouseDown}
                                onClipClick={handleClipClick}
                                isSelected={selectedClip?.id}
                                onDropAsset={onDropAsset}
                                mutateProject={mutateProject}
                                actions={actions}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
