import React from 'react';
import { FractalLogo } from './FractalLogo';

/**
 * WelcomeTab — Programmatic Pro Edition
 * Hollow typography, technical metadata, and visual imbalance.
 */
export const WelcomeTab = () => (
    <div style={{ 
        width: '100%', 
        height: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'var(--color-bg-void)',
        display: 'flex',
        fontFamily: "'Outfit', sans-serif"
    }}>
        {/* LOGO GIGANTE AL FONDO (SÍMBOLO DE PODER) */}
        <div style={{ 
            position: 'absolute', 
            inset: 0,
            zIndex: 0, 
            opacity: 0.8, 
            pointerEvents: 'none',
            transform: 'translateX(25vw) scale(1.1) rotate(-5deg)' 
        }}>
            <FractalLogo active={true} />
        </div>

        <div style={{ 
            flex: '1', 
            zIndex: 10, 
            paddingLeft: '8vw', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            width: '100%',
            overflow: 'visible' 
        }}>
            {/* Título INDRA - Reconstrucción Blindada (Posicionamiento Interno en X=400) */}
            <div style={{ width: '100%', maxWidth: '1200px', overflow: 'visible' }}>
                <svg viewBox="-100 -50 2000 400" style={{ width: '100%', height: 'auto', overflow: 'visible', marginBottom: '-5px' }}>
                    <defs>
                        <linearGradient id="indra-title-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#7b2ff7" />
                            <stop offset="50%" stopColor="#8a2be2" />
                            <stop offset="100%" stopColor="#2196f3" />
                        </linearGradient>
                        
                        <filter id="indra-title-glow" x="-200%" y="-200%" width="600%" height="600%" filterUnits="userSpaceOnUse">
                            <feGaussianBlur stdDeviation="15" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>

                        <mask id="hollow-mask">
                            <rect x="-200" y="-100" width="2400" height="700" fill="white" />
                            <g stroke="black" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none">
                                {/* EL 'CORAZÓN' DEL TUBO - INDRA COMPLETO DESDE X=400 */}
                                <path d="M 400 40 L 400 200" /> {/* I */}
                                <path d="M 510 200 L 510 60 A 20 20 0 0 1 530 40 L 560 40 A 20 20 0 0 1 575 50 L 675 190 A 20 20 0 0 0 690 200 L 700 200 A 20 20 0 0 0 720 180 L 720 40" /> {/* N */}
                                <path d="M 810 40 L 810 200 L 890 200 A 80 80 0 0 0 890 40 L 810 40 Z" /> {/* D */}
                                <path d="M 1050 200 L 1050 40 L 1140 40 A 35 35 0 0 1 1140 110 L 1050 110 M 1110 110 L 1180 200" /> {/* R */}
                                <path d="M 1270 200 L 1350 57 A 25 25 0 0 1 1395 57 L 1475 200 M 1305 137 L 1440 137" /> {/* A */}
                            </g>
                        </mask>
                    </defs>

                    {/* Logo Body con máscara Venus y Glow Infinito */}
                    <g mask="url(#hollow-mask)" stroke="url(#indra-title-grad)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#indra-title-glow)">
                        <path d="M 400 40 L 400 200" />
                        <path d="M 510 200 L 510 60 A 20 20 0 0 1 530 40 L 560 40 A 20 20 0 0 1 575 50 L 675 190 A 20 20 0 0 0 690 200 L 700 200 A 20 20 0 0 0 720 180 L 720 40" />
                        <path d="M 810 40 L 810 200 L 890 200 A 80 80 0 0 0 890 40 L 810 40 Z" />
                        <path d="M 1050 200 L 1050 40 L 1140 40 A 35 35 0 0 1 1140 110 L 1050 110 M 1110 110 L 1180 200" />
                        <path d="M 1270 200 L 1350 57 A 25 25 0 0 1 1395 57 L 1475 200 M 1305 137 L 1440 137" />
                    </g>
                </svg>
            </div>
            
            <p style={{ 
                letterSpacing: '0.82em', 
                fontSize: '11px', 
                opacity: 0.8, 
                fontWeight: 100,
                textTransform: 'uppercase',
                maxWidth: '600px',
                lineHeight: '2.4',
                color: 'var(--color-text-primary)',
                marginTop: '-15px', 
                textAlign: 'left',
                paddingLeft: '390px' 
            }}>
                Aquí terminan todas las <br/> <span style={{ opacity: 0.4 }}>BANALIDADES DEL MUNDO</span>
            </p>
        </div>

        {/* INDICADOR DE SCROLL LATERAL / VERTICAL */}
        <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '8vw',
            zIndex: 10,
            opacity: 0.3,
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }}>
            <div style={{ width: '1px', height: '40px', background: 'var(--color-text-primary)' }} />
            <div style={{ fontSize: '10px', letterSpacing: '0.3em' }}>DESCUBRIR_ARQUITECTURA</div>
        </div>

        {/* Viñeta para suavizar el fondo y dar profundidad */}
        <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 50%, transparent 0%, rgba(var(--color-bg-void-rgb), 0.9) 100%)',
            pointerEvents: 'none',
            zIndex: 1
        }} />
    </div>
);
