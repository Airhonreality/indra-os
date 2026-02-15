/**
 * CAPA 2: ENGINES
 * CommunicationEngine.jsx
 * DHARMA: Arquetipo Soberano de Comunicación Unificada (Mail + Chat).
 * AXIOMA: "El mensaje es el medio, la forma es relativa."
 * 
 * PROPÓSITO: Proyectar interfaces de diálogo (Sincrónico/Asincrónico) yuxtapuestas.
 */
import React, { useState, useEffect } from 'react';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';

import { injectAxiomaticMock } from '../../../state/Infrastructure/AxiomaticMocks';

const CommunicationEngine = ({ data }) => {
    const { state, execute } = useAxiomaticStore();
    const { LABEL, ARCHETYPE: initialArchetype, DOMAIN, id: nodeId } = data;
    const { adapter } = state.sovereignty;

    // AXIOMA: Soberanía de Origen (Descubrimiento Dinámico de Canales)
    const COMM_SOURCES = React.useMemo(() => {
        const registry = state.genotype?.COMPONENT_REGISTRY || {};
        return Object.values(registry)
            .filter(node =>
                node.ARCHETYPE === 'COMMUNICATION' ||
                node.ARCHETYPE === 'MAIL' ||
                node.ARCHETYPE === 'MESSAGING' ||
                node.DOMAIN === 'COMMUNICATION'
            )
            .map(node => ({
                id: node.id,
                label: node.LABEL || node.id,
                icon: node.ARCHETYPE === 'MAIL' ? 'Inbox' : 'MessageCircle', // Usamos nombres de iconos aproximados
                archetype: node.ARCHETYPE
            }));
    }, [state.genotype?.COMPONENT_REGISTRY]);

    // ESTADO DE IDENTIDAD Y SELECCIÓN
    const [activeSource, setActiveSource] = useState(nodeId || (COMM_SOURCES[0]?.id || 'gmail'));
    const [accounts, setAccounts] = useState([]);
    const [activeAccount, setActiveAccount] = useState(null);
    const [loading, setLoading] = useState(false);


    // ESTADO POLIMÓRFICO: Modo de Vista (Mail vs Chat)
    // Por defecto: Si es MAIL, usa 'INBOX'. Si es MESSAGING, usa 'CHAT'. Unificado usa 'SPLIT'.
    const defaultMode = (ARCHETYPE === 'MAIL') ? 'INBOX' : (ARCHETYPE === 'MESSAGING') ? 'CHAT' : 'SPLIT';
    const [viewMode, setViewMode] = useState(defaultMode);

    // ESTADO DE CONTENIDO (Honest Empty State)
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [inputBuffer, setInputBuffer] = useState('');

    // AXIOMA: Descubrimiento de Identidades por Canal
    useEffect(() => {
        const discoverAccounts = async () => {
            if (!activeSource) return;
            try {
                const result = await adapter.executeAction('tokenManager:listTokenAccounts', { provider: activeSource });
                if (Array.isArray(result)) {
                    setAccounts(result);
                    const defaultAcc = result.find(a => a.isDefault) || result[0];
                    if (defaultAcc) setActiveAccount(defaultAcc.id);
                }
            } catch (e) {
                console.warn(`[CommunicationEngine] Discovery failed for ${activeSource}:`, e);
                setAccounts([]);
            }
        };
        discoverAccounts();
    }, [activeSource]);

    // AXIOMA: Reificación de Hilos (Threads)
    useEffect(() => {
        if (activeAccount && activeSource) {
            execute('FETCH_COMMUNICATION_CONTENT', { nodeId: activeSource, accountId: activeAccount });
        }
    }, [activeAccount, activeSource]);

    // AXIOMA: Consumo de Silo (Caché L1)
    useEffect(() => {
        const siloData = state.phenotype.silos?.[activeSource];
        if (siloData) {
            const items = Array.isArray(siloData) ? siloData : (siloData.items || siloData.results || []);
            setThreads(items.map(item => ({
                id: item.id,
                sender: item.raw?.from || 'Unknown',
                subject: item.name || 'No Subject',
                preview: item.raw?.snippet || '',
                time: item.lastUpdated ? new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
                unread: item.raw?.isUnread || false,
                type: (initialArchetype === 'MAIL' || item.mimeType === 'message/rfc822') ? 'MAIL' : 'CHAT'
            })));
        }
    }, [state.phenotype.silos, activeSource]);



    // RENDERIZADO DE BARRA LATERAL (Hub de Comunicación)
    const Sidebar = () => (
        <div className="w-1/3 min-w-[280px] border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 flex flex-col">
            {/* TABS DE CANALES */}
            <div className="flex bg-[var(--surface-header)] border-b border-[var(--border-subtle)] overflow-x-auto scrollbar-hide shrink-0">
                {COMM_SOURCES.map(source => (
                    <button
                        key={source.id}
                        onClick={() => setActiveSource(source.id)}
                        className={`px-3 py-2 text-[8px] font-black uppercase tracking-tighter border-b-2 transition-all ${activeSource === source.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-dim)]'}`}
                    >
                        {source.label}
                    </button>
                ))}
            </div>

            {/* SELECTOR DE IDENTIDAD */}
            {accounts.length > 0 && (
                <div className="p-2 bg-[var(--bg-primary)]/40 border-b border-[var(--border-subtle)] flex items-center gap-2">
                    <span className="text-[7px] font-bold text-[var(--text-dim)] uppercase">Account:</span>
                    <select
                        className="flex-1 bg-transparent border-none text-[9px] font-mono text-[var(--accent)] outline-none cursor-pointer"
                        value={activeAccount || ''}
                        onChange={(e) => setActiveAccount(e.target.value)}
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="bg-[var(--bg-deep)]">
                                {acc.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                    {activeSource?.toUpperCase() || 'INBOX'}
                </span>

                <span className="text-[9px] font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">
                    {threads.filter(t => t.unread).length} NEW
                </span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {threads.map(thread => (
                    <button
                        key={thread.id}
                        onClick={() => setActiveThread(thread)}
                        className={`w-full text-left p-3 border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-secondary)] transition-colors flex gap-3 ${activeThread?.id === thread.id ? 'bg-[var(--accent)]/10 border-l-2 border-l-[var(--accent)]' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${thread.type === 'MAIL' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                            {thread.sender[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className={`text-[11px] font-bold truncate ${thread.unread ? 'text-[var(--text-vibrant)]' : 'text-[var(--text-soft)]'}`}>
                                    {thread.sender}
                                </span>
                                <span className="text-[9px] font-mono text-[var(--text-dim)] shrink-0">{thread.time}</span>
                            </div>
                            <div className="text-[10px] text-[var(--text-dim)] truncate">
                                {thread.subject}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // RENDERIZADO DE VISOR PRINCIPAL (Polimórfico)
    const MainViewer = () => {
        if (!activeThread) return (
            <div className="flex-1 flex items-center justify-center text-[var(--text-dim)] italic text-xs">
                Select a conversation to begin transmission.
            </div>
        );

        const isChat = activeThread.type === 'CHAT' || viewMode === 'CHAT';

        return (
            <div className="flex-1 flex flex-col bg-[var(--bg-deep)]">
                {/* Header Contextual */}
                <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isChat ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <span className="font-bold text-sm text-[var(--text-vibrant)]">{activeThread.sender}</span>
                    <span className="ml-auto text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-wider border border-[var(--border-subtle)] px-2 py-0.5 rounded">
                        {isChat ? 'INSTANT_MESSAGING' : 'EMAIL_PROTOCOL'}
                    </span>
                </div>

                {/* Cuerpo del Mensaje / Chat Log */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {/* Placeholder content - simulating history */}
                    <div className="flex flex-col gap-2">
                        <div className={`self-start max-w-[80%] p-3 rounded-xl rounded-tl-none ${isChat ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)]'}`}>
                            <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                                {isChat ? activeThread.preview : `Subject: ${activeThread.subject}\n\n${activeThread.preview}\n\n[Full content loaded from server...]`}
                            </p>
                            <span className="text-[8px] text-[var(--text-dim)] mt-1 block opacity-60">
                                {activeThread.time}
                            </span>
                        </div>
                        {/* Simulación de Respuesta Propia */}
                        <div className="self-end max-w-[80%] p-3 rounded-xl rounded-tr-none bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                            <p className="text-xs text-[var(--text-soft)] leading-relaxed">System Acknowledged.</p>
                            <span className="text-[8px] text-[var(--text-dim)] mt-1 block opacity-60 text-right">
                                10:05 AM
                            </span>
                        </div>
                    </div>
                </div>

                {/* Input Area (Unificado) */}
                <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-soft)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-dim)] placeholder:italic"
                            placeholder={isChat ? "Type a message..." : "Reply via email..."}
                            value={inputBuffer}
                            onChange={(e) => setInputBuffer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && inputBuffer.trim()) {
                                    // Simular envío
                                    console.log(`[CommunicationEngine] Sending: ${inputBuffer}`);
                                    setInputBuffer('');
                                    execute('LOG_ACTION', { type: 'MESSAGE_SENT', payload: inputBuffer });
                                }
                            }}
                        />
                        <button className="px-4 py-2 bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-95 transition-all">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-[var(--indra-glass-bg)] backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-[var(--indra-glass-border)] animate-in fade-in zoom-in-95 duration-300">
            <Sidebar />
            <MainViewer />
        </div>
    );
};

export default CommunicationEngine;



