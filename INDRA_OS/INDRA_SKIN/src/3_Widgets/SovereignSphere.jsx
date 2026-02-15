/**
 * CAPA 1: AMBIENTE (Z-10)
 * SovereignSphere.jsx
 * DHARMA: El Nodo de Enlace - Puntos de contacto con otros Cores.
 * AXIOMA: "El portal no es una salida, es un punto de fuga en la red."
 */

import React, { useState, useEffect } from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import adapter from '../core/Sovereign_Adapter';
import { Icons } from '../4_Atoms/IndraIcons';
import useAxiomaticState from '../core/state/AxiomaticState';
import { useMagneticSnap } from '../2_Engines/MagneticSnapEngine';
import ArtifactSelector from './ArtifactSelector';
import AdapterSelector from './AdapterSelector';
import './SovereignSphere.css';

// AXIOMA: Generador de Arcos SVG
const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

/**
 * AXIOMA V12: Núcleo Gravitacional (Latido de Sincronía)
 * Implementación premium con efecto de corona solar y partículas.
 */
const SyncStatusCore = ({ syncStatus = 'SYNCED', isOpen }) => {
    const stateConfig = {
        SYNCED: { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.6)' },
        RETRY: { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' },
        OFFLINE: { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' }
    };

    const config = stateConfig[syncStatus] || stateConfig.SYNCED;

    return (
        <div className="sphere-core" data-state={syncStatus} style={{
            '--core-color': config.color,
            '--glow-color': config.glow
        }}>
            {/* Corona de Energía (Múltiples capas de blur) */}
            <div className="sphere-corona sphere-corona-outer" />
            <div className="sphere-corona sphere-corona-middle" />
            <div className="sphere-corona sphere-corona-inner" />

            {/* El Núcleo Sólido (Ojo de Indra) */}
            <div className="sphere-nucleus" />

            {/* Partículas INDRAes (Efecto molecular) */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="sphere-particle"
                    style={{
                        '--particle-size': `${Math.random() * 2 + 1}px`,
                        '--particle-color': config.color,
                        '--particle-opacity': Math.random() * 0.5 + 0.3,
                        transform: `rotate(${i * 60}deg)`
                    }}
                >
                    <div
                        className="particle-dot"
                        style={{
                            animation: `orbit ${Math.random() * 4 + 4}s linear infinite`,
                            animationDelay: `${Math.random() * -8}s`
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

const SovereignSphere = ({ manualLayer, setManualLayer }) => {
    const { state, execute } = useAxiomaticStore();
    const session = useAxiomaticState(s => s.session);
    const [isOpen, setIsOpen] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [links, setLinks] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');

    // ENGINE: Alineación Magnética
    const { position, dockSide, isDragging, startDrag } = useMagneticSnap('bottom');

    // CONTEXTO ACTIVO
    const isCosmosActive = !!state.phenotype.cosmosIdentity;
    const activeContext = manualLayer === 'PORTAL' ? 'PORTAL' : (isCosmosActive ? 'COSMOS' : 'DEFAULT');

    // AXIOMA V14: La Esfera es Contextual, No Sistémica.
    const OUTER_RING = []; // Vaciado: La navegación ahora reside en el Hood.

    // ANILLO INTERIOR: ACCIONES CONTEXTUALES (Dinámico)
    const getInnerActions = () => {
        // DEV_LAB Context: Controles de Laboratorio
        if (manualLayer === 'DEV_LAB') {
            const currentPerspective = state.phenotype.devLab?.perspective || 'BRIDGE';
            return [
                {
                    id: 'PERSPECTIVE_BRIDGE',
                    label: 'Vista Bridge',
                    icon: Icons.Eye,
                    isActive: currentPerspective === 'BRIDGE',
                    action: () => execute('SET_LAB_PERSPECTIVE', 'BRIDGE')
                },
                {
                    id: 'PERSPECTIVE_WIDGET',
                    label: 'Vista Widget',
                    icon: Icons.SidebarLeft,
                    isActive: currentPerspective === 'WIDGET',
                    action: () => execute('SET_LAB_PERSPECTIVE', 'WIDGET')
                },
                {
                    id: 'PERSPECTIVE_NODE',
                    label: 'Vista Nodo',
                    icon: Icons.Terminal,
                    isActive: currentPerspective === 'NODE',
                    action: () => execute('SET_LAB_PERSPECTIVE', 'NODE')
                },
                {
                    id: 'SELECT_ADAPTER',
                    label: 'Seleccionar Adaptador',
                    icon: Icons.Search,
                    action: () => setShowSelector(true)
                },
                {
                    id: 'TEST_SUITE',
                    label: 'Módulo de Caos',
                    icon: Icons.Activity, // Usando Activity como metáfora de monitoreo/test
                    action: () => execute('TOGGLE_UI_PANEL', { panel: 'chaos' })
                },
                {
                    id: 'NUCLEAR_PURGE',
                    label: 'Purgado Nuclear',
                    icon: Icons.Sync,
                    action: () => {
                        if (confirm("☢️ PURGADO NUCLEAR\n\nEsto borrará toda la memoria local (Genotipo L0) y forzará una descarga completa del Servidor.\n\n¿Proceder?")) {
                            execute('NUCLEAR_PURGE');
                        }
                    }
                }
            ];
        }
        if (activeContext === 'COSMOS') {
            return [
                {
                    id: 'ADD_ARTIFACT',
                    label: 'Manifestar Artefacto',
                    icon: Icons.Plus,
                    action: () => setShowSelector(true)
                },
                {
                    id: 'TOGGLE_VISUALIZATION',
                    label: 'Modo de Realidad',
                    icon: Icons.Eye,
                    action: () => execute('TOGGLE_VISUALIZATION_MODE')
                },
                {
                    id: 'AUTO_LAYOUT',
                    label: 'Auto Agrupamiento',
                    icon: Icons.List,
                    action: () => execute('APPLY_AUTO_LAYOUT')
                }
            ];
        }
        return [];
    };
    const INNER_RING = getInnerActions();

    const handleArtifactSelect = (artifact) => {
        // AXIOMA: Context-Aware Selection
        // If we're in DevLab, this is an adapter selection (string ID)
        if (manualLayer === 'DEV_LAB') {
            console.log('[SovereignSphere] DevLab Target Selected:', artifact);
            execute('SET_LAB_TARGET', artifact);
            setShowSelector(false);
            setIsOpen(false);
            return;
        }

        // Otherwise, it's a Cosmos artifact manifestation
        const cosmosId = state.phenotype.cosmosIdentity?.id;
        console.log('[SovereignSphere] Manifesting:', artifact);

        execute('ADD_ARTIFACT_REQUEST', {
            cosmosId,
            artifact: {
                ...artifact,
                type: 'MODULE',
                domain: artifact.DOMAIN
            },
            schemaId: artifact.technical_id
        });

        setShowSelector(false);
        setIsOpen(false);
    };

    // AXIOMA: Scroll Radial (Mouse Wheel)
    const handleWheelScroll = (e, ringType) => {
        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY > 0 ? 10 : -10; // 10 grados por scroll

        setRingRotation(prev => ({
            ...prev,
            [ringType]: prev[ringType] + delta
        }));
    };


    // AXIOMA: Sistema de Anillos Radiales Adaptativos
    const [ringRotation, setRingRotation] = useState({ outer: 0, inner: 0 });

    // Calcula configuración radial adaptativa según densidad de contenido
    const getRadialConfig = (ringType = 'outer', itemCount = 0) => {
        const isInner = ringType === 'inner';

        // AXIOMA: Tamaño mínimo de botón + margen de seguridad
        const BUTTON_SIZE = isInner ? 32 : 40; // px
        const RADIUS = isInner ? 60 : 110; // px
        const MIN_SEPARATION_ANGLE = 15; // grados mínimos entre elementos

        // Calcular ángulo mínimo necesario por elemento
        // arc_length = radius * angle_radians
        // angle_degrees = (button_size / (2 * PI * radius)) * 360
        const minAnglePerItem = Math.max(
            (BUTTON_SIZE / (2 * Math.PI * RADIUS)) * 360,
            MIN_SEPARATION_ANGLE
        );

        // Espacio angular total necesario
        const totalAngleNeeded = minAnglePerItem * Math.max(itemCount - 1, 0);

        // AXIOMA: Expansión Dinámica
        // Si cabe en 180° (semicírculo), usar eso
        // Si no, expandir a 270° o 360° según necesidad
        let arcSpan = 180;
        if (totalAngleNeeded > 180) {
            arcSpan = totalAngleNeeded > 270 ? 360 : 270;
        }

        // Posición base según docking
        const baseAngles = {
            top: { center: 90, span: arcSpan },
            bottom: { center: 270, span: arcSpan },
            left: { center: 0, span: arcSpan },
            right: { center: 180, span: arcSpan }
        };

        const config = baseAngles[dockSide] || baseAngles.top;

        // Ajuste para anillo interior (más compacto)
        const offset = isInner ? 15 : 0;
        const adjustedSpan = Math.max(arcSpan - offset * 2, 90);

        const start = config.center - adjustedSpan / 2;
        const end = config.center + adjustedSpan / 2;

        // Determinar posición de tooltips según cuadrante
        const labelPos = dockSide === 'top' ? '-bottom-8' :
            (dockSide === 'bottom' ? '-top-8' :
                (dockSide === 'left' ? '-right-24' : '-left-24'));

        return {
            start,
            end,
            labelPos,
            arcSpan: adjustedSpan,
            canScroll: totalAngleNeeded > adjustedSpan, // Habilitar scroll si hay desbordamiento
            rotation: ringType === 'outer' ? ringRotation.outer : ringRotation.inner
        };
    };

    return (
        <>
            {showSelector && (
                manualLayer === 'DEV_LAB' ? (
                    <AdapterSelector
                        onSelect={handleArtifactSelect}
                        onClose={() => setShowSelector(false)}
                    />
                ) : (
                    <ArtifactSelector
                        onSelect={handleArtifactSelect}
                        onClose={() => setShowSelector(false)}
                    />
                )
            )}
            {/* AXIOMA: Esfera de Mando Libre (Magnética) */}
            <div
                className="fixed z-[300] flex flex-col items-center gap-4 pointer-events-none transition-none"
                style={{
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -50%)' // Centrado perfecto en el punto de anclaje
                }}
            >
                {/* LA ESFERA (El Ojo de Indra) */}
                <button
                    onMouseDown={startDrag}
                    onClick={(e) => { if (!isDragging) setIsOpen(!isOpen) }}
                    className={`
                        w-16 h-16 rounded-full
                        flex items-center justify-center cursor-pointer pointer-events-auto
                        transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                        glass-sphere-button group relative
                        ${isOpen ? 'scale-110' : 'hover:scale-105 active:scale-95'}
                        ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}
                    `}
                    style={{ zIndex: 60 }}
                >

                    {/* AXIOMA V12: NÚCLEO GRAVITACIONAL (Latido de Sincronía) */}
                    <SyncStatusCore
                        syncStatus={session?.syncStatus}
                        isOpen={isOpen}
                    />

                    {/* TOOLTIP: Información de Sincronía */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="glass px-2 py-1 rounded border border-[var(--accent)]/30 backdrop-blur-md">
                            <p className="text-[7px] font-black uppercase tracking-widest text-[var(--accent)] whitespace-nowrap">
                                {session?.syncStatus === 'SYNCED' ? 'Sincronizado' :
                                    session?.syncStatus === 'RETRY' ? `Reintentando (${session?.failedSyncAttempts})` :
                                        'Arquitectura Offline'}
                            </p>
                            {session?.lastSyncTimestamp && (
                                <p className="text-[6px] text-white/40 mt-0.5 whitespace-nowrap">
                                    Last: {new Date(session.lastSyncTimestamp).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                </button>

                {/* PROYECCIONES RADIALES (Doble Anillo) */}
                <div
                    className={`absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onWheel={(e) => {
                        const outerCfg = getRadialConfig('outer', OUTER_RING.length);
                        const innerCfg = getRadialConfig('inner', INNER_RING.length);

                        // Determinar qué anillo scrollear (el que tenga overflow)
                        if (outerCfg.canScroll || innerCfg.canScroll) {
                            handleWheelScroll(e, outerCfg.canScroll ? 'outer' : 'inner');
                        }
                    }}
                >
                    {/* Indicador de Scroll (si hay overflow) */}
                    {(() => {
                        const outerCfg = getRadialConfig('outer', OUTER_RING.length);
                        const innerCfg = getRadialConfig('inner', INNER_RING.length);
                        const hasScroll = outerCfg.canScroll || innerCfg.canScroll;

                        return hasScroll && isOpen ? (
                            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-[var(--accent)]/20 animate-pulse pointer-events-none">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></div>
                                <span className="text-[8px] font-mono text-[var(--accent)] uppercase tracking-wider">
                                    Scroll to rotate
                                </span>
                            </div>
                        ) : null;
                    })()}

                    {/* GUÍAS RADIALES (Arcos de Expansión) */}
                    {(() => {
                        const outerCfg = getRadialConfig('outer', OUTER_RING.length);
                        const innerCfg = getRadialConfig('inner', INNER_RING.length);

                        return (
                            <>
                                {/* Arco Exterior Purificado (Tabula Rasa) */}

                                {/* Arco Interior */}
                                {INNER_RING.length > 0 && (
                                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" width="140" height="140" style={{ opacity: isOpen ? 0.2 : 0, transition: 'opacity 500ms' }}>
                                        <path
                                            d={describeArc(70, 70, 60, innerCfg.start + innerCfg.rotation, innerCfg.end + innerCfg.rotation)}
                                            fill="none"
                                            stroke="var(--accent)"
                                            strokeWidth="1"
                                            strokeDasharray="2 2"
                                        />
                                    </svg>
                                )}
                            </>
                        );
                    })()}

                    {/* 🗑️ NAVEGACIÓN SISTÉMICA EXPATRIADA AL HOOD */}


                    {/* ANILLO INTERIOR (Acciones) - Radius 60 */}
                    {INNER_RING.length > 0 && INNER_RING.map((action, i) => {
                        const cfg = getRadialConfig('inner', INNER_RING.length);
                        const totalItems = INNER_RING.length;
                        // Centrar si hay pocos items
                        const spread = totalItems > 1 ? (cfg.end - cfg.start) : 0;
                        const start = totalItems > 1 ? cfg.start : (cfg.start + cfg.end) / 2;
                        const angleStep = totalItems > 1 ? spread / (totalItems - 1) : 0;

                        const baseAngle = start + (angleStep * i) + cfg.rotation;
                        const angleRad = (baseAngle * Math.PI) / 180;
                        const x = Math.round(60 * Math.cos(angleRad));
                        const y = Math.round(60 * Math.sin(angleRad));

                        const isActive = action.isActive || false;

                        return (
                            <button
                                key={action.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('[Sphere] Action:', action.id);
                                    action.action();
                                    setIsOpen(false);
                                }}
                                className={`absolute w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 z-50 shadow-lg group/inner pointer-events-auto ${isActive
                                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-[0_0_15px_var(--accent)]'
                                    : 'glass border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-black'
                                    }`}
                                style={{
                                    transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0px, 0px)',
                                    opacity: isOpen ? 1 : 0,
                                    transitionDelay: `${(i * 30) + 100}ms`
                                }}
                            >
                                <action.icon size={12} />
                                {/* Tooltip simple para acciones internas */}
                                <div className={`absolute pointer-events-none opacity-0 group-hover/inner:opacity-100 transition-opacity whitespace-nowrap bg-black/90 px-2 py-1 rounded text-[var(--accent)] border border-[var(--accent)]/20 backdrop-blur-md z-[100] ${cfg.labelPos}`}>
                                    <span className="text-[6px] font-black uppercase tracking-[0.2em]">{action.label}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </>
    );
};

export default SovereignSphere;



