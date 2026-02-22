import React, { useState, useRef, useEffect } from 'react';
import NodeBodyDispatcher from '../nodes/NodeBodyDispatcher.jsx';
import { useAxiomaticStore } from '../../../1_Axiomatic_Store/AxiomaticStore.jsx';
import HoldToDeleteButton from '../../../../4_Atoms/HoldToDeleteButton.jsx';

/**
 * NodeEngine: La manifestación espacial de un Artefacto para Orquestación.
 * Semiótica: "Bloque Funcional", "Puerto de Datos", "Afinidad de Flujo".
 * 
 * V10.5: Materialización Fenotípica (Specialized Widgets + Deep Focus).
 * V11.0: Fix Snapping - Coordenadas de Puerto via DOM real, no offsets estimados.
 */

const NodeEngine = ({ data }) => {
    const { state, execute } = useAxiomaticStore();

    // AXIOMA: Desestructuración Canónica (ADR-022)
    const id = data.id;
    const LABEL = data.LABEL || id;
    const ARCHETYPE = (data.ARCHETYPE || 'NODE').toUpperCase();
    const traits = data.traits || [];
    const CAPABILITIES = data.CAPABILITIES || {};
    const VITAL_SIGNS = data.VITAL_SIGNS || {};
    const schemaId = data.schemaId;

    const [isPulsing, setIsPulsing] = useState(false);

    // AXIOMA: Sensor de Pulso Sináptico (Visual Feedback)
    useEffect(() => {
        const handlePulse = (e) => {
            if (e.detail?.nodeId === id) {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 800);
            }
        };
        window.addEventListener('ISK_SYNAPTIC_PULSE', handlePulse);
        return () => window.removeEventListener('ISK_SYNAPTIC_PULSE', handlePulse);
    }, [id]);

    const domain = (data.DOMAIN || 'system').toLowerCase();
    // Colores por Dominio (Semiótica de Identidad)
    const domainColors = {
        'system_infra': '#3b82f6',    // Azul
        'system': '#f97316',          // Naranja
        'projection': '#a855f7',      // Púrpura
        'sensing': '#10b981',         // Esmeralda
        'communication': '#ec4899',   // Rosa/Magenta
        'data': '#8b5cf6',            // Violeta
        'content': '#06b6d4',         // Cyan
    };

    const accentColor = domainColors[domain] || '#6366f1';

    const capIds = Object.values(CAPABILITIES).map(c => typeof c === 'object' ? c.id : c);

    // AXIOMA: Clasificación de Naturaleza por Rasgos (Morfogénesis Purista)
    const isDatabase = traits.includes('DATABASE') || capIds.includes('DATA_STREAM') || ARCHETYPE === 'DATABASE';
    const isSlot = traits.includes('COMPOSITOR') || capIds.includes('RECEIVE') || ARCHETYPE === 'COMPOSITOR';
    const isVault = traits.includes('STORAGE') || capIds.includes('LIST_FILES') || ARCHETYPE === 'VAULT';

    const hasDataCapability = !!(capIds.includes('DATA_STREAM') || isDatabase);
    const hasProjectionCapability = !!(capIds.includes('RECEIVE') || isSlot);

    // AXIOMA: Inyección de Puertos Fantasma (DESACTIVADO - Soberanía del Contrato)
    // Filtramos capacidades únicas por ID para evitar duplicidad visual si el contrato viene ruidoso
    const uniqueCapabilities = {};
    Object.entries(CAPABILITIES).forEach(([key, cap]) => {
        const portId = cap.id || key;
        if (!uniqueCapabilities[portId]) {
            uniqueCapabilities[portId] = { ...cap, _originalKey: key };
        }
    });

    const effectiveCapabilities = uniqueCapabilities;

    // Clasificar capabilities por dirección IO
    const inputCapabilities = Object.entries(effectiveCapabilities).filter(([_, cap]) =>
        ['WRITE', 'TRIGGER', 'GATE', 'INPUT', 'ADMIN'].includes(cap.io)
    );
    const outputCapabilities = Object.entries(effectiveCapabilities).filter(([_, cap]) =>
        ['READ', 'STREAM', 'PROBE', 'REFRESH', 'OUTPUT'].includes(cap.io)
    );

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        // AXIOMA: Navegación Fractal (V10.5)
        // El enfoque profundo se habilita si el nodo demuestra comportamiento de contenedor
        const isFocusable = isDatabase || isSlot || isVault;

        if (isFocusable) {
            console.log(`[NodeEngine] 🌌 Deep Focus Triggered: ${LABEL}`);
            execute('SELECT_ARTIFACT', data);
        }
    };

    return (
        <div
            className={`
                ${isDatabase ? 'w-[420px]' : 'w-64'}
                bg-[var(--axiom-glass-bg)] border rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden group transition-all active:scale-[0.98] select-none
                ${isPulsing ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.4)] scale-[1.02]' : 'border-[var(--axiom-glass-border)] hover:border-[var(--accent)]/50'}
            `}
            onDoubleClick={handleDoubleClick}
        >
            {/* 1. Header del Nodo (Identidad Soberana) */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-[var(--border-subtle)] cursor-grab active:cursor-grabbing" style={{ background: `linear-gradient(to right, ${accentColor}22, transparent)` }}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}></div>
                    <span className="text-[10px] font-black text-[var(--text-soft)] truncate tracking-tight uppercase group-hover:text-white transition-colors">
                        {LABEL}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* AXIOMA: Selector de Morfogénesis (Morpher) */}
                    {(() => {
                        const available = data.ARCHETYPES || [];

                        if (available && available.length > 1) {
                            return (
                                <div
                                    className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 mr-1"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {available.map(arch => (
                                        <button
                                            key={arch}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                execute('UPDATE_NODE', {
                                                    id,
                                                    updates: { ARCHETYPE: arch.toUpperCase() }
                                                });
                                            }}
                                            className={`px-1.5 py-0.5 rounded text-[7px] font-black transition-all ${ARCHETYPE === arch.toUpperCase() ? 'bg-[var(--accent)] text-black' : 'text-white/40 hover:text-white'}`}
                                            title={`Mutar a modo ${arch}`}
                                        >
                                            {arch}
                                        </button>
                                    ))}
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <span className="text-[8px] font-mono text-[var(--accent)] font-bold uppercase tracking-tight px-1.5 bg-[var(--accent)]/5 rounded border border-[var(--accent)]/20">
                        {ARCHETYPE || schemaId}
                    </span>

                    {/* SDR-004: KINETIC INTENT DELETE BUTTON */}
                    <div onMouseDown={(e) => e.stopPropagation()}>
                        <HoldToDeleteButton
                            onComplete={() => execute('REMOVE_ARTIFACT', { id })}
                            size={24}
                            iconSize={10}
                        />
                    </div>
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
                        {inputCapabilities.map(([key, cap]) => {
                            const pending = state.phenotype.ui.pendingConnection;
                            let isCompatible = true;
                            let isPending = !!pending;

                            if (pending) {
                                // AXIOMA: Check de Compatibilidad Semántica (V14.2)
                                const sourceNode = state.phenotype.artifacts[pending.sourceNodeId];
                                const sourceCap = (sourceNode?.CAPABILITIES || {})[pending.portId];

                                const sourceType = sourceCap?.type || sourceCap?.dataType || 'ANY';
                                const targetType = cap.type || cap.dataType || 'ANY';

                                isCompatible = (sourceType === 'ANY' || targetType === 'ANY' || sourceType === targetType);
                            }

                            return (
                                <div
                                    key={key}
                                    data-port-id={`${id}:${key}`}
                                    className={`flex items-center gap-2 group/port cursor-pointer hover:bg-white/5 p-1 rounded transition-all ${isPending && !isCompatible ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}
                                    onMouseDown={(e) => { e.stopPropagation(); }}
                                    onMouseUp={(e) => {
                                        e.stopPropagation();
                                        if (pending && pending.sourceNodeId !== id && isCompatible) {
                                            execute('ADD_RELATIONSHIP', {
                                                source: pending.sourceNodeId,
                                                target: id,
                                                sourcePort: pending.portId,
                                                targetPort: key
                                            });
                                            // AXIOMA: Limpieza Inmediata (Anti-Feedback)
                                            execute('CLEAR_PENDING_CONNECTION');
                                        }
                                    }}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full border-2 bg-[var(--bg-deep)] transition-all ${isPending && isCompatible ? 'border-[var(--accent)] scale-125 animate-pulse' : 'border-[var(--border-subtle)]'}`}></div>
                                    <span className={`text-[7px] font-mono uppercase truncate max-w-[80px] transition-colors ${isPending && isCompatible ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-dim)] group-hover/port:text-[var(--text-vibrant)]'}`}>
                                        {cap.LABEL || key}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Puertos de Salida */}
                    <div className="flex flex-col gap-2 items-end">
                        {outputCapabilities.map(([key, cap]) => (
                            <div
                                key={key}
                                data-port-id={`${id}:${key}`}
                                className="flex items-center gap-2 group/port cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    const portEl = e.currentTarget.querySelector('div[class*="rounded-full"]') || e.currentTarget;
                                    const portRect = portEl.getBoundingClientRect();

                                    const canvas = document.querySelector('[data-graph-canvas]');
                                    const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

                                    const zoom = canvas ? parseFloat(canvas.dataset.zoom || 1) : 1;
                                    const panX = canvas ? parseFloat(canvas.dataset.panx || 0) : 0;
                                    const panY = canvas ? parseFloat(canvas.dataset.pany || 0) : 0;

                                    const portScreenX = portRect.left + portRect.width / 2;
                                    const portScreenY = portRect.top + portRect.height / 2;

                                    const canvasCenterX = canvasRect.left + canvasRect.width / 2;
                                    const canvasCenterY = canvasRect.top + canvasRect.height / 2;

                                    const portCanvasX = (portScreenX - canvasCenterX - panX) / zoom;
                                    const portCanvasY = (portScreenY - canvasCenterY - panY) / zoom;

                                    execute('SET_PENDING_CONNECTION', {
                                        sourceNodeId: id,
                                        portId: key,
                                        startX: portCanvasX,
                                        startY: portCanvasY,
                                        portOffsetX: 0,
                                        portOffsetY: 0,
                                        currentX: portCanvasX,
                                        currentY: portCanvasY
                                    });
                                }}
                            >
                                <span
                                    className="text-[7px] font-mono text-[var(--text-dim)] uppercase group-hover/port:text-[var(--accent)] transition-colors select-none cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // AXIOMA: Disparo de Señal (Manual Trigger)
                                        // Emitimos la materia bruta, el Store se encarga del descorchado ontológico.
                                        execute('EXECUTE_NODE_ACTION', {
                                            nodeId: id,
                                            capability: key,
                                            payload: data.items || data.data?.items || data
                                        });
                                    }}
                                >
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

