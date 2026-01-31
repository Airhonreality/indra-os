import React, { useRef, useState, useEffect } from 'react';
import useCoreStore from '../../core/state/CoreStore';
import { OntologyService } from '../../core/integrity/OntologyService';
import { Box, Save, Terminal, X, Zap, Cpu, Activity, Layout } from 'lucide-react';
import CableLayer from './CableLayer';
import TopologyHUD from './TopologyHUD';
import CoreBridge from '../../core/bridge/CoreBridge';

/**
 * 🎨 TopologyStage: High-Performance Vector Canvas (Sovereign v2.0)
 * Axiom: Schematic Projection. Dual-Theme Reactive.
 */
const TopologyStage = () => {
    const {
        contracts, nodes, layouts, updateNode, updateLayout, addConnection, deleteNode,
        currentProject, saveProject, setProject, addLog,
        session, setSession
    } = useCoreStore();

    const [isCreating, setIsCreating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [projectName, setProjectName] = useState('');
    const containerRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [dragMode, setDragMode] = useState(null);
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [wiringSource, setWiringSource] = useState(null);
    const [phantomEnd, setPhantomEnd] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const { NODE_WIDTH, HEADER_HEIGHT, ROW_HEIGHT, SNAP_GRID } = OntologyService.getLayoutTokens();

    const handleCreateProject = async () => {
        if (!projectName.trim()) return;
        setIsProcessing(true);
        try {
            const seed = await CoreBridge.callCore('sensing', 'initializeSeed', { rootName: 'ORBITAL_ROOT' });
            const newProject = {
                id: `proj-${Date.now()}`,
                name: projectName.endsWith('.project.json') ? projectName : `${projectName}.project.json`,
                folderId: seed.folderId
            };
            setProject(newProject);
            setIsCreating(false);
            setProjectName('');
            addLog('success', `TOPOLOGY >> Space ${projectName} Initialized.`);
        } catch (e) {
            addLog('error', `TOPOLOGY >> Init Failed: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const { zoom_min, zoom_max } = OntologyService.getOpticTokens();

        const handleWheelEvent = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.min(Math.max(prev * delta, zoom_min), zoom_max));
        };

        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && session?.selectedId) {
                deleteNode(session.selectedId);
                setSession({ selectedId: null });
            }
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            container.removeEventListener('wheel', handleWheelEvent);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [session?.selectedId]);

    const handleMouseDown = (e) => {
        if (e.button === 0 || e.button === 1) {
            setDragMode('PAN');
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handleNodeDown = (e, id) => {
        e.stopPropagation();
        setSession({ selectedId: id });
        if (e.button === 0) {
            setDragMode('NODE');
            setActiveNodeId(id);
            const nodePos = layouts[id] || { x: 0, y: 0 };
            setDragStart({ x: e.clientX / zoom - nodePos.x, y: e.clientY / zoom - nodePos.y });
        }
    };

    const handleMouseMove = (e) => {
        if (dragMode === 'PAN') {
            setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
        if (dragMode === 'NODE' && activeNodeId) {
            const newX = e.clientX / zoom - dragStart.x;
            const newY = e.clientY / zoom - dragStart.y;
            updateLayout(activeNodeId, {
                x: Math.round(newX / SNAP_GRID) * SNAP_GRID,
                y: Math.round(newY / SNAP_GRID) * SNAP_GRID
            });
        }
        if (wiringSource) {
            const rect = containerRef.current.getBoundingClientRect();
            setPhantomEnd({
                x: (e.clientX - rect.left - offset.x) / zoom,
                y: (e.clientY - rect.top - offset.y) / zoom
            });
        }
    };

    const handlePortMouseDown = (e, nodeId, method, isOutput = true) => {
        e.stopPropagation();
        const nodePos = layouts[nodeId];
        const node = nodes[nodeId];
        const methodIndex = (node.methods || []).indexOf(method);
        const snapX = nodePos.x + (isOutput ? NODE_WIDTH : 0);
        const snapY = nodePos.y + HEADER_HEIGHT + (methodIndex * ROW_HEIGHT) + (ROW_HEIGHT / 2);

        setWiringSource({ id: nodeId, method, schema: node.schemas?.[method] || {}, x: snapX, y: snapY, isOutput });
        setPhantomEnd({ x: snapX, y: snapY });
    };

    const handlePortMouseUp = (e, nodeId, method) => {
        e.stopPropagation();
        if (!wiringSource || wiringSource.id === nodeId) return;

        const targetSchema = nodes[nodeId]?.schemas?.[method] || {};
        const affinity = OntologyService.getAffinity(wiringSource.schema, targetSchema);

        if (affinity.compatible) {
            addConnection({
                id: `conn-${Date.now()}`,
                from: wiringSource.id, fromPort: wiringSource.method,
                to: nodeId, toPort: method,
                metadata: { affinity: affinity.score }
            });
        }
        setWiringSource(null);
        setPhantomEnd(null);
    };

    return (
        <div
            ref={containerRef} className="topology-canvas"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => { setDragMode(null); setWiringSource(null); }}
            onDrop={(e) => {
                e.preventDefault();
                const nodeKey = e.dataTransfer.getData('application/x-core-node-key');
                if (!nodeKey || !contracts[nodeKey]) return;
                const rect = containerRef.current.getBoundingClientRect();
                const uuid = `node-${Date.now()}`;
                updateNode(uuid, { ...contracts[nodeKey], instanceOf: nodeKey, label: `${nodeKey}_${uuid.slice(-4)}`, id: uuid });
                updateLayout(uuid, {
                    x: (e.clientX - rect.left - offset.x) / zoom,
                    y: (e.clientY - rect.top - offset.y) / zoom
                });
            }}
            onDragOver={(e) => e.preventDefault()}
        >
            <TopologyHUD />
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(var(--accent-primary) 1px, transparent 1px)`,
                    backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
                    backgroundPosition: `${offset.x}px ${offset.y}px`,
                }}
            />

            <div className="node-layer" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
                <div className="relative w-full h-full pointer-events-auto">
                    <CableLayer />
                    {wiringSource && phantomEnd && (() => {
                        const theme = OntologyService.getIntentTheme(wiringSource.schema?.intent || 'READ');
                        return (
                            <svg className="absolute inset-0 overflow-visible pointer-events-none z-[99]">
                                <path
                                    d={`M ${wiringSource.x} ${wiringSource.y} C ${wiringSource.x + 50} ${wiringSource.y}, ${phantomEnd.x - 50} ${phantomEnd.y}, ${phantomEnd.x} ${phantomEnd.y}`}
                                    stroke={theme.color || "var(--accent-primary)"} strokeWidth="2" strokeDasharray="5,5" fill="none" className="pulsing"
                                />
                            </svg>
                        );
                    })()}

                    {Object.entries(nodes).map(([id, node]) => {
                        const archetype = OntologyService.getArchetype(node.archetype || node.semantic_intent || 'DEFAULT');
                        const pos = layouts[id];
                        if (!pos) return null;

                        const nodeIcon = archetype.icon;
                        const nodeColor = archetype.color;

                        return (
                            <div
                                key={id}
                                className={`contract-node rounded-sm overflow-hidden ${session?.selectedId === id ? 'selected' : ''} ${archetype.motion || ''}`}
                                onMouseDown={(e) => handleNodeDown(e, id)}
                                style={{
                                    left: pos.x,
                                    top: pos.y,
                                    width: NODE_WIDTH,
                                    borderColor: session?.selectedId === id ? nodeColor : 'rgba(255,255,255,0.05)',
                                    boxShadow: session?.selectedId === id ? `0 0 30px ${nodeColor}33` : 'none',
                                    zIndex: activeNodeId === id ? 100 : 1
                                }}
                            >
                                <header className="node-header border-b border-white/5" style={{ background: `${nodeColor}11` }}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="p-1 rounded-sm" style={{ background: `${nodeColor}22` }}>
                                            {React.createElement(nodeIcon, { size: 11, color: nodeColor })}
                                        </div>
                                        <span className="mono-bold text-[9px] uppercase truncate opacity-80 tracking-widest">{node.label}</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                                        className="opacity-20 hover:opacity-100 transition-opacity p-1 bg-transparent border-none"
                                    >
                                        <X size={10} />
                                    </button>
                                </header>

                                <div className="node-body flex flex-col p-1 gap-px bg-black/40">
                                    {(node.methods || []).map(m => {
                                        const methodSchema = node.schemas?.[m] || {};
                                        const intentToken = OntologyService.getIntentTheme(methodSchema.semantic_intent || 'READ');

                                        return (
                                            <div key={m} className="method-port group/port hover:bg-white/[0.03] transition-colors rounded-sm">
                                                <div className="port-handle input" onMouseUp={(e) => handlePortMouseUp(e, id, m)} />
                                                <div className="flex items-center gap-2 flex-1 px-2 py-1.5 overflow-hidden">
                                                    <div className="w-1 h-1 rounded-full shrink-0" style={{ background: intentToken.color }} />
                                                    <span className="mono text-[8px] opacity-40 group-hover/port:opacity-100 transition-opacity truncate">{m}</span>
                                                </div>
                                                <div
                                                    className="port-handle output"
                                                    onMouseDown={(e) => handlePortMouseDown(e, id, m, true)}
                                                    style={{ background: intentToken.color }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {node.archetype && (
                                    <footer className="px-2 py-1 border-t border-white/5 flex justify-end bg-black/60">
                                        <span className="text-[7px] mono opacity-20 uppercase tracking-[0.2em]">{node.archetype}</span>
                                    </footer>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Canvas Overlays */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
                <button
                    onClick={saveProject}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-black hover:brightness-110 shadow-2xl transition-all"
                >
                    <Save size={12} />
                    <span className="mono-bold text-[9px] tracking-widest uppercase">Persist_State</span>
                </button>
            </div>

            <div className="absolute bottom-6 left-6 pointer-events-none flex flex-col gap-1">
                <div className="flex items-center gap-2 opacity-30">
                    <Box size={10} />
                    <span className="mono text-[9px] uppercase tracking-widest">
                        Workspace: {currentProject?.name?.replace('.project.json', '') || 'Transient'}
                    </span>
                </div>
                <div className="flex items-center gap-2 opacity-10">
                    <Layout size={10} />
                    <span className="mono text-[8px] uppercase tracking-tighter">
                        Zoom: {(zoom * 100).toFixed(0)}% | X: {Math.round(offset.x)} Y: {Math.round(offset.y)}
                    </span>
                </div>
            </div>

            {/* Init Modal */}
            {!currentProject && !isCreating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[200]">
                    <div className="w-[320px] p-8 border border-white/5 bg-zinc-950/80 shadow-[0_0_100px_rgba(0,0,0,1)] text-center flex flex-col gap-6">
                        <div className="flex justify-center">
                            <Box size={48} className="text-accent-primary opacity-20" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="mono-bold text-xs uppercase tracking-[0.4em]">Topology_Void</h2>
                            <p className="mono text-[9px] opacity-40 uppercase tracking-widest">Awaiting spatial initialization</p>
                        </div>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="py-3 bg-accent-primary text-black font-black uppercase tracking-widest text-[9px] hover:brightness-110 transition-all pointer-events-auto"
                        >
                            Open_Nexus
                        </button>
                    </div>
                </div>
            )}

            {isCreating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[200]">
                    <div className="w-[400px] p-8 border border-white/5 bg-zinc-950/80 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="mono-bold text-[10px] uppercase tracking-[0.4em] opacity-60">Init_Sequence</h2>
                            <X size={14} className="opacity-20 hover:opacity-100 cursor-pointer" onClick={() => setIsCreating(false)} />
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="mono text-[8px] opacity-20 uppercase tracking-widest">Designation</label>
                                <input
                                    autoFocus
                                    className="w-full p-3 bg-white/5 border border-white/10 outline-none mono text-[11px] focus:border-accent-primary/40 transition-all"
                                    placeholder="e.g. ALPHA_NEXUS"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleCreateProject}
                                disabled={!projectName.trim() || isProcessing}
                                className="py-3 bg-accent-primary text-black font-black uppercase tracking-widest text-[9px] hover:brightness-110 disabled:opacity-20 transition-all"
                            >
                                {isProcessing ? 'Sensing_Core...' : 'Commence_Reification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopologyStage;
