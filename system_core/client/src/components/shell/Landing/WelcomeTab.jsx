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

        {/* METADATA FLOTANTE (PROGRAMMATIC LOOK) */}
        <div style={{
            position: 'absolute',
            top: '120px',
            left: '8vw',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            opacity: 0.4
        }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.4em', fontWeight: 600 }}>v8.0.0_STABLE</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.4em' }}>SYSTEM_ENGINE_ACTIVE [TRUE]</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.4em', color: '#00f3ff' }}>● LATENCY_REDUNDANCY_OK</div>
        </div>

        {/* CONTENIDO TEXTUAL (Hollow Typography) */}
        <div style={{ 
            flex: '0 0 45%', 
            zIndex: 10, 
            paddingLeft: '8vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
        }}>
            <h1 style={{
                fontSize: 'clamp(80px, 16vw, 240px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                marginBottom: '5px',
                lineHeight: 0.8,
                color: 'transparent',
                WebkitTextStroke: '1px rgba(var(--color-accent-rgb), 0.6)',
                filter: 'drop-shadow(0 0 30px rgba(var(--color-accent-rgb), 0.3))',
                textTransform: 'uppercase'
            }}>
                INDRA
            </h1>
            
            <p style={{ 
                letterSpacing: '0.8em', 
                fontSize: '11px', 
                opacity: 0.8, 
                fontWeight: 300,
                textTransform: 'uppercase',
                maxWidth: '600px',
                lineHeight: '2.4',
                color: 'var(--color-text-primary)',
                marginTop: '10px',
                paddingLeft: '5px'
            }}>
                AQUÍ TERMINAN TODAS LAS <br/> <span style={{ opacity: 0.4 }}>BANALIDADES DEL MUNDO</span>
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
