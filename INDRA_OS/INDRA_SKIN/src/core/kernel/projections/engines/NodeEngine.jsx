import React, { useState, useRef, useEffect } from 'react';
import NodeBodyDispatcher from '../nodes/NodeBodyDispatcher';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';
import { Icons } from '../../../../4_Atoms/IndraIcons';

/**
 * NodeEngine: La manifestación espacial de un Artefacto para Orquestación.
 * Semiótica: "Bloque Funcional", "Puerto de Datos", "Afinidad de Flujo".
 * 
 * V10.5: Materialización Fenotípica (Specialized Widgets + Deep Focus).
 */

const HoldToDeleteButton = ({ onComplete, label }) => {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const isDeleting = progress > 0;

    // 1.0s Duration (SDR-004)
    const startDelete = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const DURATION = 1000;
        const INTERVAL = 20;
        const STEP = 100 / (DURATION / INTERVAL);

        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                const next = prev + STEP;
                if (next >= 100) {
                    clearInterval(intervalRef.current);
                    // Defer callback to next tick to avoid render-phase update
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

    // Cálculo del anillo de progreso (Circunferencia ~ 36px para r=5.5)
    // r=5.5 -> C = 2 * PI * 5.5 ≈ 34.5
    const RADIUS = 7;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

    return (
        <div
            className="relative flex items-center justify-center w-6 h-6 rounded-full cursor-pointer group/delete"
            onMouseDown={startDelete}
            onMouseUp={cancelDelete}
            onMouseLeave={cancelDelete}
            onTouchStart={startDelete}
            onTouchEnd={cancelDelete}
            title="MANTENER PRESIONADO PARA PERMANENTE ELIMITACIÓN (1.5s)"
        >
            {/* Fondo de anillo inactivo */}
            <div className={`absolute inset-0 rounded-full bg-red-500/10 transition-all duration-300 ${isDeleting ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover/delete:scale-100 group-hover/delete:opacity-100'}`}></div>

            {/* Anillo de Progreso SVG */}
            {isDeleting && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10" viewBox="0 0 24 24">
                    <circle
                        cx="12" cy="12" r={RADIUS}
                        fill="none"
                        stroke={progress > 80 ? "#ef4444" : "#f87171"}
                        strokeWidth="2"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-75 ease-linear"
                    />
                </svg>
            )}

            {/* Icono Central (Trash) */}
            <div className={`transition-all duration-200 z-20 ${isDeleting ? 'text-red-500 scale-90' : 'text-[var(--text-dim)] group-hover/delete:text-red-400 opacity-50 group-hover/delete:opacity-100 transform group-hover/delete:scale-110'}`}>
                <Icons.Trash size={10} />
            </div>

            {/* Tooltip de Intencionalidad (Solo visible al cargar) */}
            {isDeleting && progress < 100 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap border border-red-500/30 pointer-events-none">
                    {progress > 80 ? "¡SOLTAR PARA CANCELAR!" : "MANTENIENDO..."}
                </div>
            )}
        </div>
    );
};

