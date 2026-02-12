import React, { useState, useMemo } from 'react';
import compiler from '../core/laws/Law_Compiler';
import { Icons } from '../4_Atoms/IndraIcons';

/**
 * AdapterSelector (Mini-Hood)
 * DHARMA: Interface for selecting the active adapter context in DevLab.
 * AXIOMA: "Focus determines reality."
 */
const AdapterSelector = ({ onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const adapters = useMemo(() => {
        const ont = compiler.ontology || {};
        const keys = Object.keys(ont);
        if (keys.length === 0) {
            return [];
        }
        return keys;
    }, []);

    const filtered = useMemo(() => {
        return adapters.filter(id => id.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [adapters, searchTerm]);

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-[400px] max-h-[60vh] bg-[var(--bg-deep)] border border-[var(--border-vibrant)]/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in scale-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Compact Header */}
                <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 flex items-center gap-3">
                    <Icons.Search size={16} className="text-[var(--accent)]" />
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none text-[var(--text-vibrant)] placeholder:text-[var(--text-dim)] focus:outline-none font-medium text-sm"
                        placeholder="Select Adapter Protocol..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text-soft)]">
                        <Icons.Close size={16} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 bg-dot-pattern scrollbar-thin scrollbar-thumb-[var(--border-subtle)]">
                    {filtered.length > 0 ? (
                        filtered.map(id => {
                            const label = compiler.getLabel(id) || id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => onSelect(id)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 border border-transparent transition-all group text-left mb-1"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-dim)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/50 font-mono text-xs font-bold">
                                            {id.substring(0, 2)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-[var(--text-soft)] group-hover:text-[var(--text-vibrant)]">
                                                {label.toUpperCase()}
                                            </span>
                                            <span className="text-[9px] font-mono text-[var(--text-dim)] opacity-50">
                                                {id}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icons.ChevronDown size={14} className="-rotate-90 text-[var(--accent)]" />
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-[var(--text-dim)] text-xs font-mono">
                            NO MATCHES
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] text-center">
                    <span className="text-[9px] font-mono text-[var(--text-dim)] tracking-widest opacity-50">
                        SELECT TARGET TO INSPECT
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AdapterSelector;
