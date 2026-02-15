import React, { useState, useEffect } from 'react';
import { useAxiomaticStore } from '../../../state/AxiomaticStore';
import { Icons } from '../../../../4_Atoms/IndraIcons';
import SchemaFormEngine from './SchemaFormEngine';

/**
 * IdentityEngine.jsx
 * DHARMA: Gestor de Soberanía de Credenciales (L1).
 * AXIOMA: "Tu identidad es tu acceso a la realidad."
 */
const IdentityEngine = ({ data }) => {
    const { state, execute } = useAxiomaticStore();
    const { adapter } = state.sovereignty;

    const [providers, setProviders] = useState([]);
    const [activeProvider, setActiveProvider] = useState(data?.provider || 'drive');
    const [accounts, setAccounts] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Descubrimiento de Proveedores
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const result = await adapter.executeAction('tokenManager:listTokenProviders', {});
                if (Array.isArray(result)) setProviders(result);
            } catch (e) {
                console.error("Failed to fetch providers", e);
            }
        };
        fetchProviders();
    }, []);

    // 2. Descubrimiento de Cuentas por Proveedor
    const refreshAccounts = async () => {
        if (!activeProvider) return;
        setIsLoading(true);
        try {
            const result = await adapter.executeAction('tokenManager:listTokenAccounts', { provider: activeProvider });
            if (Array.isArray(result)) setAccounts(result);
        } catch (e) {
            console.error("Failed to fetch accounts", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshAccounts();
    }, [activeProvider]);

    const handleDelete = async (accountId) => {
        if (!window.confirm(`¿Estás seguro de eliminar la cuenta ${accountId}?`)) return;
        try {
            await adapter.executeAction('tokenManager:deleteToken', { provider: activeProvider, accountId });
            execute('LOG_ENTRY', { msg: `Identidad ${accountId} eliminada de ${activeProvider}`, type: 'SUCCESS' });
            refreshAccounts();
        } catch (e) {
            execute('LOG_ENTRY', { msg: `Error al eliminar: ${e.message}`, type: 'ERROR' });
        }
    };

    const handleVerify = async (accountId) => {
        setIsLoading(true);
        try {
            // AXIOMA: Sonda de Conectividad (L5-PROBE)
            // Intentamos ejecutar una acción mínima de verificación en el adaptador correspondiente
            const result = await adapter.executeAction(`${activeProvider}:verifyConnection`, { accountId });
            if (result.success || result.status === 'ACTIVE') {
                execute('LOG_ENTRY', { msg: `Vínculo con ${activeProvider} [${accountId}] verificado con éxito.`, type: 'SUCCESS' });
            } else {
                execute('LOG_ENTRY', { msg: `Fallo de Sintonía: ${result.error || 'Respuesta inválida'}`, type: 'ERROR' });
            }
        } catch (e) {
            execute('LOG_ENTRY', { msg: `Error de Conexión: ${e.message}`, type: 'ERROR' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToken = async (formData) => {
        setIsLoading(true);
        try {
            const { accountId, apiKey, label, isDefault } = formData;
            await adapter.executeAction('tokenManager:setToken', {
                provider: activeProvider,
                accountId,
                tokenData: { apiKey, label, isDefault }
            });
            execute('LOG_ENTRY', { msg: `Nueva identidad [${accountId}] vinculada a ${activeProvider}`, type: 'SUCCESS' });
            setIsAdding(false);
            refreshAccounts();
        } catch (e) {
            execute('LOG_ENTRY', { msg: `Error al vincular: ${e.message}`, type: 'ERROR' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-[var(--bg-deep)] text-white overflow-hidden flex flex-col font-mono">
            {/* Header */}
            <div className="p-8 border-b border-white/10 bg-black/40 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Icons.Lock className="text-[var(--accent)]" />
                        Identity_Manager
                    </h1>
                    <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mt-1">Sovereign_Credential_Vault_v1.0</p>
                </div>
                <button
                    onClick={() => execute('EXIT_FOCUS')}
                    className="p-3 rounded-full hover:bg-white/5 transition-colors"
                >
                    <Icons.Close size={20} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Providers Sidebar */}
                <aside className="w-64 border-r border-white/5 bg-black/20 p-4 space-y-2 overflow-y-auto">
                    <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest block mb-4 px-2">Providers</span>
                    {providers.map(p => (
                        <button
                            key={p}
                            onClick={() => { setActiveProvider(p); setIsAdding(false); }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-tight transition-all ${activeProvider === p ? 'bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/20' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            {p}
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1 p-12 overflow-y-auto relative">
                    {isAdding ? (
                        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="text-[10px] text-[var(--accent)] uppercase font-black mb-8 flex items-center gap-2 hover:opacity-70"
                            >
                                <Icons.ArrowLeft size={12} /> Volver a la lista
                            </button>
                            <h2 className="text-xl font-bold mb-8 uppercase">Vincular Nueva Cuenta: {activeProvider}</h2>

                            {/* Formulario Manual (o usando SchemaFormEngine) */}
                            <div className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-3xl">
                                <div>
                                    <label className="text-[10px] uppercase text-[var(--text-dim)] font-black block mb-2">Account ID (Interno)</label>
                                    <input
                                        id="acc-id"
                                        type="text"
                                        placeholder="ej: personal_notion"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--accent)]/50 transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-[var(--text-dim)] font-black block mb-2">API Key / Token</label>
                                    <input
                                        id="acc-token"
                                        type="password"
                                        placeholder="secret_xxxxxxxxxxxxxxxx"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--accent)]/50 transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-[var(--text-dim)] font-black block mb-2">Label (Visible)</label>
                                    <input
                                        id="acc-label"
                                        type="text"
                                        placeholder="Notion Javi"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--accent)]/50 transition-all font-mono"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="acc-default" className="accent-[var(--accent)]" />
                                    <label htmlFor="acc-default" className="text-[10px] uppercase text-[var(--text-dim)] font-black">Establecer como cuenta principal</label>
                                </div>
                                <button
                                    disabled={isLoading}
                                    onClick={() => handleAddToken({
                                        accountId: document.getElementById('acc-id').value,
                                        apiKey: document.getElementById('acc-token').value,
                                        label: document.getElementById('acc-label').value,
                                        isDefault: document.getElementById('acc-default').checked
                                    })}
                                    className="w-full bg-[var(--accent)] text-black py-4 rounded-xl font-black uppercase text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Encrypting...' : 'Initialize Identity'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl animate-in fade-in duration-500">
                            <div className="flex justify-between items-end mb-12">
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{activeProvider} Accounts</h2>
                                    <p className="text-xs text-[var(--text-dim)]">Gestiona el acceso a este proveedor desde la bóveda de Indra.</p>
                                </div>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                                >
                                    <Icons.Plus size={16} /> Add_Account
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4 mt-20 opacity-30">
                                    <Icons.Sync size={32} className="animate-spin" />
                                    <span className="text-[10px] uppercase tracking-widest font-black">Syncing_Vault...</span>
                                </div>
                            ) : accounts.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-[24px] hover:border-white/10 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-black/40 border transition-all ${acc.isDefault ? 'border-[var(--accent)]/50 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/5' : 'border-white/5 text-white/40'}`}>
                                                    <Icons.System size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg leading-none mb-2">{acc.label}</h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-mono text-white/30 uppercase">ID: {acc.id}</span>
                                                        {acc.isDefault && (
                                                            <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[7px] text-[var(--accent)] font-black uppercase">Primary</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleVerify(acc.id)}
                                                    className="p-3 rounded-xl bg-white/5 text-[var(--accent)] border border-white/10 hover:bg-[var(--accent)]/10 transition-all"
                                                    title="Probar Conexión"
                                                >
                                                    <Icons.Sync size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(acc.id)}
                                                    className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                                    title="Eliminar Cuenta"
                                                >
                                                    <Icons.Trash size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-20 flex flex-col items-center gap-6 opacity-20">
                                    <Icons.Warning size={48} />
                                    <div className="text-center">
                                        <p className="text-sm font-black uppercase tracking-widest">No hay identidades vinculadas</p>
                                        <p className="text-[10px] mt-2 italic">Añade una cuenta para empezar a sincronizar datos.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Diagnostics Bar */}
            <footer className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[8px] text-white/20 font-black tracking-widest uppercase">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Vault_Status: Encrypted</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></div> Encryption: AES-256</span>
                </div>
                <span>Indra Identity Protocol L1-Axiom</span>
            </footer>
        </div>
    );
};

export default IdentityEngine;



