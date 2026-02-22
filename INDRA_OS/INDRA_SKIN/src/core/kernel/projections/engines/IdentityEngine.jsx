import React, { useState, useEffect, useMemo } from 'react';
import { useAxiomaticStore } from '../../../1_Axiomatic_Store/AxiomaticStore.jsx';
import { Icons } from '../../../../4_Atoms/AxiomIcons.jsx';
import HoldToDeleteButton from '../../../../4_Atoms/HoldToDeleteButton.jsx';
import SchemaFormEngine from './SchemaFormEngine.jsx';

/**
 * IdentityEngine.jsx
 * DHARMA: Gestor de Soberanía de Credenciales (L1).
 * AXIOMA: "Tu identidad es tu acceso a la realidad."
 * Este motor ahora funciona como un gestor global que descubre y organiza todos los 
 * puntos de entrada de datos basados en sus arquetipos y contratos.
 */
const IdentityEngine = ({ data, perspective = 'VAULT' }) => {
    const { state, execute } = useAxiomaticStore();
    const { adapter } = state.sovereignty;

    const [configuredProviders, setConfiguredProviders] = useState([]);
    const [activeProviderId, setActiveProviderId] = useState(data?.provider || null);
    const [accounts, setAccounts] = useState([]);
    const [activeAccount, setActiveAccount] = useState(data?.accountId || null);
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // AXIOMA: Sincronización de Identidad Externa (Props -> State)
    useEffect(() => {
        if (data?.provider && data.provider !== activeProviderId) {
            setActiveProviderId(data.provider);
        }
    }, [data?.provider]);

    useEffect(() => {
        if (data?.accountId && data.accountId !== activeAccount) {
            setActiveAccount(data.accountId);
        }
    }, [data?.accountId]);

    // AXIOMA: Descubrimiento de la Ontología del Sistema
    const providerGroups = useMemo(() => {
        const registry = state.genotype?.COMPONENT_REGISTRY || state.genotype?.component_registry || {};
        const groups = {
            'STORAGE': { label: 'Bóvedas y Archivos', icon: Icons.Vault, items: [] },
            'COMMUNICATION': { label: 'Mensajería y Correo', icon: Icons.Inbox, items: [] },
            'INTELLIGENCE': { label: 'IA y Agentes', icon: Icons.Cpu, items: [] },
            'DATA': { label: 'Bases de Datos', icon: Icons.Database, items: [] },
            'OTHER': { label: 'Otros Servicios', icon: Icons.Activity, items: [] }
        };

        const allProviders = new Set([
            ...configuredProviders,
            ...Object.keys(registry).filter(k => {
                const node = registry[k];
                const arch = String(node.archetype || node.ARCHETYPE || '').toUpperCase();
                const intent = String(node.semantic_intent || node.SEMANTIC_INTENT || '').toUpperCase();
                return arch === 'ADAPTER' || arch === 'SERVICE' || intent === 'BRIDGE';
            }).map(k => k.toLowerCase())
        ]);

        allProviders.forEach(pId => {
            const node = registry[pId.toUpperCase()] || registry[pId.toLowerCase()] || registry[pId];
            const archetype = String(node?.archetype || node?.ARCHETYPE || '').toUpperCase();
            const domain = String(node?.domain || node?.DOMAIN || '').toUpperCase();
            const caps = (node?.capabilities || node?.CAPABILITIES || {});

            // AXIOMA: Compatibilidad ADR-022
            const capIds = Object.values(caps).map(c => typeof c === 'object' ? c.id : c);

            const item = {
                id: pId,
                label: node?.label || node?.LABEL || node?.id || pId,
                archetype: archetype
            };

            // AXIOMA: Clasificación por Atributo Funcional
            if (capIds.includes('LIST_FILES') || capIds.includes('BROWSE') || archetype.includes('VAULT')) {
                groups['STORAGE'].items.push(item);
            } else if (capIds.includes('SEND_REPLY') || capIds.includes('SEND_MESSAGE') || archetype.includes('COMMUNICATION') || domain === 'COMMUNICATION') {
                groups['COMMUNICATION'].items.push(item);
            } else if (capIds.includes('EXECUTE_ACTION') || capIds.includes('PROCESS_SIGNAL') || archetype.includes('AGENT')) {
                groups['INTELLIGENCE'].items.push(item);
            } else if (capIds.includes('DATA_STREAM') || capIds.includes('QUERY_FILTER') || archetype.includes('DATABASE') || domain === 'DATABASE') {
                groups['DATA'].items.push(item);
            } else {
                groups['OTHER'].items.push(item);
            }
        });

        Object.keys(groups).forEach(key => {
            if (groups[key].items.length === 0) delete groups[key];
        });

        return groups;
    }, [state.genotype?.COMPONENT_REGISTRY, configuredProviders]);

    useEffect(() => {
        if (!activeProviderId && perspective !== 'WIDGET') {
            const firstGroup = Object.values(providerGroups)[0];
            if (firstGroup && firstGroup.items.length > 0) {
                setActiveProviderId(firstGroup.items[0].id);
            }
        }
    }, [providerGroups, activeProviderId, perspective]);

    useEffect(() => {
        const fetchProviders = async () => {
            // AXIOMA: Órgano Vestigial (Soberanía de Silencio)
            // Si el adaptador no existe, el motor entra en hibernación sin disparar errores.
            if (!adapter || typeof adapter.executeAction !== 'function') {
                console.warn("[Identity] Adapter not ready. Entering standby mode.");
                return;
            }

            try {
                const result = await adapter.executeAction('tokenManager:listTokenProviders', {});
                if (Array.isArray(result)) setConfiguredProviders(result);
            } catch (e) {
                console.error("[Identity] Failed to fetch configured providers", e);
            }
        };
        fetchProviders();
    }, [adapter]);

    const refreshAccounts = async () => {
        if (!activeProviderId || !adapter || typeof adapter.executeAction !== 'function') return;
        setIsLoading(true);
        try {
            const result = await adapter.executeAction('tokenManager:listTokenAccounts', { provider: activeProviderId });
            if (Array.isArray(result)) {
                setAccounts(result);
                // Si no hay cuenta activa o la actual no está en la lista de este proveedor, seleccionamos la default
                if (!activeAccount || !result.find(a => a.id === activeAccount)) {
                    const defaultAcc = result.find(a => a.isDefault) || result[0];
                    if (defaultAcc && activeAccount !== defaultAcc.id) {
                        setActiveAccount(defaultAcc.id);
                        if (data?.onAccountChange) data.onAccountChange(defaultAcc.id);
                    }
                }
            }
        } catch (e) {
            console.error("[Identity] Failed to fetch accounts", e);
            setAccounts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshAccounts();
    }, [activeProviderId]);

    const handleAccountSelection = (accId) => {
        setActiveAccount(accId);
        if (data?.onAccountChange) {
            data.onAccountChange(accId);
        }
    };

    const handleDelete = async (accountId) => {
        try {
            await adapter.executeAction('tokenManager:deleteToken', { provider: activeProviderId, accountId });
            execute('LOG_ENTRY', { msg: `Identidad ${accountId} eliminada de ${activeProviderId}`, type: 'SUCCESS' });
            refreshAccounts();
        } catch (e) {
            execute('LOG_ENTRY', { msg: `Error al eliminar: ${e.message}`, type: 'ERROR' });
        }
    };

    const handleVerify = async (accountId) => {
        setIsLoading(true);
        try {
            const result = await adapter.executeAction(`${activeProviderId}:verifyConnection`, { accountId });
            if (result.success || result.status === 'ACTIVE') {
                execute('LOG_ENTRY', { msg: `Vínculo con ${activeProviderId} [${accountId}] verificado con éxito.`, type: 'SUCCESS' });
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
                provider: activeProviderId,
                accountId,
                tokenData: { apiKey, label, isDefault }
            });
            execute('LOG_ENTRY', { msg: `Nueva identidad [${accountId}] vinculada a ${activeProviderId}`, type: 'SUCCESS' });
            setIsAdding(false);
            refreshAccounts();
        } catch (e) {
            execute('LOG_ENTRY', { msg: `Error al vincular: ${e.message}`, type: 'ERROR' });
        } finally {
            setIsLoading(false);
        }
    };

    const activeProviderName = useMemo(() => {
        const registry = state.genotype?.COMPONENT_REGISTRY || {};
        return registry[activeProviderId?.toUpperCase()]?.label || activeProviderId;
    }, [activeProviderId, state.genotype?.COMPONENT_REGISTRY]);

    // --- PROYECCIÓN WIDGET (Compacta para anidar en Engines) ---
    if (perspective === 'WIDGET') {
        // AXIOMA: Si no hay adaptador o datos básicos, nos volvemos invisibles para no bloquear al padre.
        if (!adapter) return null;

        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full border border-white/5 hover:border-[var(--accent)]/30 transition-all group/id">
                <span className="text-[7px] font-black text-[var(--accent)] uppercase tracking-tighter opacity-50 group-hover/id:opacity-100 transition-opacity">Pass:</span>
                <select
                    className="bg-transparent border-none text-[9px] font-mono text-[var(--text-soft)] group-hover/id:text-[var(--accent)] outline-none cursor-pointer appearance-none"
                    value={activeAccount || ''}
                    onChange={(e) => handleAccountSelection(e.target.value)}
                >
                    {accounts.length > 0 ? (
                        accounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="bg-[var(--bg-deep)] text-white">
                                {acc.label} {acc.isDefault ? '★' : ''}
                            </option>
                        ))
                    ) : (
                        <option value="" className="bg-[var(--bg-deep)] text-white/30">Sin Cuentas</option>
                    )}
                </select>
                <div className="w-[1px] h-3 bg-white/10 mx-1"></div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        execute('SELECT_ARTIFACT', { id: 'IDENTITY_MANAGER', ARCHETYPE: 'IDENTITY', LABEL: 'Identity Manager', provider: activeProviderId });
                    }}
                    className="p-1 rounded-full hover:bg-[var(--accent)]/10 text-[var(--text-dim)] hover:text-[var(--accent)] transition-all"
                    title="Configurar Identidades"
                >
                    <Icons.Settings size={10} />
                </button>
            </div>
        );
    }

    // --- PROYECCIÓN VAULT (Gestor Global) ---
    return (
        <div className="w-full h-full bg-[var(--bg-deep)] text-white overflow-hidden flex flex-col font-mono">
            {/* Header Soberano */}
            <div className="p-8 border-b border-white/10 bg-black/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
                        <Icons.Sovereign size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">
                            Identity_Manager
                        </h1>
                        <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mt-1">Sovereign_Credential_Vault_v2.0</p>
                    </div>
                </div>
                <button
                    onClick={() => execute('EXIT_FOCUS')}
                    className="p-3 rounded-full hover:bg-white/5 transition-colors"
                >
                    <Icons.Close size={20} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Categorized Sidebar */}
                <aside className="w-72 border-r border-white/5 bg-black/20 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                    {Object.entries(providerGroups).map(([key, group]) => (
                        <div key={key} className="space-y-3">
                            <header className="flex items-center gap-2 px-2">
                                <group.icon size={12} className="text-[var(--text-dim)]" />
                                <span className="text-[8px] font-black text-[var(--text-dim)] uppercase tracking-widest">
                                    {group.label}
                                </span>
                            </header>
                            <div className="flex flex-col gap-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveProviderId(item.id); setIsAdding(false); }}
                                        className={`
                                            group w-full text-left px-4 py-3 rounded-xl transition-all relative overflow-hidden
                                            ${activeProviderId === item.id ? 'bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/10' : 'hover:bg-white/5 text-white/50 hover:text-white'}
                                        `}
                                    >
                                        <div className="relative z-10 flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-tight truncate">{item.label}</span>
                                            <span className={`text-[7px] font-mono uppercase opacity-50 ${activeProviderId === item.id ? 'text-black' : 'text-white'}`}>
                                                {item.id}
                                            </span>
                                        </div>
                                        {configuredProviders.includes(item.id) && activeProviderId !== item.id && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_5px_var(--accent)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-12 overflow-y-auto relative custom-scrollbar bg-dot-pattern">
                    {!activeProviderId ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Icons.Sovereign size={64} />
                            <p className="mt-4 uppercase tracking-[0.4em] font-black text-xs">Selecciona un proveedor para gestionar identidades</p>
                        </div>
                    ) : isAdding ? (
                        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="text-[10px] text-[var(--accent)] uppercase font-black mb-8 flex items-center gap-2 hover:opacity-70"
                            >
                                <Icons.ArrowLeft size={12} /> Volver a la lista
                            </button>
                            <div className="mb-10">
                                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Vincular Identidad</h1>
                                <p className="text-xs text-[var(--text-dim)] uppercase tracking-widest">Proveedor Target: <span className="text-[var(--accent)]">{activeProviderName}</span></p>
                            </div>

                            <div className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                                <div>
                                    <label className="text-[9px] uppercase text-[var(--text-dim)] font-black block mb-3 ml-2 tracking-widest">Account ID (Clave Interna)</label>
                                    <input
                                        id="acc-id"
                                        type="text"
                                        placeholder="ej: notion_main_work"
                                        className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs outline-none focus:border-[var(--accent)] transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-[var(--text-dim)] font-black block mb-3 ml-2 tracking-widest">API Key / Token de Acceso</label>
                                    <input
                                        id="acc-token"
                                        type="password"
                                        placeholder="Ingrese el secreto de conexión..."
                                        className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs outline-none focus:border-[var(--accent)] transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-[var(--text-dim)] font-black block mb-3 ml-2 tracking-widest">Etiqueta Descriptiva (UI)</label>
                                    <input
                                        id="acc-label"
                                        type="text"
                                        placeholder="ej: Espacio Trabajo Indra"
                                        className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs outline-none focus:border-[var(--accent)] transition-all font-mono"
                                    />
                                </div>
                                <div className="flex items-center gap-3 py-2 px-2">
                                    <input type="checkbox" id="acc-default" className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer" />
                                    <label htmlFor="acc-default" className="text-[10px] uppercase text-white/70 font-bold cursor-pointer hover:text-[var(--accent)] transition-colors">Establecer como cuenta por defecto</label>
                                </div>
                                <button
                                    disabled={isLoading}
                                    onClick={() => handleAddToken({
                                        accountId: document.getElementById('acc-id').value,
                                        apiKey: document.getElementById('acc-token').value,
                                        label: document.getElementById('acc-label').value,
                                        isDefault: document.getElementById('acc-default').checked
                                    })}
                                    className="w-full h-14 bg-[var(--accent)] text-black rounded-xl font-black uppercase text-xs hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
                                >
                                    {isLoading ? 'ENCRIPTANDO CIRCUITOS...' : 'MANIFESTAR CREDENCIAL'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl animate-in fade-in duration-500">
                            <div className="flex justify-between items-end mb-16">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                                            {activeProviderId}
                                        </div>
                                    </div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{activeProviderName} Identities</h2>
                                    <p className="text-sm text-[var(--text-dim)] max-w-md leading-relaxed">
                                        Gestiona el linaje de acceso para este proveedor. Los tokens serán encriptados en la bóveda L1 del sistema.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase hover:bg-white/10 hover:border-[var(--accent)]/50 text-[var(--accent)] transition-all"
                                >
                                    <Icons.Plus size={18} /> Vincular_Cuenta
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center gap-6 mt-32 opacity-30">
                                    <Icons.Sync size={48} className="animate-spin" />
                                    <span className="text-[11px] uppercase tracking-[0.5em] font-black">Syncing_Vault...</span>
                                </div>
                            ) : accounts.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="flex items-center justify-between p-8 bg-white/2 border border-white/5 rounded-[32px] hover:border-white/20 transition-all group relative overflow-hidden">
                                            <div className="flex items-center gap-8">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl bg-black/40 border transition-all ${acc.isDefault ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]' : 'border-white/5 text-white/20'}`}>
                                                    <Icons.System size={28} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <h3 className="font-bold text-xl leading-none">{acc.label}</h3>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">ID: {acc.id}</span>
                                                        {acc.isDefault && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                                                                <div className="w-1 h-1 rounded-full bg-[var(--accent)]"></div>
                                                                <span className="text-[8px] text-[var(--accent)] font-black uppercase tracking-tighter">Soberanía Primaria</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleVerify(acc.id)}
                                                    className="p-4 rounded-xl bg-white/5 text-[var(--accent)] border border-white/10 hover:bg-[var(--accent)] hover:text-black transition-all"
                                                    title="Sonda de Conexión"
                                                >
                                                    <Icons.Sync size={18} />
                                                </button>
                                                <HoldToDeleteButton
                                                    onComplete={() => handleDelete(acc.id)}
                                                    size={52}
                                                    iconSize={18}
                                                    color="red"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-24 p-16 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center gap-8 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                                        <Icons.Warning size={48} className="text-white/20 group-hover:text-[var(--accent)] transition-colors" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <p className="text-xl font-black uppercase tracking-widest">Tabula Rasa Detectada</p>
                                        <p className="text-[10px] italic font-mono uppercase tracking-tighter">No hay identidades configuradas para este plano de realidad.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="mt-4 px-8 py-3 bg-[var(--accent)] text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                    >
                                        Inicializar Identidad
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Diagnostics Bar */}
            <footer className="px-8 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[9px] text-white/20 font-black tracking-widest uppercase shrink-0">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_green]"></div>
                        Vault_Status: Encrypted_L1
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></div>
                        Security: AES-256-GCM
                    </span>
                    <span className="flex items-center gap-2 opacity-50">
                        <Icons.Sync size={10} />
                        Automatic_Rotation: Active
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="opacity-50">Identity Protocol</span>
                    <span className="text-[var(--accent)]">v2.0-Sovereign</span>
                </div>
            </footer>
        </div>
    );
};

export default IdentityEngine;




