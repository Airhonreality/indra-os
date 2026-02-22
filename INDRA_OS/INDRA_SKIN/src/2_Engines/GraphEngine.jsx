/**
 * CAPA 2: ENGINES
 * GraphEngine.jsx
 * DHARMA: Motor de renderizado de grafos espaciales (Cosmos View).
 * AXIOMA: "El conocimiento es una red, no una lista."
 */

import React, { useState, useEffect, useRef } from 'react';
import ProjectionMatrix from '../core/kernel/ProjectionMatrix.jsx';
import { useAxiomaticStore } from '../core/1_Axiomatic_Store/AxiomaticStore.jsx';
import compiler from '../core/2_Semantic_Transformation/Law_Compiler.js';

const NODE_WIDTH = 200; // Ancho estándar para cálculos de anclaje

const GraphEngine = ({ nodes = [], edges = [] }) => {
    const { state, execute } = useAxiomaticStore();
    const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const newNodesRef = useRef(new Set());
    const [, forceUpdate] = useState(0);
    const [draggedNodeId, setDraggedNodeId] = useState(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // AXIOMA: Posicionamiento Efímero (Local State for 60FPS Dragging)
    const [localPositions, setLocalPositions] = useState({});
    const [localPendingEnd, setLocalPendingEnd] = useState(null);

    // AXIOMA: Sincronización de Manifestación (Nuevos Nodos)
    useEffect(() => {
        newNodesRef.current.clear();
        setDraggedNodeId(null);
        setLocalPositions({});
        setLocalPendingEnd(null);
        forceUpdate(v => v + 1);
    }, [state.phenotype.cosmosIdentity?.id]);

    useEffect(() => {
        const hasNewNodes = nodes.some(n => !newNodesRef.current.has(n.id));
        if (hasNewNodes) {
            const timer = setTimeout(() => forceUpdate(v => v + 1), 500);
            return () => clearTimeout(timer);
        }
    }, [nodes]);

    // AXIOMA: Soberanía de Navegación (Wheel Listener No-Pasivo)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const manualWheel = (e) => {
            e.preventDefault(); // Ahora permitido porque el listener no es pasivo
            const direction = e.deltaY > 0 ? -1 : 1;
            const newZoom = Math.min(Math.max(viewState.zoom + (direction * viewState.zoom * 0.1), 0.1), 5);
            setViewState(prev => ({ ...prev, zoom: newZoom }));
        };

        container.addEventListener('wheel', manualWheel, { passive: false });
        return () => container.removeEventListener('wheel', manualWheel);
    }, [viewState.zoom]);

    const handleMouseDown = (e) => {
        if (e.target === containerRef.current) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - viewState.x - (rect.width / 2)) / viewState.zoom;
        const canvasY = (e.clientY - rect.top - viewState.y - (rect.height / 2)) / viewState.zoom;

        if (draggedNodeId) {
            // AXIOMA: Movimiento Local Inmediato (Cero Latencia en Store)
            const newX = canvasX - dragOffset.current.x;
            const newY = canvasY - dragOffset.current.y;

            setLocalPositions(prev => ({
                ...prev,
                [draggedNodeId]: { x: newX, y: newY }
            }));

        } else if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (state.phenotype.ui.pendingConnection) {
            // AXIOMA: Cable Fantasma a 60 FPS (Estado local)
            setLocalPendingEnd({ x: canvasX, y: canvasY });
        }
    };

    const handleMouseUp = () => {
        if (draggedNodeId && localPositions[draggedNodeId]) {
            // AXIOMA: Compromiso Final (Commit on Release)
            const pos = localPositions[draggedNodeId];
            execute('UPDATE_NODE', {
                id: draggedNodeId,
                updates: { x: pos.x, y: pos.y }
            });
        }

        setIsDragging(false);
        setDraggedNodeId(null);
        setLocalPendingEnd(null);

        if (state.phenotype.ui.pendingConnection) {
            // Breve delay para permitir que el onMouseUp del puerto actúe primero
            setTimeout(() => {
                // Usamos el estado inyectado directamente para la comprobación
                if (state.phenotype.ui.pendingConnection) {
                    execute('CLEAR_PENDING_CONNECTION');
                }
            }, 100);
        }
    };

    // AXIOMA: Cancelación por Escape (UX Universal)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && state.phenotype.ui.pendingConnection) {
                execute('CLEAR_PENDING_CONNECTION');
                setLocalPendingEnd(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.phenotype.ui.pendingConnection]);

    const handleNodeMouseDown = (e, node) => {
        if (state.phenotype.ui.pendingConnection) return;

        e.stopPropagation();
        setDraggedNodeId(node.id);

        const rect = containerRef.current.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - viewState.x - (rect.width / 2)) / viewState.zoom;
        const canvasY = (e.clientY - rect.top - viewState.y - (rect.height / 2)) / viewState.zoom;

        const { x: nodeX, y: nodeY } = getAxiomaticPosition(node);
        dragOffset.current = {
            x: canvasX - nodeX,
            y: canvasY - nodeY
        };
    };

    // --- LÓGICA DE GEOMETRÍA SOBERANA (Free Will Physics) ---
    const getAxiomaticPosition = (node) => {
        // 0. Prioridad absoluta: Movimiento en tiempo real (Local State)
        if (localPositions[node.id]) {
            return localPositions[node.id];
        }

        // 1. Si el nodo ya tiene voluntad propia (coordenadas guardadas), se respetan.
        if (typeof node.x === 'number' && typeof node.y === 'number') {
            return { x: node.x, y: node.y };
        }

        // 2. Si es un recién nacido, nace del caos (Dispersión Radial Aleatoria)
        // Usamos el hash del ID para que sea pseudo-determinista y no salte en cada render.
        const hash = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seed = hash % 1000; // 0-999

        const angle = (seed / 1000) * Math.PI * 2; // Ángulo aleatorio 0-360
        const radius = 200 + (seed % 300); // Radio entre 200px y 500px del centro

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return { x, y };
    };



    // RENDERIZADO DE CONEXIÓN PENDIENTE (Fantasma)
    const renderPendingConnection = () => {
        const pending = state.phenotype.ui.pendingConnection;
        if (!pending) return null;

        // AXIOMA: Coordenadas ya en espacio canvas (transformadas en NodeEngine)
        const x1 = pending.startX;
        const y1 = pending.startY;

        // Priorizar posición local efímera para máxima fluidez
        const x2 = localPendingEnd ? localPendingEnd.x : pending.currentX;
        const y2 = localPendingEnd ? localPendingEnd.y : pending.currentY;

        const dx = Math.abs(x1 - x2) * 0.5;
        const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        return (
            <path
                d={pathData}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeDasharray="5 5"
                strokeOpacity="0.8"
                className="animate-flow"
            />
        );
    };

    // RENDERIZADO DE ARISTAS (Conexiones Sinápticas)
    const renderEdges = () => {
        const activePulses = state.phenotype.activePulses || [];
        const canvas = containerRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        return edges.filter(e => !e._isDeleted).map((edge, i) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const isActive = activePulses.includes(edge.id);

            const { x: x1_base, y: y1_base } = getAxiomaticPosition(sourceNode);
            const { x: x2_base, y: y2_base } = getAxiomaticPosition(targetNode);

            // AXIOMA: Snapping Inteligente de Puerto (V14.1)
            // Intentamos encontrar el puerto en el DOM para máxima precisión.
            // Si no está (ej: nodo colapsado o no renderizado aún), usamos el fallback.

            let x1 = x1_base + (NODE_WIDTH / 2);
            let y1 = y1_base;
            let x2 = x2_base - (NODE_WIDTH / 2);
            let y2 = y2_base;

            // Búsqueda de Puertos Reales
            const sourcePortEl = document.querySelector(`[data-port-id="${edge.source}:${edge.sourcePort}"]`);
            const targetPortEl = document.querySelector(`[data-port-id="${edge.target}:${edge.targetPort}"]`);

            if (sourcePortEl) {
                const pRect = sourcePortEl.getBoundingClientRect();
                const bullet = sourcePortEl.querySelector('div[class*="rounded-full"]') || sourcePortEl;
                const bRect = bullet.getBoundingClientRect();

                x1 = (bRect.left + bRect.width / 2 - rect.left - centerX - viewState.x) / viewState.zoom;
                y1 = (bRect.top + bRect.height / 2 - rect.top - centerY - viewState.y) / viewState.zoom;
            }

            if (targetPortEl) {
                const pRect = targetPortEl.getBoundingClientRect();
                const bullet = targetPortEl.querySelector('div[class*="rounded-full"]') || targetPortEl;
                const bRect = bullet.getBoundingClientRect();

                x2 = (bRect.left + bRect.width / 2 - rect.left - centerX - viewState.x) / viewState.zoom;
                y2 = (bRect.top + bRect.height / 2 - rect.top - centerY - viewState.y) / viewState.zoom;
            }

            const dx = Math.abs(x1 - x2) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
                <g
                    key={edge.id || i}
                    className="cursor-pointer group/cable"
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('¿Eliminar esta conexión sináptica?')) {
                            execute('REMOVE_RELATIONSHIP', { id: edge.id });
                        }
                    }}
                >
                    {/* AXIOMA: Hit-box invisible (Facilita click en cables finos) */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="15"
                        className="pointer-events-auto"
                    />

                    {/* El Cable Visual */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke={isActive ? "var(--accent-glow)" : "var(--accent)"}
                        strokeWidth={isActive ? "3" : "2"}
                        strokeOpacity={isActive ? "0.9" : "0.3"}
                        className={`${isActive ? "glow-pulse" : "animate-pulse"} group-hover/cable:stroke-opacity-100 transition-all`}
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
        const data = e.dataTransfer.getData('axiom/artifact');

        if (data) {
            try {
                const artifact = JSON.parse(data);

                // AXIOMA: Cálculo de Coordenadas de Realidad (Projection Mapping)
                const rect = containerRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left - (rect.width / 2)) / viewState.zoom - viewState.x;
                const y = (e.clientY - rect.top - (rect.height / 2)) / viewState.zoom - viewState.y;

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
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            // AXIOMA: Exposición de Estado Espacial (Para que NodeEngine pueda transformar coords)
            data-graph-canvas="true"
            data-zoom={viewState.zoom}
            data-panx={viewState.x}
            data-pany={viewState.y}
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



                {nodes.filter(n => !n._isDeleted).map((node) => {
                    const { x, y } = getAxiomaticPosition(node);

                    // AXIOMA: DETECCIÓN DE NACIMIENTO
                    const isNew = !newNodesRef.current.has(node.id);
                    if (isNew) {
                        newNodesRef.current.add(node.id);
                        // El update se maneja ahora con un efecto para evitar advertencias de React
                    }

                    return (
                        <div
                            key={node.id}
                            className={`absolute cursor-pointer group ${isNew ? 'animate-manifest z-[500]' : ''} ${draggedNodeId === node.id ? 'z-[1000] scale-105' : ''}`}
                            onMouseDown={(e) => handleNodeMouseDown(e, node)}
                            onDoubleClick={(e) => { e.stopPropagation(); execute('SELECT_ARTIFACT', node); }}
                            style={{
                                transform: (isNew && draggedNodeId !== node.id) ? 'none' : `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                                transition: draggedNodeId === node.id ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                left: (isNew && draggedNodeId !== node.id) ? `${x}px` : 'auto',
                                top: (isNew && draggedNodeId !== node.id) ? `${y}px` : 'auto'
                            }}
                        >
                            <ProjectionMatrix
                                componentId={node.id}
                                data={{ ...node, x, y }}
                                perspective="NODE"
                                schemaId={node.schemaId}
                            />
                        </div>
                    );
                })}

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




