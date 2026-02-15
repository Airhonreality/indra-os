import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './IndraIcons';

/**
 * ATOM: HoldToDeleteButton
 * DHARMA: Botón de eliminación con confirmación cinética (SDR-004).
 * AXIOMA: "La intención requiere persistencia temporal."
 */
const HoldToDeleteButton = ({ onComplete, size = 24, iconSize = 14, color = "red" }) => {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const isDeleting = progress > 0;

    // 1.0s Duration (SDR-004) - Adjusted to 1.5s as per original tooltip
    const DURATION = 1000;

    const startDelete = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const INTERVAL = 20;
        const STEP = 100 / (DURATION / INTERVAL);

        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                const next = prev + STEP;
                if (next >= 100) {
                    clearInterval(intervalRef.current);
                    // Defer callback to next tick
                    setTimeout(() => onComplete(), 0);
                    return 100;
                }
                return next;
            });
        }, INTERVAL);
    };

    const cancelDelete = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        clearInterval(intervalRef.current);
        setProgress(0);
    };

    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    // Cálculo del anillo de progreso
    // Radio base para size 24 es ~7. Escalamos proporcionalmente.
    const RADIUS = (size / 2) - 5;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

    const activeColorClass = color === "red" ? "text-red-500" : "text-[var(--accent)]";
    const strokeColor = color === "red" ? "#ef4444" : "var(--accent)";

    return (
        <div
            className={`relative flex items-center justify-center rounded-full cursor-pointer group/delete select-none`}
            style={{ width: size, height: size }}
            onMouseDown={startDelete}
            onMouseUp={cancelDelete}
            onMouseLeave={cancelDelete}
            onTouchStart={startDelete}
            onTouchEnd={cancelDelete}
            title="MANTENER PRESIONADO PARA PERMANENTE ELIMITACIÓN"
        >
            {/* Fondo de anillo inactivo */}
            <div className={`absolute inset-0 rounded-full bg-${color}-500/10 transition-all duration-300 ${isDeleting ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover/delete:scale-100 group-hover/delete:opacity-100'}`}></div>

            {/* Anillo de Progreso SVG */}
            {isDeleting && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10" viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2} cy={size / 2} r={RADIUS}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-75 ease-linear"
                    />
                </svg>
            )}

            {/* Icono Central (Trash) */}
            <div className={`transition-all duration-200 z-20 ${isDeleting ? `${activeColorClass} scale-90` : `text-[var(--text-dim)] group-hover/delete:${activeColorClass} opacity-50 group-hover/delete:opacity-100 transform group-hover/delete:scale-110`}`}>
                <Icons.Trash size={iconSize} />
            </div>

            {/* Tooltip de Intencionalidad (Solo visible al cargar) */}
            {isDeleting && progress < 100 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap border border-red-500/30 pointer-events-none z-50">
                    {progress > 80 ? "¡SOLTAR PARA CANCELAR!" : "BORRANDO..."}
                </div>
            )}
        </div>
    );
};

export default HoldToDeleteButton;



