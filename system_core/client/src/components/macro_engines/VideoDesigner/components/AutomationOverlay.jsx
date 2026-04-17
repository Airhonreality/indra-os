
/**
 * Módulo: AutomationOverlay
 * Dharma: Renderizado visual de curvas de automatización sobre un clip.
 * AXIOMA: Sinceridad matemática sin carga de DOM.
 */
export const AutomationOverlay = ({ clip, param, pixelsPerSecond, onUpdateAutomation, color = 'var(--color-primary)' }) => {
    const canvasRef = React.useRef(null);
    const [isDraggingNode, setIsDraggingNode] = React.useState(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const keyframes = clip.automation?.[param] || [];
        if (keyframes.length === 0) return;

        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Estética Industrial: Línea de base
        ctx.strokeStyle = 'rgba(var(--rgb-primary), 0.3)';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rect.height);
        ctx.lineTo(rect.width, rect.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Renderizado de Curva
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        keyframes.forEach((kf, index) => {
            const x = (kf.timeMs / 1000) * pixelsPerSecond;
            // Invertir Y (0 es arriba, queremos 0 abajo)
            const y = rect.height - (kf.value * rect.height);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                const prev = keyframes[index - 1];
                const prevX = (prev.timeMs / 1000) * pixelsPerSecond;
                const prevY = rect.height - (prev.value * rect.height);

                if (prev.easing === 'linear') {
                    ctx.lineTo(x, y);
                } else if (prev.easing === 'step') {
                    ctx.lineTo(x, prevY);
                    ctx.lineTo(x, y);
                } else {
                    // Bezier simplificado para la visualización
                    const cp1x = prevX + (x - prevX) / 2;
                    ctx.bezierCurveTo(cp1x, prevY, cp1x, y, x, y);
                }
            }
        });

        ctx.stroke();

        // Nodos (Keyframes)
        keyframes.forEach(kf => {
            const x = (kf.timeMs / 1000) * pixelsPerSecond;
            const y = rect.height - (kf.value * rect.height);
            
            ctx.fillStyle = 'var(--color-bg-void)';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

    }, [clip, param, pixelsPerSecond]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const timeMs = (x / pixelsPerSecond) * 1000;
        const value = 1 - (y / rect.height);

        const keyframes = [...(clip.automation?.[param] || [])];
        
        // 1. Hit testing: ¿Estamos sobre un nodo existente?
        const nodeIndex = keyframes.findIndex(kf => {
            const kfX = (kf.timeMs / 1000) * pixelsPerSecond;
            const kfY = rect.height - (kf.value * rect.height);
            return Math.sqrt(Math.pow(x - kfX, 2) + Math.pow(y - kfY, 2)) < 8;
        });

        if (nodeIndex !== -1) {
            setIsDraggingNode(nodeIndex);
        } else {
            // 2. Si no, añadir nuevo nodo (Axioma de Fluidez)
            keyframes.push({ timeMs, value, easing: 'linear' });
            keyframes.sort((a, b) => a.timeMs - b.timeMs);
            onUpdateAutomation(param, keyframes);
        }
    };

    const handleMouseMove = (e) => {
        if (isDraggingNode === null) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        
        const keyframes = [...(clip.automation?.[param] || [])];
        keyframes[isDraggingNode] = {
            ...keyframes[isDraggingNode],
            timeMs: (x / pixelsPerSecond) * 1000,
            value: 1 - (y / rect.height)
        };
        
        // Mantener orden temporal
        keyframes.sort((a, b) => a.timeMs - b.timeMs);
        onUpdateAutomation(param, keyframes);
    };

    const handleMouseUp = () => {
        setIsDraggingNode(null);
    };

    return (
        <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'auto', // Habilitamos puntero para interactividad
                opacity: 0.8,
                cursor: isDraggingNode !== null ? 'grabbing' : 'crosshair'
            }} 
        />
    );
};
