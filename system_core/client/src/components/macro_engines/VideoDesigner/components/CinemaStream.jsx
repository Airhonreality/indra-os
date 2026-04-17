
/**
 * Módulo: CinemaStream
 * Dharma: Visualización pura y monitor de salida WebGPU.
 */
export const CinemaStream = ({ onInitRenderer }) => {
    return (
        <div className="cinema-stream fill center" style={{ 
            backgroundColor: '#000', 
            position: 'relative', 
            overflow: 'hidden' 
        }}>
            <canvas
                ref={(canvas) => {
                    if (canvas && !canvas.dataset.initialized) {
                        canvas.dataset.initialized = "true";
                        try {
                            onInitRenderer(canvas);
                        } catch (e) {
                            console.warn("[CinemaStream] Error transfiriendo canvas", e);
                        }
                    }
                }}
                style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }}
            />
            
            {/* Overlay sutil de monitor industrial */}
            <div style={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                padding: '2px 6px', 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <span className="font-mono" style={{ fontSize: '9px', color: 'var(--color-primary)' }}>WEBGPU_ACCELERATED</span>
            </div>
        </div>
    );
};
