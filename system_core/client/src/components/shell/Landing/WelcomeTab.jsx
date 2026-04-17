import React from 'react';
import { FractalLogo } from './FractalLogo';

const INDRA_TITLE_LETTERS = ['I', 'N', 'D', 'R', 'A'];

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
            <div style={{ width: '100%', maxWidth: '1200px', overflow: 'visible', marginBottom: '14px' }}>
                <h1 style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '14px',
                    margin: 0,
                    padding: 0,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600
                }}>
                    {INDRA_TITLE_LETTERS.map((letter) => (
                        <span
                            key={letter}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '86px',
                                height: '86px',
                                borderRadius: '999px',
                                border: '1px solid rgba(123, 47, 247, 0.45)',
                                color: 'var(--color-text-primary)',
                                fontSize: '58px',
                                letterSpacing: '0.28em',
                                background: 'linear-gradient(135deg, rgba(123, 47, 247, 0.22), rgba(33, 150, 243, 0.18))',
                                boxShadow: '0 0 24px rgba(123, 47, 247, 0.25)'
                            }}
                        >
                            {letter}
                        </span>
                    ))}
                </h1>
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
                marginTop: '0', 
                textAlign: 'left',
                paddingLeft: '0'
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
