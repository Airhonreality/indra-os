/**
 * CAPA 2: ENGINES
 * GraphEngine.jsx
 * DHARMA: Motor de renderizado de grafos espaciales (Cosmos View).
 * AXIOMA: "El conocimiento es una red, no una lista."
 */

import React, { useState, useEffect, useRef } from 'react';
import ComponentProjector from '../core/kernel/ComponentProjector';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import { SPATIAL_PHYSICS } from '../core/laws/Spatial_Physics';
import compiler from '../core/laws/Law_Compiler';

const GraphEngine = ({ nodes = [], edges = [] }) => {
    const { state, execute } = useAxiomaticStore();
    const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const newNodesRef = useRef(new Set());
    const [, forceUpdate] = useState(0);

    // MANEJO DE PAN & ZOOM (Soberanía Espacial)
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const newZoom = Math.min(Math.max(viewState.zoom - e.deltaY * zoomSensitivity, 0.1), 5);
            setViewState(prev => ({ ...prev, zoom: newZoom }));
        } else {
            setViewState(prev => ({
                ...prev,
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    const handleMouseDown = (e) => {
        if (e.target === containerRef.current) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (state.phenotype.ui.pendingConnection) {
            // Actualizar el terminal del cable fantasma
            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - viewState.x - (rect.width / 2)) / viewState.zoom;
            const y = (e.clientY - rect.top - viewState.y - (rect.height / 2)) / viewState.zoom;

            execute('SET_PENDING_CONNECTION', {
                ...state.phenotype.ui.pendingConnection,
                currentX: x,
                currentY: y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        // Si hay una conexión pendiente, la limpiamos después de un breve delay
        if (state.phenotype.ui.pendingConnection) {
            setTimeout(() => execute('CLEAR_PENDING_CONNECTION'), 100);
        }
    };

    // --- LÓGICA DE AUTOLAYOUT AXIOMÁTICO (Fisiología Fractal) ---
    const getAxiomaticPosition = (node, allNodes) => {
        const arch = (node.ARCHETYPE || node.archetype || '').toUpperCase();

        // 1. Determinar Columna (x)
        let x = 0; // Column B: TRANSFORMS (Default)
        if (arch.includes('VAULT') || arch.includes('ADAPTER')) x = -450; // Column A: SEEDS
        if (arch.includes('SLOT')) x = 450; // Column C: FRUITS

        // 2. Determinar Posición Vertical (y) 
        const sameColNodes = allNodes.filter(n => {
            const nArch = (n.ARCHETYPE || n.archetype || '').toUpperCase();
            if (x === -450) return nArch.includes('VAULT') || nArch.includes('ADAPTER');
            if (x === 450) return nArch.includes('SLOT');
            return !nArch.includes('VAULT') && !nArch.includes('ADAPTER') && !nArch.includes('SLOT');
        });

        const colIndex = sameColNodes.findIndex(n => n.id === node.id);

        // AXIOMA: Profundidad de Procesamiento (Staggered Flow)
        // Sub-columnas dentro de Orígenes: Vaults (-550) vs Adapters (-350)
        let subColumnOffset = 0;
        if (arch.includes('VAULT')) subColumnOffset = -100;
        if (arch.includes('ADAPTER')) subColumnOffset = 100;

        const finalX = x + subColumnOffset + (colIndex % 2 === 0 ? 0 : 40);

        const y = (colIndex - (sameColNodes.length - 1) / 2) * 380;

        return { x: finalX, y };
    };

    // RENDERIZADO DE SUGERENCIAS AXIOMÁTICAS (The Proactive Bridge)
    const renderSuggestions = () => {
        const pending = state.phenotype.ui.pendingConnection;
        if (!pending) return null;

        const sourceNode = nodes.find(n => n.id === pending.sourceNodeId);
        if (!sourceNode) return null;

        const suggestions = compiler.getCompatibleNodes(sourceNode.ARCHETYPE);
        if (suggestions.length === 0) return null;

        return (
            <div
                className="absolute z-[1000] flex flex-col gap-2 p-3 bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--accent)]/30 rounded-2xl shadow-2xl pointer-events-auto animate-in fade-in zoom-in-90 duration-300"
                style={{
                    left: pending.currentX + (100 / viewState.zoom), // Offset para no tapar el cursor
                    top: pending.currentY - (suggestions.length * 20 / viewState.zoom),
                    transform: `scale(${1 / viewState.zoom})`, // Mantener tamaño legible
                    transformOrigin: 'left center'
                }}
            >
                <header className="flex items-center gap-2 mb-1 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Sugerencias Axiomáticas</span>
                </header>
                {suggestions.slice(0, 4).map((art, idx) => (
                    <button
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--accent)]/10 border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-all text-left group"
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            // MANIFEST_AND_CONNECT
                            execute('ADD_ARTIFACT_REQUEST', { artifact: art });
                            // El delay es para esperar a que el nodo se materialice y tenga ID
                            setTimeout(() => {
                                const newNodes = state.phenotype.artifacts;
                                const lastNode = newNodes[newNodes.length - 1];
                                if (lastNode) {
                                    execute('ADD_RELATIONSHIP', {
                                        source: pending.sourceNodeId,
                                        target: lastNode.id,
                                        sourcePort: pending.portId,
                                        targetPort: Object.keys(lastNode.CAPABILITIES || {})[0] || 'input'
                                    });
                                }
                            }, 100);
                        }}
                    >
                        <span className="text-xl">✨</span>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-[var(--text-soft)] group-hover:text-white uppercase truncate max-w-[120px]">
                                {art.LABEL || art.label}
                            </span>
                            <span className="text-[8px] font-mono text-[var(--text-dim)] uppercase">Manifestar {art.ARCHETYPE}</span>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    // RENDERIZADO DE CONEXIÓN PENDIENTE (Fantasma)
    const renderPendingConnection = () => {
        const pending = state.phenotype.ui.pendingConnection;
        if (!pending) return null;

        const sourceNode = nodes.find(n => n.id === pending.sourceNodeId);
        if (!sourceNode) return null;

        const { x: sx, y: sy } = getAxiomaticPosition(sourceNode, nodes);

        const x1 = sx + (pending.portOffsetX || 0);
        const y1 = sy + (pending.portOffsetY || 0);
        const x2 = pending.currentX;
        const y2 = pending.currentY;

        const dx = Math.abs(x1 - x2) * 0.5;
        const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        return (
            <path
                d={pathData}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeDasharray="5 5"
                strokeOpacity="0.6"
                className="animate-flow"
            />
        );
    };

    // RENDERIZADO DE ARISTAS (Conexiones Sinápticas)
    const renderEdges = () => {
        const activePulses = state.phenotype.activePulses || [];
        return edges.filter(e => !e._isDeleted).map((edge, i) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const isActive = activePulses.includes(edge.id);

            const { x: x1_raw, y: y1_raw } = getAxiomaticPosition(sourceNode, nodes);
            const { x: x2_raw, y: y2_raw } = getAxiomaticPosition(targetNode, nodes);

            const { NODE_WIDTH } = SPATIAL_PHYSICS.GEOMETRY;

            const x1 = x1_raw + (NODE_WIDTH / 2);
            const y1 = y1_raw;
            const x2 = x2_raw - (NODE_WIDTH / 2);
            const y2 = y2_raw;

            const dx = Math.abs(x1 - x2) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
                <g key={edge.id || i}>
                    <path
                        d={pathData}
                        fill="none"
                        stroke={isActive ? "var(--accent-glow)" : "var(--accent)"}
                        strokeWidth={isActive ? "3" : "2"}
                        strokeOpacity={isActive ? "0.8" : "0.3"}
                        className={isActive ? "glow-pulse" : "animate-pulse"}
                    />
                    <path
                        d={pathData}
                        fill="none"
                        stroke="url(#cableGradient)"
                        strokeWidth={isActive ? "2.5" : "1.5"}
                        strokeDasharray="10 5"
                        className={isActive ? "animate-flow-fast" : "animate-flow"}
                        style={{ filter: isActive ? 'drop-shadow(0 0 5px var(--accent-glow))' : 'none' }}
                    />
                </g>
            );
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('indra/artifact');

        if (data) {
            try {
                const artifact = JSON.parse(data);

                // AXIOMA: Cálculo de Coordenadas de Realidad (Projection Mapping)
                const rect = containerRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left - viewState.x - (rect.width / 2)) / viewState.zoom;
                const y = (e.clientY - rect.top - viewState.y - (rect.height / 2)) / viewState.zoom;

                execute('ADD_ARTIFACT_REQUEST', {
                    artifact: artifact,
                    position: { x, y }
                });
            } catch (err) {
                console.error('[GraphEngine] Drop Error:', err);
            }
        }
    };

    const isFocused = state.phenotype.activeLayout?.id && state.phenotype.cosmosIdentity?.id && state.phenotype.activeLayout.id !== state.phenotype.cosmosIdentity.id;

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden bg-dot-pattern transition-all duration-700 ${isFocused ? 'blur-md scale-95 opacity-30 grayscale' : 'blur-0 scale-100'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
                backgroundColor: 'var(--bg-deep)',
                backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
        >
            <div
                className="absolute transform-gpu transition-transform duration-75 ease-out origin-center"
                style={{
                    transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`,
                    left: '50%',
                    top: '50%',
                    width: 0,
                    height: 0
                }}
            >
                <svg className="absolute overflow-visible" style={{ left: 0, top: 0 }}>
                    <defs>
                        <linearGradient id="cableGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
                            <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {renderEdges()}
                    {renderPendingConnection()}
                </svg>

                {/* HUD de Sugerencias (Contextual) */}
                {renderSuggestions()}

                {nodes.filter(n => !n._isDeleted).map((node) => {
                    const { x, y } = getAxiomaticPosition(node, nodes);

                    // AXIOMA: DETECCIÓN DE NACIMIENTO
                    const isNew = !newNodesRef.current.has(node.id);
                    if (isNew) {
                        newNodesRef.current.add(node.id);
                        setTimeout(() => forceUpdate(v => v + 1), 1000);
                    }

                    return (
                        <div
                            key={node.id}
                            className={`absolute cursor-pointer group ${isNew ? 'animate-manifest z-[500]' : ''}`}
                            onDoubleClick={(e) => { e.stopPropagation(); execute('SELECT_ARTIFACT', node); }}
                            style={{
                                transform: isNew ? 'none' : `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                left: isNew ? `${x}px` : 'auto',
                                top: isNew ? `${y}px` : 'auto'
                            }}
                        >
                            <ComponentProjector
                                componentId={node.id}
                                data={{ ...node, x, y }}
                                perspective="NODE"
                                schemaId={node.schemaId}
                            />
                        </div>
                    );
                })}

                {/* ETIQUETAS DE COLUMNA (Map Labels) */}
                {!isFocused && (
                    <>
                        <div className="absolute top-[-500px] left-[-450px] transform -translate-x-1/2 -translate-y-full opacity-10 pointer-events-none">
                            <span className="text-6xl font-black uppercase tracking-[0.5em] text-[var(--text-primary)]">ORÍGENES</span>
                        </div>
                        <div className="absolute top-[-500px] left-[0px] transform -translate-x-1/2 -translate-y-full opacity-10 pointer-events-none">
                            <span className="text-6xl font-black uppercase tracking-[0.5em] text-[var(--text-primary)]">PROCESOS</span>
                        </div>
                        <div className="absolute top-[-500px] left-[450px] transform -translate-x-1/2 -translate-y-full opacity-10 pointer-events-none">
                            <span className="text-6xl font-black uppercase tracking-[0.5em] text-[var(--text-primary)]">RESULTADOS</span>
                        </div>
                    </>
                )}
            </div>

            {!isFocused && (
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 text-[9px] font-mono text-[var(--text-dim)] pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                        <span>DIAGRAMA_FRACTAL: ACTIVO</span>
                    </div>
                    <span>ZOOM: {Math.round(viewState.zoom * 100)}% | MODO_MAPA: ON</span>
                </div>
            )}
        </div>
    );
};

export default GraphEngine;
