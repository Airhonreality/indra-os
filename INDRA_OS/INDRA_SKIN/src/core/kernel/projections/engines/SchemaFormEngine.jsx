import React, { useState } from 'react';
import compiler from '../../../laws/Law_Compiler';

/**
 * SchemaFormEngine.jsx
 * 🧬 Motor de Proyección de Esquemas Canónicos.
 * Transforma una Definición de Ley (Schema) en una interfaz de entrada reactiva.
 */
const SchemaFormEngine = ({ schemaId, onCommit, onCancel, isLoading = false, error = null }) => {
    const schema = compiler.getArtifactSchema(schemaId);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    if (!schema) {
        return (
            <div className="p-6 text-[var(--error)] border border-[var(--error)]/20 rounded-xl bg-[var(--error)]/5 font-mono text-sm">
                [PROJECTION_ERROR] Unknown Schema: {schemaId}
            </div>
        );
    }

    const handleChange = (path, value) => {
        setFormData(prev => {
            const newData = { ...prev };
            const keys = path.split('.');
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Aquí podríamos añadir validación local antes de commit
        if (onCommit) onCommit(formData);
    };

    const renderField = (key, config, path) => {
        const fullPath = path ? `${path}.${key}` : key;
        const value = path ? (formData[path]?.[key] || '') : (formData[key] || '');

        if (config.type === 'object' && config.structure) {
            return (
                <div key={fullPath} className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-black mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)]"></span>
                        {config.label || key}
                    </h4>
                    <div className="grid grid-cols-1 gap-4 pl-4 border-l border-[var(--border-subtle)]">
                        {Object.entries(config.structure).map(([subKey, subConfig]) =>
                            renderField(subKey, subConfig, fullPath)
                        )}
                    </div>
                </div>
            );
        }

        const isSelect = Array.isArray(config.options) || Array.isArray(config.enum);
        const selectOptions = config.options || (config.enum ? config.enum.map(e => ({ label: e, value: e })) : []);

        return (
            <div key={fullPath} className="flex flex-col gap-2 mb-4">
                <label className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-black flex justify-between">
                    <span>{config.label || key}</span>
                    {config.validation?.required && <span className="text-[var(--error)] font-mono text-[8px]">* REQUIRED</span>}
                </label>

                {isSelect ? (
                    <div className="relative">
                        <select
                            className="w-full appearance-none bg-[var(--bg-deep)]/50 border border-[var(--border-subtle)] focus:border-[var(--accent)]/50 rounded-lg px-4 py-2.5 text-xs text-[var(--text-soft)] outline-none transition-all focus:shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] cursor-pointer"
                            value={value}
                            onChange={(e) => handleChange(fullPath, e.target.value)}
                        >
                            <option value="" disabled>Selecciona una opción...</option>
                            {selectOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-dim)]">
                            ▼
                        </div>
                    </div>
                ) : (
                    <input
                        type="text"
                        className="bg-[var(--bg-deep)]/50 border border-[var(--border-subtle)] focus:border-[var(--accent)]/50 rounded-lg px-4 py-2.5 text-xs text-[var(--text-soft)] placeholder:text-[var(--text-dim)]/30 outline-none transition-all focus:shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]"
                        placeholder={`Ingresa ${config.label || key}...`}
                        value={value}
                        onChange={(e) => handleChange(fullPath, e.target.value)}
                    />
                )}

                {config.description && (
                    <span className="text-[9px] text-[var(--text-dim)] leading-relaxed italic">
                        {config.description}
                    </span>
                )}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-[var(--text-vibrant)] tracking-tight mb-1">
                        Create New {schemaId.replace('_V1', '')}
                    </h2>
                    <p className="text-xs text-[var(--text-dim)]">
                        Indra Axiomatic Projection Protocol v8.0
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in shake duration-500">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1 font-mono">
                            ⚡ Veto Alert (Validation Fail)
                        </p>
                        <p className="text-[11px] text-red-400 opacity-80 italic">
                            {error}
                        </p>
                    </div>
                )}

                {Object.entries(schema).map(([key, config]) => renderField(key, config))}
            </div>

            <div className="mt-8 flex gap-4 pt-6 border-t border-[var(--border-subtle)]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-black uppercase tracking-widest text-[var(--text-dim)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-soft)] transition-all active:scale-[0.98]"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`
                        flex-1 px-6 py-2.5 rounded-xl text-black text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg
                        ${isLoading
                            ? 'bg-[var(--accent)]/50 cursor-wait opacity-50'
                            : 'bg-[var(--accent)] hover:brightness-125 shadow-[var(--accent)]/20'
                        }
                    `}
                >
                    {isLoading ? 'Inyectando Realidad...' : 'Initialize Source'}
                </button>
            </div>
        </form>
    );
};

export default SchemaFormEngine;



