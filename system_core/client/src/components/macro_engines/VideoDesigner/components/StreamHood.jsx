import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * Módulo: StreamHood
 * Dharma: Control de transporte y visualización temporal.
 */
export const StreamHood = ({ currentTime, duration, isPlaying, onPlay, onPause, onSeekStart, onSeekEnd }) => {
    const formatTime = (ms) => {
        const totalSec = ms / 1000;
        const min = Math.floor(totalSec / 60);
        const sec = Math.floor(totalSec % 60);
        const fr = Math.floor((ms % 1000) / 40); // Aproximación a 25fps
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${fr.toString().padStart(2, '0')}`;
    };

    return (
        <div className="shelf--tight px-2" style={{ 
            height: '32px', 
            backgroundColor: 'var(--color-bg-void)', 
            borderBottom: '1px solid var(--color-border)',
            zIndex: 10
        }}>
            <div className="engine-hood__capsule">
                <button className="engine-hood__btn" onClick={onSeekStart} title="Rewind to start">
                    <IndraIcon name="PLAY" size="10px" style={{ transform: 'rotate(180deg)' }} color="var(--color-text-secondary)" />
                </button>
                <button 
                    className={`engine-hood__btn ${isPlaying ? 'engine-hood__btn--active' : ''}`} 
                    onClick={isPlaying ? onPause : onPlay}
                    style={{ background: isPlaying ? 'var(--color-accent-dim)' : 'transparent' }}
                >
                    <IndraIcon 
                        name={isPlaying ? "PAUSE" : "PLAY"} 
                        size="10px" 
                        color={isPlaying ? "var(--color-accent)" : "white"} 
                    />
                </button>
            </div>
            
            <div className="fill shelf--tight px-2">
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-accent)', letterSpacing: '1px', fontWeight: 'bold' }}>
                    {formatTime(currentTime)}
                </span>
                <span className="font-mono opacity-30 mx-1" style={{ fontSize: '10px' }}>/</span>
                <span className="font-mono text-hint" style={{ fontSize: '10px' }}>
                    {formatTime(duration)}
                </span>
            </div>

            <div className="engine-hood__capsule" style={{ padding: '2px 8px' }}>
                 <span className="font-mono text-hint uppercase" style={{ fontSize: '8px', opacity: 0.7 }}>
                     STATUS: <span style={{ color: isPlaying ? 'var(--color-accent)' : 'var(--color-warm)' }}>{isPlaying ? 'STREAMING' : 'PAUSED'}</span>
                 </span>
            </div>
        </div>
    );
};
