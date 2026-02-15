import React, { useState, useEffect } from 'react';
import BridgeChassis from '../chassis/BridgeChassis';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';
import persistenceManager from '../../../state/PersistenceManager';
import { useSignifier } from '../../hooks/useSignifier';
import AxiomaticProgressBar from '../../../../4_Elements/Signifiers/Axiomatic_Progress_Bar';
import useAxiomaticState from '../../../state/AxiomaticState';
import SchemaFormEngine from './SchemaFormEngine';
import Icons from '../../../../4_Atoms/IndraIcons';
import adapter from '../../../Sovereign_Adapter';
import { useFilterPrism } from '../../hooks/useFilterPrism'; // Ajustando ruta relativa

/**
 * VaultEngine: El Motor Maestro para Bóvedas de Datos (Drive, Notion, Files).
 * Implementa la semiótica de "Silo de Memoria" y "Escaneo de Profundidad".
 */
const VaultEngine = ({ data = {}, perspective = 'VAULT', slotId }) => {
    const { state, execute } = useAxiomaticStore();
    const globalLoading = useAxiomaticState(s => s.session.isLoading);
    const isDevLab = state.sovereignty.mode === 'DEV_LAB';

    // AXIOMA: Soberanía de Origen (Selector Interno)
    // AXIOMA: Soberanía de Origen (Descubrimiento Dinámico)
    const VAULT_SOURCES = React.useMemo(() => {
        const registry = state.genotype?.COMPONENT_REGISTRY || {};
        const discovered = Object.values(registry)
            .filter(node =>
                node.ARCHETYPE === 'VAULT' ||
                node.ARCHETYPE === 'ADAPTER' ||
                node.DOMAIN === 'STORAGE'
            )
            .map(node => ({
                id: node.id,
                label: node.LABEL || node.id,
                icon: node.id === 'drive' ? 'Vault' : (node.id === 'notion' ? 'List' : 'ADAPTER'),
                color: node.id === 'drive' ? '#4285F4' : '#6366F1'
            }));

        // Inyectamos fuentes virtuales y fallbacks canónicos
        const sources = [...discovered];
        if (!sources.find(s => s.id === 'drive')) sources.unshift({ id: 'drive', label: 'GDrive', icon: 'Vault', color: '#4285F4' });
        if (!sources.find(s => s.id === 'cosmos')) sources.push({ id: 'cosmos', label: 'Cosmos', icon: 'Cosmos', color: '#9C27B0' });

        return sources;
    }, [state.genotype?.COMPONENT_REGISTRY]);

    // AXIOMA: Soberanía de Identidad Sugerida. 
    // Priorizamos el ID que viene del contrato (data.id) sobre el valor por defecto.
    const initialSource = (data.id || 'drive').toLowerCase();
    const [activeSource, setActiveSource] = useState(initialSource);

    // AXIOMA: Consciencia del Cosmos (Distinción Cognitiva)
    // Obtenemos los IDs de los artefactos que YA están vinculados al Cosmos activo.
    const cosmosArtifacts = state.phenotype.artifacts || [];
    // Normalizamos a un Set para búsqueda O(1) y manejo de tipos (si son objetos o strings)
    const linkedIds = React.useMemo(() => new Set(
        Array.isArray(cosmosArtifacts) ? cosmosArtifacts.map(a => (typeof a === 'string' ? a : a.id)) : []
    ), [cosmosArtifacts]);

    const nodeId = activeSource.toLowerCase();
    const { label: statusLabel, progress, color: signifierColor, pulse } = useSignifier(nodeId);



    // 1. State Definitions (Axiomatic Refactor)
    const [command, setCommand] = useState('');
    const [viewMode, setViewMode] = useState('GRID');
    const [currentPath, setCurrentPath] = useState([{ id: 'ROOT', name: 'ROOT' }]);
    const [localScanning, setLocalScanning] = useState(false);
    const isScanning = localScanning || globalLoading;
    const [selectedNode, setSelectedNode] = useState(null);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [targetFolderId, setTargetFolderId] = useState('');
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [configSchema, setConfigSchema] = useState('ISK_ADAPTER_v1.0'); // Default schema for adapters/tools
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // AXIOMA: Soberanía de Identidad Dinámica
    const [accounts, setAccounts] = useState([]);
    const [activeAccount, setActiveAccount] = useState(null);

    // AXIOMA: Sincronización de Identidad Sugerida (Reacción al Cambio de Contexto)
    useEffect(() => {
        if (data.id && data.id.toLowerCase() !== activeSource) {
            setActiveSource(data.id.toLowerCase());
        }
    }, [data.id]);

    // [TASK: Account Discovery]
    useEffect(() => {
        const discoverAccounts = async () => {
            try {
                const result = await adapter.executeAction('tokenManager:listTokenAccounts', { provider: nodeId });
                if (Array.isArray(result)) {
                    setAccounts(result);
                    const defaultAcc = result.find(a => a.isDefault);
                    if (defaultAcc) setActiveAccount(defaultAcc.id);
                }
            } catch (e) {
                console.warn(`[VaultEngine] Discovery failed for ${nodeId}:`, e);
                setAccounts([]);
            }
        };
        discoverAccounts();

        setCurrentPath([{ id: 'ROOT', name: 'ROOT' }]);
        setSelectedNode(null);
        setCommand('');
    }, [nodeId]);

    // AXIOMA: Reconciliación de Identidad (Refresco ante cambio de cuenta)
    useEffect(() => {
        if (activeAccount && activeSource !== 'cosmos') {
            console.log(`[VaultEngine] Identity Shift Detected (${activeAccount}). Refreshing Silo...`);
            execute('FETCH_VAULT_CONTENT', {
                nodeId,
                folderId: currentPath[currentPath.length - 1].id,
                accountId: activeAccount,
                refresh: true
            });
        }
    }, [activeAccount]);


    // AXIOMA: Soberanía de Datos (ADR-010: Imperative Hydration + ADR-014: Pure State)
    // ÚNICA FUENTE DE VERDAD: state.phenotype.artifacts
    // AXIOMA: Recuperación y Aplanamiento de la Data (Prioridad: Props > Silo > Auto-Fetch)
    const rawSiloData = useMemo(() => {
        // 1. Prioridad: Data inyectada directamente (Mocks o Prefetch)
        const injectedData = data.items || data.results || data.rows || data.data?.items || data.data?.results;
        if (Array.isArray(injectedData)) return injectedData;

        // 2. Prioridad: Modo Cosmos (Grafo Local)
        if (activeSource === 'cosmos') return state.phenotype.artifacts || [];

        // 3. Prioridad: Silos de Memoria (Caché L1)
        const silo = state.phenotype.silos?.[nodeId];
        if (!silo) return [];
        if (Array.isArray(silo)) return silo;
        return silo.results || silo.items || silo.rows || [];
    }, [data, activeSource, state.phenotype.artifacts, state.phenotype.silos, nodeId]);

    // AXIOMA: Deduplicación Determinista (Prevención de Duplicate Keys)
    // Si el mismo ID aparece múltiples veces (bug de hidratación), GANAMOS el más reciente/completo.
    const siloData = React.useMemo(() => {
        // Filtrar zombies (artefactos marcados como borrados)
        const alive = rawSiloData.filter(item => !item._isDeleted);

        // Deduplicar por ID usando Map (mantiene el último encontrado)
        const deduped = Array.from(
            new Map(alive.map(item => [item.id, item])).values()
        );

        return deduped;
    }, [rawSiloData]);

    // AXIOMA: Integra Prisma de Filtrado (UseTransversalHook)
    const {
        data: filteredNodes,
        setSearchTerm,
        searchTerm,
        setFilter,
        activeFilters
    } = useFilterPrism(siloData, {
        searchKeys: ['name', 'LABEL', 'mimeType', 'type']  // Agregamos 'LABEL' para búsqueda de artefactos Cosmos
    });

    // AXIOMA: Sincronización de Comandos con Prisma
    useEffect(() => {
        if (!command.startsWith('/')) {
            setSearchTerm(command);
        }
    }, [command]);

    // AXIOMA: Si no hay ID, el componente está en "Limbo de Identidad".
    // No fallamos a 'drive' silenciosamente. Preferimos proyectar la verdad del error.
    if (!nodeId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[var(--bg-deep)] border border-[var(--error)]/30 rounded-2xl animate-in zoom-in duration-300">
                <div className="text-4xl mb-4">🚫</div>
                <h3 className="text-[var(--error)] font-bold text-lg mb-2 uppercase tracking-tighter">Identity_Corrupted</h3>
                <p className="text-[var(--text-dim)] text-xs text-center max-w-md font-mono mb-6">
                    Este motor de bóveda no ha recibido un ID de nodo válido desde el Core.
                    El sistema no puede determinar qué silo de datos proyectar.
                </p>
                <div className="bg-[var(--surface-header)] p-4 rounded-xl border border-[var(--border-subtle)] w-full max-w-md">
                    <span className="text-[9px] font-black text-[var(--accent)] uppercase block mb-2">Protocolo de Reparación:</span>
                    <ul className="text-[10px] text-[var(--text-soft)] space-y-2 list-disc pl-4">
                        <li>Verifica que el adaptador en <code className="text-[var(--accent)]">SystemAssembler.gs</code> esté decorado correctamente.</li>
                        <li>Asegúrate de que el campo <code className="text-[var(--accent)]">id</code> esté presente en el objeto <code className="text-[var(--accent)]">CANON</code>.</li>
                        <li>Ejecuta <code className="text-[var(--accent)]">clasp push</code> para sincronizar los cambios de identidad.</li>
                    </ul>
                </div>
            </div>
        );
    }

    // useEffect de hidratación de nodes eliminado (Soberanía Directa)

    // AXIOMA: Circuit Breaker para evitar bucles de "fetch-fail-retry"
    const ignitionRef = React.useRef(new Set());

    // AXIOMA: Recuperación de caché instantánea (Fat Client)
    useEffect(() => {
        const tryCacheRecall = async () => {
            if (activeSource === 'cosmos') return;
            const cacheKey = `vault_tree_ROOT`;
            if (persistenceManager.isCacheValid(nodeId, cacheKey)) {
                const cached = await persistenceManager.getCached(nodeId, cacheKey);
                if (cached && (!siloData || siloData.length === 0)) {
                    addLog(`⚛️ [Vault] Optimistic recall from L2 Repository: ${nodeId}`, 'SUCCESS');
                    execute('VAULT_LOAD_SUCCESS', { nodeId, data: { items: cached, metadata: { hydrationLevel: 100, source: 'CACHE' } } });
                }
            }
        };
        tryCacheRecall();
    }, [nodeId, activeSource]);

    useEffect(() => {
        // AXIOMA: Circuit Breaker y Bypass de Cosmos
        // No intentamos "fetchear" el Cosmos desde el backend; lo tenemos local.
        if (activeSource !== 'cosmos' && (!siloData || siloData.length === 0)) {
            // Solo disparamos si no estamos ya en un fetch global o local
            if (!globalLoading && !ignitionRef.current.has(nodeId)) {
                console.log(`[VaultEngine:${nodeId}] Silo empty. Triggering Ignition Discovery...`);
                ignitionRef.current.add(nodeId);
                execute('FETCH_VAULT_CONTENT', { nodeId, folderId: 'ROOT', accountId: activeAccount });
            }
        }
    }, [nodeId, siloData.length, globalLoading, activeSource]);

    const { LABEL, DOMAIN } = data;

    const addLog = (msg, type = 'INFO') => {
        execute('LOG_ENTRY', { time: new Date().toLocaleTimeString(), msg, type });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setLocalScanning(true);
            addLog(`Iniciando Escaneo Neural para: "${command}"...`);

            // AXIOMA: Búsqueda Inducida (Profundización Constante)
            // Si no es un comando de protocolo, disparamos búsqueda remota en el Core.
            if (command && !command.startsWith('/')) {
                execute('FETCH_VAULT_CONTENT', { nodeId, query: command, accountId: activeAccount });
            }


            // Usamos un timeout para simular latencia de escaneo y resetear UI
            setTimeout(() => setLocalScanning(false), 800);
        }
    };

    // SEMIOTIC INTERACTION:
    // Click -> Select (Focus)
    // Double Click -> Navigate (Drill Down)

    const handleNodeClick = (e, node) => {
        e.stopPropagation();
        setSelectedNode(node);
    };

    const handleNodeDoubleClick = (e, node) => {
        e.stopPropagation();
        if (node.type === 'DIRECTORY') {
            setLocalScanning(true);
            addLog(`Deep Scan Initiated: ${node.name}...`, 'INFO');

            // AXIOMA: Delegación en el Reactor (Axiomatic Store)
            // El store ya sabe si usar cache o ir a la red vía PersistenceManager.
            execute('FETCH_VAULT_CONTENT', {
                nodeId,
                folderId: node.id,
                accountId: activeAccount
            });

            setCurrentPath(prev => [...prev, { id: node.id, name: node.name }]);
            setTimeout(() => setLocalScanning(false), 500);
        } else if (node.type === 'DATABASE' || node.type === 'GRID' || node.mimeType?.includes('sheet')) {
            addLog(`Manifesting ${node.name} into Reality Engine...`, 'SUCCESS');
            // AXIOMA: Manifestación Directa.
            // AXIOMA: Identidad Imperativa (Pasaporte Soberano)
            // Se elimina el fallback heurístico. El origen es el activeSource actual.
            execute('SELECT_ARTIFACT', {
                ...node,
                LABEL: node.name,
                ARCHETYPES: ['DATABASE', 'VAULT'],
                ARCHETYPE: 'DATABASE',
                DOMAIN: 'DATABASE_L1',
                ORIGIN_SOURCE: activeSource,
                ACCOUNT_ID: activeAccount
            });

            // AXIOMA: Auto-Colapso de Interfaz. Si estamos en el panel, cerramos para ver la magia.
            if (activeSource === 'VAULT_GLOBAL' || state.phenotype.ui.vaultPanelOpen) {
                execute('TOGGLE_UI_PANEL', { panel: 'vault' });
            }
        } else {
            addLog(`Opening file: ${node.name} (Preview not available in Kernel)`, 'WARNING');
        }
    };

    const handleBackgroundClick = () => {
        setSelectedNode(null);
    };

    // --- ACCIONES REALES DEL INSPECTOR ---
    const handleDelete = async () => {
        if (!selectedNode) return;

        // AXIOMA: Kinetic Intent ya proporciona la confirmación física.
        // No interrumpimos el flujo con diálogos modales del navegador.
        addLog(`Eliminando ${selectedNode.name}...`, 'WARNING');
        await execute('DELETE_VAULT_ITEM', { nodeId, itemId: selectedNode.id, itemName: selectedNode.name });
        setSelectedNode(null);
    };

    const handleRename = async () => {
        if (!selectedNode || !newName.trim()) return;

        await execute('RENAME_VAULT_ITEM', { nodeId, itemId: selectedNode.id, newName: newName.trim() });
        setRenameModalOpen(false);
        setNewName('');
        setSelectedNode(null);
    };

    const handleMove = async () => {
        if (!selectedNode || !targetFolderId.trim()) return;

        await execute('MOVE_VAULT_ITEM', { nodeId, itemId: selectedNode.id, targetFolderId: targetFolderId.trim(), itemName: selectedNode.name });
        setMoveModalOpen(false);
        setTargetFolderId('');
        setSelectedNode(null);
    };

    const goToBreadcrumb = (index) => {
        const newPath = currentPath.slice(0, index + 1);
        const target = newPath[newPath.length - 1];

        setLocalScanning(true);
        addLog(`Reverting to: ${target.name}...`);

        execute('FETCH_VAULT_CONTENT', { nodeId, folderId: target.id === 'ROOT' ? 'ROOT' : target.id, accountId: activeAccount });
        setCurrentPath(newPath);
        setLocalScanning(false);
    };

    const handleDragStart = (e, node) => {
        // AXIOMA: Polimorfismo de Arquetipos
        // Si el objeto origen es una base de datos (Notion, SQL, etc),
        // forzamos su ARQUETIPO a 'DATABASE' para que el Graph Editor
        // lo renderice como un nodo de datos, no como un nodo genérico de fuente.
        const isDatabase = node.type === 'DATABASE' || node.type === 'GRID' || node.type === 'database';

        const payload = {
            ...node,
            ARCHETYPE: isDatabase ? 'DATABASE' : (node.ARCHETYPE || node.type || 'FILE'),
            ORIGIN_SOURCE: activeSource // Preservamos el origen (Notion, Drive) como metadato
        };

        e.dataTransfer.setData('indra/artifact', JSON.stringify(payload));
        addLog(`Initiating data drag: ${node.name} [Archetype: ${payload.ARCHETYPE}]`);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
    };

    const handleContextMenu = (e, node) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            node
        });
        setSelectedNode(node);
    };

    const handleBindToCosmos = (node) => {
        // AXIOMA: Enriquecimiento Semántico en el Punto de Manifestación
        const isDatabase =
            node.type === 'DATABASE' ||
            node.type === 'GRID' ||
            node.mimeType === 'application/vnd.indra.notion-db' ||
            node.mimeType?.includes('sheet');

        const enrichedNode = {
            ...node,
            LABEL: node.name,
            ARCHETYPE: isDatabase ? 'DATABASE' : (node.archetype || 'NODE'),
            DOMAIN: isDatabase ? 'DATA_ENGINE' : (node.DOMAIN || 'SYSTEM_VAULT'),
            ORIGIN_SOURCE: activeSource,
            ACCOUNT_ID: activeAccount,
            VITAL_SIGNS: isDatabase ? {
                'IO_CONSISTENCY': { value: 'NOMINAL', criticality: 'NOMINAL' },
                'HYDRATION': { value: 'PARTIAL', criticality: 'WARNING' }
            } : {}
        };
        execute('BIND_TO_COSMOS', { artifact: enrichedNode });

        // AXIOMA: Transmutación de Foco
        // Al vincular, saltamos a la pestaña de 'cosmos' para ver el éxito de la invocación.
        setActiveSource('cosmos');
    };

    const handleDefineArtifact = () => {
        setIsConfiguring(true);
        setContextMenu({ ...contextMenu, visible: false });
    };

    const handleCommitConfig = (formData) => {
        addLog(`Artifact defined: ${contextMenu.node.name}. Integrating into Cosmos...`, 'SUCCESS');
        execute('INTEGRATE_SMART_NODE', {
            baseNode: contextMenu.node,
            config: formData,
            schemaId: configSchema
        });
        setIsConfiguring(false);
        setContextMenu({ visible: false, x: 0, y: 0, node: null });
    };

    // --- INSPECTOR CONTEXTUAL (Panel Derecho) ---
    const renderInspector = () => {
        if (!selectedNode) {
            // ESTADO 0: Reposo (Global Folder Stats)
            return (
                <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-[var(--border-subtle)]">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Current Sector</span>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-vibrant)] truncate">
                            {currentPath[currentPath.length - 1].name}
                        </h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between text-[10px] font-mono text-[var(--text-dim)]">
                                <span>Status</span>
                                <span style={{ color: signifierColor }} className={pulse ? 'animate-pulse' : ''}>
                                    {statusLabel}
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-[var(--text-dim)] mt-2">
                                <span>Hydration</span>
                                <span>{progress}%</span>
                            </div>
                            <AxiomaticProgressBar nodeId={nodeId} />
                            <span className="text-[9px] font-mono text-[var(--text-dim)] opacity-50 block text-right">
                                {siloData.length} items projected
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] block mb-4">Quick Actions</span>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => addLog('Upload Protocol Initiated')} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all group">
                                <svg className="w-5 h-5 text-[var(--text-soft)] group-hover:text-[var(--accent)] group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="text-[9px] font-bold text-[var(--text-soft)]">UPLOAD</span>
                            </button>
                            <button onClick={() => execute('FETCH_VAULT_CONTENT', { nodeId, folderId: currentPath[currentPath.length - 1].id, refresh: true })} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all group">
                                <svg className="w-5 h-5 text-[var(--text-soft)] group-hover:text-[var(--accent)] group-hover:rotate-180 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-[9px] font-bold text-[var(--text-soft)]">SYNC</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // ESTADO 1: Selección Activa (Item Detail)
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/10">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shadow-lg">
                            <span className="text-4xl">
                                {selectedNode.type === 'DATABASE' || selectedNode.mimeType?.includes('sheet') ? '📊' : (selectedNode.type === 'DIRECTORY' ? '📂' : '📄')}
                            </span>
                        </div>
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-vibrant)] text-center break-words leading-tight mb-2">
                        {selectedNode.name}
                    </h3>
                    <div className="flex justify-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${selectedNode.type === 'DIRECTORY' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--text-dim)]/10 text-[var(--text-dim)]'}`}>
                            {selectedNode.type || 'FILE'}
                        </span>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] block mb-4">Meta Data</span>
                    <div className="space-y-4 font-mono text-[10px]">
                        <div className="flex justify-between border-b border-[var(--border-subtle)]/50 pb-2">
                            <span className="text-[var(--text-dim)]">Size</span>
                            <span className="text-[var(--text-soft)]">{selectedNode.raw?.size ? (selectedNode.raw.size / 1024).toFixed(1) + ' KB' : '--'}</span>
                        </div>
                        <div className="flex justify-between border-b border-[var(--border-subtle)]/50 pb-2">
                            <span className="text-[var(--text-dim)]">MIME</span>
                            <span className="text-[var(--text-soft)] truncate max-w-[120px]" title={selectedNode.mimeType}>{selectedNode.mimeType?.split('.').pop() || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between border-b border-[var(--border-subtle)]/50 pb-2">
                            <span className="text-[var(--text-dim)]">Updated</span>
                            <span className="text-[var(--text-soft)]">{new Date(selectedNode.lastUpdated).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] block mt-8 mb-4">Protocols</span>
                    <div className="space-y-2">
                        <button onClick={() => { setNewName(selectedNode.name); setRenameModalOpen(true); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-subtle)] transition-all text-left group">
                            <svg className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-[10px] font-bold text-[var(--text-soft)]">RENAME</span>
                        </button>
                        <button onClick={() => setMoveModalOpen(true)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-subtle)] transition-all text-left group">
                            <svg className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span className="text-[10px] font-bold text-[var(--text-soft)]">MOVE TO...</span>
                        </button>
                        <button onClick={handleDelete} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all text-left group mt-4">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="text-[10px] font-bold text-red-400">DELETE</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Perspectiva VAULT: Centro de Mando Completo (Soberanía de Almacén)
    if (perspective === 'VAULT' || perspective === 'BRIDGE' || perspective === 'STANDARD') {
        return (
            <BridgeChassis
                title="ALMACÉN DE ARTEFACTOS"
                domain="SYSTEM_VAULT"
                data={data}
                slotId={slotId}
                inspectorPanel={renderInspector()}
            >
                <div className="w-full h-full flex flex-col overflow-hidden relative">
                    {/* SELECTOR DE SOBERANÍA (Tabs Tácticas) */}
                    <nav className="flex items-center gap-1 p-2 bg-[var(--surface-header)] border-b border-[var(--border-subtle)] shrink-0 overflow-x-auto scrollbar-hide">
                        {VAULT_SOURCES.map(source => (
                            <button
                                key={source.id}
                                onClick={() => setActiveSource(source.id)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-widest
                                    ${activeSource === source.id
                                        ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]'
                                        : 'bg-transparent border-transparent text-[var(--text-dim)] hover:bg-[var(--surface-header)]'}
                                `}
                            >
                                {Icons[source.icon] && React.createElement(Icons[source.icon], { size: 10 })}
                                <span className={isSidebar ? 'hidden xs:inline' : 'inline'}>{source.label}</span>
                            </button>
                        ))}

                        {/* SELECTOR DE IDENTIDAD (Multi-Account Support) */}
                        {accounts.length > 0 && (
                            <div className="ml-auto flex items-center gap-2 px-3 border-l border-[var(--border-subtle)]">
                                <span className="text-[7px] font-black text-[var(--text-dim)] uppercase tracking-tighter">Identity:</span>
                                <select
                                    className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-[8px] font-mono text-[var(--accent)] outline-none cursor-pointer"
                                    value={activeAccount || ''}
                                    onChange={(e) => setActiveAccount(e.target.value)}
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.label} {acc.isDefault ? '(★)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => execute('SELECT_ARTIFACT', { id: 'IDENTITY_MANAGER', ARCHETYPE: 'IDENTITY', LABEL: 'Identity Manager', provider: activeSource })}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-all"
                                    title="Gestionar Cuentas"
                                >
                                    <Icons.Settings size={12} />
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* AXIOMA: Buscador Táctico (Visible por defecto) */}
                    {!data.hideSearch && (
                        <>
                            {/* BARRA DE BÚSQUEDA TÁCTICA */}
                            <div className="px-6 py-4 flex items-center gap-3 bg-[var(--surface-header)] shrink-0">
                                <div className="flex-1 relative group">
                                    <Icons.Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Escanear Bóveda..."
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-full pl-10 pr-4 py-2 text-[10px] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/30 transition-all shadow-inner"
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        onKeyDown={handleSearch}
                                    />
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`p-2 rounded-full border transition-all duration-300 ${isFilterOpen ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-[var(--surface-header)] border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}
                                    title="Filtros de Proyección"
                                >
                                    <Icons.Filter size={12} />
                                </button>
                                <button
                                    onClick={() => execute('FETCH_VAULT_CONTENT', { nodeId, folderId: currentPath[currentPath.length - 1].id, accountId: activeAccount, refresh: true })}
                                    className="p-2 rounded-full bg-[var(--surface-header)] border border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-all hover:rotate-180 duration-500"
                                >
                                    <Icons.Sync size={12} />
                                </button>
                            </div>

                            {/* PRISMA DE FILTRADO (UI Expansible) */}
                            {isFilterOpen && (
                                <div className="px-6 py-2 bg-[var(--surface-header)] border-b border-[var(--border-subtle)] flex flex-wrap gap-2 animate-in slide-in-from-top duration-200">
                                    {/* Botón Reset */}
                                    <button
                                        onClick={() => { clearFilters(); }}
                                        className="px-2 py-1 rounded-md border border-red-500/30 text-red-500 text-[8px] font-bold uppercase hover:bg-red-500/10"
                                    >
                                        PURGAR
                                    </button>

                                    {/* DRIVE FILTERS */}
                                    {(activeSource === 'drive' || activeSource === 'VAULT') && (
                                        <>
                                            <button
                                                onClick={() => setFilter('mimeType', (i) => i.mimeType?.includes('spreadsheet'))}
                                                className={`px-2 py-1 rounded-md border text-[8px] font-bold uppercase transition-all ${activeFilters['mimeType'] ? 'bg-green-500/20 border-green-500 text-green-600' : 'border-[var(--border-subtle)] text-[var(--text-dim)] hover:bg-[var(--surface-header)]'}`}
                                            >
                                                MATRICES (SHEETS)
                                            </button>
                                            <button
                                                onClick={() => setFilter('mimeType', (i) => i.mimeType?.includes('document'))}
                                                className={`px-2 py-1 rounded-md border text-[8px] font-bold uppercase transition-all ${activeFilters['mimeType'] ? 'bg-blue-500/20 border-blue-500 text-blue-600' : 'border-[var(--border-subtle)] text-[var(--text-dim)] hover:bg-[var(--surface-header)]'}`}
                                            >
                                                MANIFIESTOS (DOCS)
                                            </button>
                                        </>
                                    )}
                                    {/* LOCAL FILTERS */}
                                    {activeSource === 'local' && (
                                        <>
                                            <button
                                                onClick={() => setFilter('name', (i) => i.name?.toLowerCase().endsWith('.skp'))}
                                                className={`px-2 py-1 rounded-md border text-[8px] font-bold uppercase transition-all ${activeFilters['name'] ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600' : 'border-[var(--border-subtle)] text-[var(--text-dim)] hover:bg-[var(--surface-header)]'}`}
                                            >
                                                MOLDES (SKP)
                                            </button>
                                            <button
                                                onClick={() => setFilter('name', (i) => i.name?.toLowerCase().endsWith('.dwg'))}
                                                className={`px-2 py-1 rounded-md border text-[8px] font-bold uppercase transition-all ${activeFilters['name'] ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600' : 'border-[var(--border-subtle)] text-[var(--text-dim)] hover:bg-[var(--surface-header)]'}`}
                                            >
                                                PLANOS (DWG)
                                            </button>
                                        </>
                                    )}
                                    {/* COMMON FILTERS */}
                                    <button
                                        onClick={() => setFilter('type', 'DIRECTORY')}
                                        className={`px-2 py-1 rounded-md border text-[8px] font-bold uppercase transition-all ${activeFilters['type'] === 'DIRECTORY' ? 'bg-amber-500/20 border-amber-500 text-amber-600' : 'border-[var(--border-subtle)] text-[var(--text-dim)] hover:bg-[var(--surface-header)]'}`}
                                    >
                                        CONTENEDORES
                                    </button>
                                    <button
                                        onClick={() => setFilter('type', (i) => i.type !== 'DIRECTORY')}
                                        className={`px-2 py-1 rounded-md border text-[8px] font-bold uppercase transition-all ${activeFilters['type'] && activeFilters['type'] !== 'DIRECTORY' ? 'bg-purple-500/20 border-purple-500 text-purple-600' : 'border-[var(--border-subtle)] text-[var(--text-dim)] hover:bg-[var(--surface-header)]'}`}
                                    >
                                        ENTIDADES
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* BREADCRUMBS DE PROFUNDIDAD */}
                    <div className="px-6 py-2 border-b border-[var(--border-subtle)] flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-[var(--surface-header)]">
                        {currentPath.map((path, idx) => (
                            <React.Fragment key={path.id}>
                                <button
                                    onClick={() => goToBreadcrumb(idx)}
                                    className={`text-[8px] font-black uppercase tracking-widest hover:text-[var(--accent)] transition-all ${idx === currentPath.length - 1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-dim)]'}`}
                                >
                                    {path.name}
                                </button>
                                {idx < currentPath.length - 1 && <span className="text-[var(--text-dim)] opacity-30 text-[8px]">/</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* REJILLA DE PROYECCIÓN (CONTENIDO) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6" onClick={handleBackgroundClick}>
                        <div className={`grid gap-4 ${isSidebar ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'}`}>
                            {filteredNodes.length > 0 ? (
                                filteredNodes.map(node => {
                                    const isLinked = linkedIds.has(node.id);
                                    const isDatabase = node.type === 'DATABASE' || node.mimeType?.includes('sheet');
                                    const isFolder = node.type === 'DIRECTORY';

                                    // ESTILOS COGNITIVOS: Distinción visual inmediata
                                    const cognitiveStyle = isLinked
                                        ? 'opacity-100 scale-100 ring-1 ring-[var(--accent)]/50'
                                        : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.02]';

                                    const typeColorClass = isFolder ? 'hover:border-amber-500/30' : (isDatabase ? 'hover:border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.05)]' : 'hover:border-blue-500/30');

                                    return (
                                        <div
                                            key={node.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, node)}
                                            onDragEnd={handleDragEnd}
                                            onClick={(e) => handleNodeClick(e, node)}
                                            onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
                                            onContextMenu={(e) => handleContextMenu(e, node)}
                                            className={`
                                                group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center text-center
                                                ${cognitiveStyle} ${typeColorClass}
                                                ${selectedNode?.id === node.id
                                                    ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 shadow-2xl !opacity-100 !grayscale-0 !scale-105'
                                                    : 'bg-[var(--surface-card)] border-[var(--border-subtle)] hover:bg-[var(--surface-header)]'}
                                                ${isSidebar ? 'flex-row text-left !items-start !text-left p-3' : 'flex-col'}
                                            `}
                                        >
                                            {/* Indicador de Vínculo (Punto Cuántico) */}
                                            {isLinked && (
                                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--accent)] rounded-full shadow-[0_0_5px_var(--accent)] z-10"></div>
                                            )}

                                            <div className={`${isSidebar ? 'w-8 h-8 mr-3' : 'w-12 h-12 mb-3'} rounded-xl bg-[var(--surface-header)] flex items-center justify-center text-xl group-hover:scale-110 transition-all duration-500 shadow-inner shrink-0`}>
                                                {node.type === 'DIRECTORY' ? (
                                                    <span className="text-amber-500">📂</span>
                                                ) : (node.type === 'DATABASE' || node.mimeType?.includes('sheet') ? (
                                                    <Icons.Database size={24} color="var(--accent)" />
                                                ) : (
                                                    <span className="text-blue-500">📄</span>
                                                ))}
                                            </div>
                                            <div className="flex flex-col flex-1 overflow-hidden">
                                                <span className="text-[10px] font-bold text-[var(--text-primary)] truncate w-full break-words group-hover:text-[var(--accent)]">
                                                    {node.name}
                                                </span>
                                                <span className={`text-[7px] font-mono uppercase mt-0.5 tracking-tighter opacity-60 ${node.type === 'DATABASE' || node.mimeType?.includes('sheet') ? 'text-[var(--accent)] font-black' : 'text-[var(--text-dim)]'}`}>
                                                    {node.mimeType?.includes('sheet') ? 'SPREADSHEET' : (node.type || 'FILE')}
                                                </span>
                                            </div>

                                            {/* BOTÓN DE MANIFESTACIÓN RÁPIDA (Hover) */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBindToCosmos(node); }}
                                                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[var(--accent)] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-20"
                                                title="Manifestar en Cosmos"
                                            >
                                                <Icons.Plus size={12} />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-[var(--text-dim)] space-y-4">
                                    <Icons.Inbox size={48} className="opacity-10" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Empty_Vector</span>
                                    <button
                                        onClick={() => execute('FETCH_VAULT_CONTENT', { nodeId, folderId: 'ROOT', refresh: true })}
                                        className="mt-4 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full text-[9px] font-mono hover:bg-[var(--accent)] hover:text-black transition-colors"
                                    >
                                        FORZAR_SINCRONIZACIÓN
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>


                    {isConfiguring && (
                        <div className="absolute inset-0 z-[110] bg-black/90 backdrop-blur-xl flex flex-col p-8 sm:p-12 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-2xl">
                                        🧬
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--text-vibrant)]">Define Smart Artifact</h2>
                                        <p className="text-xs text-[var(--text-dim)] font-mono">Transforming: {contextMenu.node?.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsConfiguring(false)}
                                    className="p-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-dim)]"
                                >
                                    <Icons.Close size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-8 max-w-2xl mx-auto w-full shadow-2xl">
                                <SchemaFormEngine
                                    schemaId={configSchema}
                                    onCommit={handleCommitConfig}
                                    onCancel={() => setIsConfiguring(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </BridgeChassis >
        );
    }

    // Perspectiva WIDGET: Herramienta Quirúrgica Compacta (Inyector)
    if (perspective === 'WIDGET') {
        return (
            <div className="w-full bg-[var(--bg-glass)] border border-[var(--border-vibrant)] rounded-2xl p-4 backdrop-blur-xl shadow-xl animate-in slide-in-from-right duration-500 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]/20"></div>

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
                    <span className="text-[10px] font-black text-[var(--accent)] tracking-[0.2em] uppercase">{LABEL}</span>
                    <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse shadow-[0_0_8px_var(--success)]"></div>
                </div>

                <div className="space-y-1.5">
                    {siloData.slice(0, 3).map(node => (
                        <div
                            key={node.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, node)}
                            className="flex items-center gap-3 p-2.5 bg-[var(--bg-secondary)]/30 border border-transparent hover:border-[var(--accent)]/30 rounded-xl cursor-grab active:cursor-grabbing transition-all group hover:bg-[var(--bg-secondary)]/50"
                        >
                            <span className="text-xs opacity-50">{node.type === 'DIRECTORY' ? '📂' : '📄'}</span>
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="text-[10px] font-mono text-[var(--text-soft)] group-hover:text-[var(--text-vibrant)] truncate">
                                    {node.name}
                                </span>
                                <span className={`text-[8px] font-mono uppercase opacity-50 ${node.type === 'DIRECTORY' ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}>
                                    {node.type || 'FILE'}
                                </span>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-[var(--accent)] transition-opacity uppercase tracking-widest bg-[var(--accent)]/10 px-2 py-1 rounded-lg border border-[var(--accent)]/20">
                                Inject
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-3">
                    <div className="flex-1 h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-[var(--accent)]/5 via-[var(--accent)] to-[var(--accent)]/5 animate-loading-bar"></div>
                    </div>
                    <span className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-tighter">Ready_Link</span>
                </div>
            </div>
        );
    }

    return null;
};

export default VaultEngine;