const NodeEngine = ({ data }) => {
    const { state, execute } = useAxiomaticStore();
    const { id, LABEL, ARCHETYPE, DOMAIN, CAPABILITIES = {}, VITAL_SIGNS = {}, schemaId } = data;

    // Colores por Dominio (Semiótica de Identidad)
    const domainColors = {
        'SYSTEM_INFRA': '#3b82f6',    // Azul
        'SYSTEM_CORE': '#f97316',     // Naranja
        'UI_PROJECTION': '#a855f7',   // Púrpura
        'SENSING': '#10b981',         // Esmeralda
        'COMMUNICATION': '#ec4899',   // Rosa/Magenta (Terminal Mail)
        'DATA_ENGINE': '#8b5cf6',     // Violeta (Sheets)
        'DOCUMENT_ENGINE': '#06b6d4', // Cyan (Docs/Slides)
    };

    const accentColor = domainColors[DOMAIN] || '#6366f1';

    // Clasificar capabilities por dirección IO
    const inputCapabilities = Object.entries(CAPABILITIES).filter(([_, cap]) =>
        cap.io === 'WRITE' || cap.io === 'TRIGGER' || cap.io === 'GATE' || cap.io === 'INPUT'
    );
    const outputCapabilities = Object.entries(CAPABILITIES).filter(([_, cap]) =>
        cap.io === 'READ' || cap.io === 'STREAM' || cap.io === 'PROBE' || cap.io === 'REFRESH' || cap.io === 'OUTPUT'
    );

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        // AXIOMA: Navegación Fractal (V10.5)
        const isFocusable =
            schemaId === 'FOLDER_NODE' ||
            schemaId === 'COSMOS_NODE' ||
            ARCHETYPE === 'DATABASE' ||
            data.data?.type === 'DIRECTORY' ||
            data.data?.type === 'DATABASE';

        if (isFocusable) {
            console.log(`[NodeEngine] 🌌 Deep Focus Triggered: ${LABEL}`);
            execute('SELECT_ARTIFACT', data);
        }
    };

    const isDatabase = ARCHETYPE === 'DATABASE' || schemaId === 'DATABASE_NODE' || data.data?.type === 'DATABASE';

    return (
        <div
            className={`${isDatabase ? 'w-[500px]' : 'w-64'} bg-[var(--indra-glass-bg)] border border-[var(--indra-glass-border)] rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden group hover:border-[var(--accent)]/50 transition-all active:scale-[0.98] select-none`}
            onDoubleClick={handleDoubleClick}
        >
            {/* 1. Header del Nodo (Identidad Soberana) */}
            <div
                className="px-4 py-2 flex items-center justify-between border-b border-[var(--border-subtle)] cursor-grab active:cursor-grabbing"
                style={{ background: `linear-gradient(to right, ${accentColor}22, transparent)` }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0-8px ${accentColor}` }}></div>
                    <span className="text-[10px] font-black text-[var(--text-soft)] uppercase tracking-widest truncate max-w-[150px]">{LABEL}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-tight">{schemaId || ARCHETYPE}</span>

                    {/* SDR-004: KINETIC INTENT DELETE BUTTON */}
                    <HoldToDeleteButton
                        onComplete={() => execute('REMOVE_ARTIFACT', { id })}
                        label={LABEL}
                    />
                </div>
            </div>

            {/* 2. Cuerpo del Nodo (Puertos de Orquestación + Widget Especializado) */}
            <div className="p-4 flex flex-col gap-2 relative min-h-[80px]">

                {/* Visualización Especializada (V10.5) */}
                <NodeBodyDispatcher data={data} execute={execute} />

                {/* Capa de Puertos (Overlays) */}
                <div className="flex justify-between gap-4 mt-2">
                    {/* Puertos de Entrada */}
                    <div className="flex flex-col gap-2 items-start">
                        {inputCapabilities.map(([key, cap]) => (
                            <div
                                key={key}
                                className="flex items-center gap-2 group/port cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                                onMouseDown={(e) => { e.stopPropagation(); }}
                                onMouseUp={(e) => {
                                    e.stopPropagation();
                                    const pending = state.phenotype.ui.pendingConnection;
                                    if (pending && pending.sourceNodeId !== id) {
                                        execute('ADD_RELATIONSHIP', {
                                            source: pending.sourceNodeId,
                                            target: id,
                                            sourcePort: pending.portId,
                                            targetPort: key
                                        });
                                    }
                                }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-[var(--border-subtle)] bg-[var(--bg-deep)] group-hover/port:border-[var(--accent)] transition-colors"></div>
                                <span className="text-[7px] font-mono text-[var(--text-dim)] uppercase group-hover/port:text-[var(--text-vibrant)] truncate max-w-[80px]">
                                    {cap.human_label || cap.LABEL || key}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Puertos de Salida */}
                    <div className="flex flex-col gap-2 items-end">
                        {outputCapabilities.map(([key, cap], index) => (
                            <div
                                key={key}
                                className="flex items-center gap-2 group/port cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    // Header height (40) + Body padding (16) + Widget approximate height (40) + Index offset
                                    const portY = (40 + 16 + 40 + index * 18);
                                    execute('SET_PENDING_CONNECTION', {
                                        sourceNodeId: id,
                                        portId: key,
                                        startX: data.x,
                                        startY: data.y,
                                        portOffsetX: isDatabase ? 500 : 256, // Ajuste dinámico de ancho
                                        portOffsetY: portY,
                                        currentX: e.clientX,
                                        currentY: e.clientY
                                    });
                                }}
                            >
                                <span className="text-[7px] font-mono text-[var(--text-dim)] uppercase group-hover/port:text-[var(--text-vibrant)] truncate max-w-[80px]">
                                    {cap.human_label || cap.LABEL || key}
                                </span>
                                <div
                                    className="w-2.5 h-2.5 rounded-full border-2 border-[var(--border-subtle)] bg-[var(--bg-deep)] group-hover/port:scale-125 transition-all"
                                    style={{ borderColor: `${accentColor}44` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Footer (Vital Signs / Health) */}
            <div className="px-4 py-1.5 bg-[var(--bg-secondary)] flex items-center justify-between border-t border-[var(--border-subtle)]">
                <div className="flex gap-1.5">
                    {Object.entries(VITAL_SIGNS).map(([key, value]) => (
                        <div
                            key={key}
                            className={`w-1.5 h-1.5 rounded-full ${value.criticality === 'FATAL' ? 'bg-[var(--error)]' : 'bg-[var(--success)]'}`}
                            title={`${key}: ${value.criticality}`}
                        ></div>
                    ))}
                    {Object.keys(VITAL_SIGNS).length === 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-50"></div>
                    )}
                </div>
                <span className="text-[7px] font-black text-[var(--text-dim)] uppercase tracking-tighter">Sovereign_Coherence: 1.0</span>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}} />
        </div>
    );
};

export default NodeEngine;
