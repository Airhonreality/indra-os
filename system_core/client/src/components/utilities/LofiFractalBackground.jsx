import React from 'react';

/**
 * LofiFractalBackground
 * Una textura sutil de anillos concéntricos fractales para el workspace.
 * Diseñada para inducir relajación manteniendo la estética técnica.
 */
export const LofiFractalBackground = () => {
    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            opacity: 0.1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <svg 
                viewBox="0 0 1000 1000" 
                style={{ 
                    width: '120vh', 
                    height: '120vh', 
                    animation: 'spin-slow 240s linear infinite',
                    filter: 'blur(1px)'
                }}
            >
                <defs>
                    <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
                        <stop offset="30%" stopColor="var(--color-accent)" stopOpacity="0.05" />
                        <stop offset="60%" stopColor="var(--color-warm)" stopOpacity="0.02" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Anillos Concéntricos con Patrones Fibonacci */}
                {[...Array(8)].map((_, i) => (
                    <circle
                        key={i}
                        cx="500"
                        cy="500"
                        r={100 + i * 60}
                        fill="none"
                        stroke="var(--color-text-secondary)"
                        strokeWidth="0.5"
                        strokeDasharray={`${2 + i} ${10 + i * 2}`}
                        opacity={0.3 - i * 0.03}
                    />
                ))}

                {/* El "Anillo Interior" Fractalizado */}
                <g opacity="0.4">
                    {[...Array(24)].map((_, i) => {
                        const angle = (i * 15) * (Math.PI / 180);
                        const r = 250;
                        const x = 500 + Math.cos(angle) * r;
                        const y = 500 + Math.sin(angle) * r;
                        return (
                            <line 
                                key={i}
                                x1="500" y1="500"
                                x2={x} y2={y}
                                stroke="var(--color-accent)"
                                strokeWidth="0.2"
                                strokeDasharray="2, 50"
                            />
                        );
                    })}
                </g>

                {/* Aura de Resonancia */}
                <circle cx="500" cy="500" r="480" fill="url(#ringGrad)" />
            </svg>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
