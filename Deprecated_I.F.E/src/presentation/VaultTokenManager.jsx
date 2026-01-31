import React, { useState, useEffect, useMemo } from 'react';
import { VaultManager } from '../core/vault/VaultManager';
import { useCoreStore } from '../core/state/CoreStore';
import { OntologyService } from '../core/integrity/OntologyService';
import { ShieldCheck, Key, Trash2, Plus, AlertCircle, RefreshCw, Smartphone, BrainCircuit, Database, Box } from 'lucide-react';

/**
 * 🔒 Identity Hub (Dynamic V3.0)
 * Architecture: Sovereign Credential Discovery.
 * Axiom: Each adapter exposes its own identity requirement.
 */
const VaultTokenManager = () => {
    const { contracts, addLog } = useCoreStore();
    const [tokens, setTokens] = useState({});
    const [newProvider, setNewProvider] = useState('');
    const [newToken, setNewToken] = useState('');
    const [status, setStatus] = useState({ type: null, message: '' });

    // 🧬 Discovery Engine: Find all adapters that could require tokens
    const DISCOVERED_PROVIDERS = useMemo(() => {
        const adapters = Object.entries(contracts || {})
            .filter(([_, meta]) => meta.archetype === 'ADAPTER')
            .map(([id, meta]) => {
                const archetypeMeta = OntologyService.getArchetype('ADAPTER');
                return {
                    id: id.toLowerCase(), // canonical ID
                    label: meta.label || id,
                    icon: archetypeMeta.icon || Box,
                    color: archetypeMeta.color
                };
            });

        // Ensure core providers are always available as fallback
        const base = [
            { id: 'groq', label: 'Groq_LPU', icon: BrainCircuit, color: '#f55036' },
            { id: 'gemini', label: 'Google_Gemini', icon: BrainCircuit, color: '#4285f4' }
        ];

        // Deduplicate
        const unique = [...base];
        adapters.forEach(a => {
            if (!unique.find(u => u.id === a.id)) unique.push(a);
        });

        return unique.sort((a, b) => a.label.localeCompare(b.label));
    }, [contracts]);

    useEffect(() => {
        setTokens(VaultManager.getAllTokens());
        if (DISCOVERED_PROVIDERS.length > 0 && !newProvider) {
            setNewProvider(DISCOVERED_PROVIDERS[0].id);
        }
    }, [DISCOVERED_PROVIDERS]);

    const handleAddToken = () => {
        if (!newToken.trim()) return;
        try {
            VaultManager.setToken(newProvider, { apiKey: newToken.trim(), timestamp: Date.now() });
            setTokens(VaultManager.getAllTokens());
            setNewToken('');
            setStatus({ type: 'success', message: `${newProvider.toUpperCase()} SECURED` });
            addLog('success', `IDENTITY >> Key for ${newProvider} secured in local vault.`);
            setTimeout(() => setStatus({ type: null, message: '' }), 3000);
        } catch (e) {
            setStatus({ type: 'error', message: 'VAULT_ENCRYPTION_FAIL' });
            addLog('error', `IDENTITY >> Encryption Failure: ${e.message}`);
        }
    };

    const handleDeleteToken = (provider) => {
        if (VaultManager.deleteToken(provider)) {
            setTokens(VaultManager.getAllTokens());
            addLog('warn', `IDENTITY >> Key for ${provider} purged from vault.`);
        }
    };

    return (
        <div className="identity-hub flex flex-col h-full bg-transparent overflow-hidden font-sans border-none">
            <header className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={14} className="text-accent-primary pulsing" />
                    <span className="mono-bold text-[10px] uppercase tracking-[0.4em] text-white/90">Identity_Vault</span>
                </div>
                <div className="mono text-[8px] opacity-20 uppercase tracking-widest">Zero_Log_Handshake</div>
            </header>

            {/* --- ACTIVE IDENTITIES --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-3 bg-black/10">
                {Object.keys(tokens).length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10 gap-6 text-center border border-dashed border-white/5 rounded-sm p-10">
                        <Key size={48} strokeWidth={1} />
                        <div className="flex flex-col gap-2">
                            <span className="mono-bold text-[10px] uppercase tracking-[0.5em]">Clinical_Empty</span>
                            <p className="mono text-[8px] uppercase tracking-widest leading-relaxed">No sovereign identities found.<br />Inject a secret token below to authorize agents.</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(tokens).map(([provider, data]) => {
                        const meta = DISCOVERED_PROVIDERS.find(p => p.id === provider) || { label: provider, icon: Key, color: '#666' };
                        return (
                            <div key={provider} className="identity-card p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group rounded-sm shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-sm bg-black/60 border border-white/10 shadow-inner">
                                            {React.createElement(meta.icon, { size: 14, style: { color: meta.color } })}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="mono-bold text-[11px] uppercase tracking-[0.2em] text-white/80">{meta.label}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent-success pulsing" />
                                                <span className="mono text-[8px] opacity-30 uppercase">Vault_Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteToken(provider)}
                                        className="p-2 opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- AUTH INJECTION FORM --- */}
            <div className="p-6 border-t border-white/10 bg-black/60 backdrop-blur-3xl">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="mono text-[8px] opacity-30 uppercase tracking-[0.2em]">Select_Core_Adapter</label>
                        <select
                            value={newProvider}
                            onChange={(e) => setNewProvider(e.target.value)}
                            className="bg-white/5 border border-white/10 p-3 mono text-[11px] w-full outline-none text-white focus:border-accent-primary/40 transition-all cursor-pointer"
                        >
                            {DISCOVERED_PROVIDERS.map(p => <option key={p.id} value={p.id} className="bg-zinc-950">{p.label.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="mono text-[8px] opacity-30 uppercase tracking-[0.2em]">Axiomatic_Secret_Token</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                placeholder="PASTE_KEY_HERE..."
                                value={newToken}
                                onChange={(e) => setNewToken(e.target.value)}
                                className="bg-black/40 border border-white/10 p-3 mono text-[11px] flex-1 outline-none focus:border-accent-primary text-white transition-all shadow-inner"
                            />
                            <button
                                onClick={handleAddToken}
                                disabled={!newToken.trim()}
                                className="px-6 bg-accent-primary text-black mono-bold text-[10px] uppercase tracking-[0.4em] hover:brightness-125 transition-all active:scale-[0.98] border-none disabled:opacity-20 cursor-pointer shadow-[0_0_20px_rgba(0,255,170,0.2)]"
                            >
                                Secure
                            </button>
                        </div>
                    </div>

                    {status.message && (
                        <div className={`mt-2 text-[9px] mono-bold uppercase text-center animate-bounce ${status.type === 'error' ? 'text-red-500' : 'text-accent-primary'}`}>
                            [{status.message}]
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VaultTokenManager;
