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

import HoldToDeleteButton from '../../../../4_Atoms/HoldToDeleteButton';

const NodeEngine = ({ data }) => {
    const { state, execute } = useAxiomaticStore();
    const { id, LABEL, ARCHETYPE, DOMAIN, CAPABILITIES = {}, VITAL_SIGNS = {}, schemaId } = data;
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

    const isDatabase = ARCHETYPE === 'DATABASE' || schemaId === 'DATABASE_NODE' || data.data?.type === 'DATABASE';

    // AXIOMA: Inyección de Puertos Fantasma (Proyección Robusta)
    // Aseguramos que las DBs tengan sus puertos vitales de conexión al Slot incluso si el backend no los ha hidratado aún.
    const effectiveCapabilities = { ...CAPABILITIES };
    if (isDatabase) {
        // AXIOMA: Soberanía de Conexión (Siempre exponer DATA_STREAM)
        if (!effectiveCapabilities.DATA_STREAM) {
            effectiveCapabilities.DATA_STREAM = {
                io: 'STREAM',
                type: 'TABLE',
                human_label: 'DATA_STREAM 📡'
            };
        }
        // AXIOMA: Normalización de Claves (Evitar Duplicados: QUERY FILTER vs QUERY_FILTER)
        // AXIOMA: Normalización Estricta de Claves (Evitar Duplicados: QUERY FILTER vs QUERY_FILTER)
        // 1. Identificar si existe alguna variante del filtro
        const filterKey = Object.keys(effectiveCapabilities).find(k => k.replace(/_/g, ' ').trim() === 'QUERY FILTER');

        if (!filterKey) {
            // Si no existe ninguna, inyectamos la canónica
            effectiveCapabilities.QUERY_FILTER = {
                io: 'TRIGGER',
                type: 'FILTER',
                human_label: 'QUERY_FILTER 🔍'
            };
        } else if (filterKey !== 'QUERY_FILTER') {
            // Si existe una variante legacy, la movemos a la canónica y borramos la vieja
            effectiveCapabilities.QUERY_FILTER = effectiveCapabilities[filterKey];
            delete effectiveCapabilities[filterKey];
        }
    }

    // Clasificar capabilities por dirección IO
    const inputCapabilities = Object.entries(effectiveCapabilities).filter(([_, cap]) =>
        cap.io === 'WRITE' || cap.io === 'TRIGGER' || cap.io === 'GATE' || cap.io === 'INPUT'
    );
    const outputCapabilities = Object.entries(effectiveCapabilities).filter(([_, cap]) =>
        cap.io === 'READ' || cap.io === 'STREAM' || cap.io === 'PROBE' || cap.io === 'REFRESH' || cap.io === 'OUTPUT'
    );

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        // AXIOMA: Navegación Fractal (V10.5)
        const isFocusable =
            schemaId === 'FOLDER_NODE' ||
            schemaId === 'COSMOS_NODE' ||
            isDatabase ||
            data.data?.type === 'DIRECTORY';

        if (isFocusable) {
            console.log(`[NodeEngine] 🌌 Deep Focus Triggered: ${LABEL}`);
            execute('SELECT_ARTIFACT', data);
        }
    };

    return (
        <div
            className={`
                ${isDatabase ? 'w-[420px]' : 'w-64'} 
                bg-[var(--indra-glass-bg)] border rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden group transition-all active:scale-[0.98] select-none
                ${isPulsing ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.4)] scale-[1.02]' : 'border-[var(--indra-glass-border)] hover:border-[var(--accent)]/50'}
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
                        let available = data.ARCHETYPES || data.data?.ARCHETYPES;

                        // Fallback Proactivo: Si es DB pero no tiene arquetipos declarados, inyectar trinidad
                        if (!available && isDatabase) available = ['DATABASE', 'VAULT', 'NODE'];

                        if (available && available.length > 1) {
                            return (
                                <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 mr-1">
                                    {available.map(arch => (
                                        <button
                                            key={arch}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                execute('UPDATE_NODE', {
                                                    id,
                                                    updates: { ARCHETYPE: arch }
                                                });
                                            }}
                                            className={`px-1.5 py-0.5 rounded text-[7px] font-black transition-all ${ARCHETYPE === arch ? 'bg-[var(--accent)] text-black' : 'text-white/40 hover:text-white'}`}
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
                    <HoldToDeleteButton
                        onComplete={() => execute('REMOVE_ARTIFACT', { id })}
                        size={24}
                        iconSize={10}
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
                                        portOffsetX: isDatabase ? 420 : 256, // Ajuste dinámico sincronizado
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



