/**
 * SovereignSphere.jsx (V12 - Gravitational Core)
 * DHARMA: Núcleo Gravitacional del Sistema - Latido de Sincronía
 * 
 * Concepto Visual: Eclipse vivo entre materia y energía.
 * No es un botón, es un objeto gravitacional que emana luz según el estado del sistema.
 * 
 * Estados Cromáticos:
 * - SYNCED (Azul cielo): Sistema en sincronía perfecta
 * - RETRY (Amarillo atardecer): Retry protocol activo
 * - OFFLINE (Rojo): Sin conexión con el Core
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useAxiomaticState from '../core/state/AxiomaticState';
import './SovereignSphere.css';

const SovereignSphere = ({ syncStatus = 'SYNCED', onClick }) => {
    const [particles, setParticles] = useState([]);

    // Generar partículas INDRAes (efecto molecular)
    useEffect(() => {
        const particleCount = 12;
        const generated = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            angle: (360 / particleCount) * i,
            distance: 60 + Math.random() * 20,
            size: 2 + Math.random() * 3,
            opacity: 0.3 + Math.random() * 0.4,
            duration: 8 + Math.random() * 4
        }));
        setParticles(generated);
    }, []);

    // Configuración cromática por estado
    const stateConfig = {
        SYNCED: {
            coreColor: '#60a5fa',      // Azul cielo
            glowColor: 'rgba(96, 165, 250, 0.6)',
            particleColor: '#93c5fd',
            label: 'Sincronizado',
            pulseDuration: 3
        },
        RETRY: {
            coreColor: '#fbbf24',      // Amarillo atardecer
            glowColor: 'rgba(251, 191, 36, 0.6)',
            particleColor: '#fcd34d',
            label: 'Sincronizando...',
            pulseDuration: 2
        },
        OFFLINE: {
            coreColor: '#ef4444',      // Rojo
            glowColor: 'rgba(239, 68, 68, 0.8)',
            particleColor: '#f87171',
            label: 'Sin conexión',
            pulseDuration: 1.5
        }
    };

    const config = stateConfig[syncStatus];

    return (
        <div className="sovereign-sphere-container">
            {/* Núcleo Central (Eclipse Core) */}
            <motion.div
                className="sphere-core"
                style={{
                    '--core-color': config.coreColor,
                    '--glow-color': config.glowColor
                }}
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: config.pulseDuration,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
                onClick={onClick}
            >
                {/* Corona Radial (Multi-layer Blur) */}
                <div className="sphere-corona sphere-corona-outer" />
                <div className="sphere-corona sphere-corona-middle" />
                <div className="sphere-corona sphere-corona-inner" />

                {/* Núcleo sólido */}
                <div className="sphere-nucleus" />
            </motion.div>

            {/* Partículas INDRAes (Efecto Molecular) */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="sphere-particle"
                    style={{
                        '--particle-color': config.particleColor,
                        '--particle-size': `${particle.size}px`,
                        '--particle-opacity': particle.opacity
                    }}
                    animate={{
                        rotate: [0, 360]
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                >
                    <div
                        className="particle-dot"
                        style={{
                            transform: `translateX(${particle.distance}px)`
                        }}
                    />
                </motion.div>
            ))}

            {/* Label Sutil (Solo en offline) */}
            {syncStatus === 'OFFLINE' && (
                <motion.div
                    className="sphere-label"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    Trabajo sin conexión
                </motion.div>
            )}
        </div>
    );
};

export default SovereignSphere;



