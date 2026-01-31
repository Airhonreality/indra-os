import React, { useState, useEffect } from 'react';
import { Send, BrainCircuit, FileCode, MessageSquare, MonitorCheck, Trash2 } from 'lucide-react';
import ScenarioService from '../core/integrity/ScenarioService';
import CoreBridge from '../core/bridge/CoreBridge';
import IntelligenceService from '../core/integrity/IntelligenceService';
import { useCoreStore } from '../core/state/CoreStore';
import StateMonitor from './StateMonitor';

/**
 * 🧠 IntelligencePanel: The Cognitive Architect (V2.2 Refined)
 * Architecture: Internal Mode Switching (Cortex | Manifest | State).
 * Axiom: Assistant for logical projection and verification.
 */
const IntelligencePanel = ({ mode = 'full' }) => {
    const [activeSubTab, setActiveSubTab] = useState('CHAT'); // 'CHAT', 'JSON', 'STATE'
    const [prompt, setPrompt] = useState('');
    const {
        messages, addMessage, clearMessages,
        manifestJson, setManifestJson,
        isThinking, setIsThinking,
        nodes, flows,
        lastUsedModel, setLastUsedModel
    } = useCoreStore();

    const [selectedModel, setSelectedModel] = useState(lastUsedModel || 'llama-3.3-70b-versatile');

    // Sync sub-tab if manifest generated
    useEffect(() => {
        if (manifestJson && activeSubTab === 'CHAT') {
            // Optional: don't auto-switch as it might be annoying, but keep as option
        }
    }, [manifestJson]);

    const handleSendPrompt = async () => {
        if (!prompt.trim() || !selectedModel) return;

        addMessage({ role: 'user', text: prompt });
        setPrompt('');
        setIsThinking(true);

        const currentFlow = { nodes, connections: flows?.connections || [] };

        try {
            const result = await IntelligenceService.ask(prompt, selectedModel, 'default', currentFlow, messages);
            addMessage({ role: 'assistant', text: result.text });

            if (result.commandDetected) {
                const scenario = {
                    name: result.payload.name || `AI_PROJECTION_${Date.now()}`,
                    nodes: result.payload.nodes,
                    connections: result.payload.connections
                };
                setManifestJson(JSON.stringify(scenario, null, 2));
                if (result.commandName === 'INJECT_LOGIC') {
                    ScenarioService.injectScenario(scenario, true);
                }
            }
        } catch (error) {
            addMessage({ role: 'assistant', text: `ERROR: ${error.message}` });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="intelligence-panel flex flex-col h-full bg-transparent overflow-hidden font-sans border-none">
            {/* 📑 INTERNAL SUB-TABS (Handled carefully for interaction) */}
            <nav className="flex items-center border-b border-white/5 bg-white/[0.02]">
                {[
                    { id: 'CHAT', icon: MessageSquare, label: 'Cortex' },
                    { id: 'JSON', icon: FileCode, label: 'Manifest' },
                    { id: 'STATE', icon: MonitorCheck, label: 'State' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSubTab(tab.id); }}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all border-none outline-none cursor-pointer ${activeSubTab === tab.id
                                ? 'bg-white/5 text-accent-primary opacity-100 shadow-[inset_0_-2px_0_var(--accent-primary)]'
                                : 'bg-transparent opacity-20 hover:opacity-100'
                            }`}
                    >
                        <tab.icon size={12} className={activeSubTab === tab.id ? 'pulsing' : ''} />
                        <span className="mono-bold text-[9px] uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className="flex-1 overflow-hidden relative bg-black/20">
                {/* 🤖 CHAT VIEW */}
                <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${activeSubTab === 'CHAT' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar bg-transparent">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                                <BrainCircuit size={48} strokeWidth={1} />
                                <span className="mono-bold text-[9px] uppercase tracking-[0.6em]">Neural_Link_Standby</span>
                                <p className="mono text-[8px] opacity-40 uppercase tracking-widest text-center max-w-[220px]">Awaiting logical directive to begin spatial projection</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`p-4 rounded-sm mono text-[10px] max-w-[90%] leading-relaxed border ${m.role === 'user'
                                    ? 'self-end bg-accent-primary/5 text-accent-primary border-accent-primary/10'
                                    : 'self-start bg-white/[0.03] border-white/5 text-white/80'
                                }`}>
                                <div className="flex items-center gap-2 mb-2 opacity-50">
                                    <span className="mono-bold text-[8px] uppercase tracking-widest">[{m.role === 'user' ? 'AUTHORITY' : 'ARCHITECT'}]</span>
                                </div>
                                {m.text}
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex items-center gap-3 pl-2 opacity-40">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary pulsing" />
                                <span className="mono text-[9px] uppercase tracking-[0.2em] font-black">Architect_is_reasoning...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-black/40 border-t border-white/5 flex flex-col gap-3 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <select
                                value={selectedModel}
                                onChange={(e) => { setSelectedModel(e.target.value); setLastUsedModel(e.target.value); }}
                                className="bg-transparent border-none p-1 text-[9px] mono opacity-30 hover:opacity-100 focus:opacity-100 outline-none text-white cursor-pointer transition-opacity"
                            >
                                <option value="llama-3.3-70b-versatile">llama-3.3-70b (Axiom)</option>
                                <option value="gemini-2.0-flash">gemini-2.0-flash (Hybrid)</option>
                            </select>
                            <button onClick={clearMessages} className="opacity-20 hover:opacity-100 transition-opacity p-1 bg-transparent border-none">
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                                placeholder="INJECT_DIRECTIVE..."
                                className="flex-1 bg-white/5 border border-white/10 p-3 mono text-[11px] outline-none placeholder:opacity-20 text-white focus:border-accent-primary/20 transition-all"
                            />
                            <button
                                onClick={handleSendPrompt}
                                disabled={isThinking || !prompt.trim()}
                                className="px-5 bg-accent-primary text-black border-none hover:brightness-125 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 📜 MANIFEST VIEW */}
                <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${activeSubTab === 'JSON' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                    <div className="flex-1 overflow-hidden p-0 relative">
                        <div className="absolute top-4 left-4 z-10 mono text-[8px] opacity-20 uppercase tracking-widest pointer-events-none">Manifest_Projection</div>
                        <textarea
                            className="absolute inset-0 w-full h-full bg-black/40 p-6 pt-10 mono text-[10px] text-accent-success/80 border-none outline-none resize-none custom-scrollbar leading-relaxed"
                            value={manifestJson}
                            onChange={(e) => setManifestJson(e.target.value)}
                            spellCheck={false}
                            placeholder="// Logical fragments will appear here upon AI generation..."
                        />
                    </div>
                    {manifestJson && (
                        <footer className="p-4 border-t border-white/10 bg-black/60">
                            <button
                                onClick={() => ScenarioService.injectScenario(JSON.parse(manifestJson))}
                                className="w-full bg-accent-primary text-black py-3.5 mono-bold text-[10px] uppercase tracking-[0.3em] transition-all border-none cursor-pointer hover:shadow-[0_0_20px_rgba(0,255,170,0.3)]"
                            >
                                REIFY_STATED_PROJECTION
                            </button>
                        </footer>
                    )}
                </div>

                {/* 👁️ STATE MONITOR VIEW */}
                <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${activeSubTab === 'STATE' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                    <StateMonitor />
                </div>
            </main>
        </div>
    );
};

export default IntelligencePanel;
