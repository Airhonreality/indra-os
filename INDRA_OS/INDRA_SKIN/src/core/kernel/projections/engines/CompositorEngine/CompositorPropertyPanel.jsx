import React from 'react';
import { resolveIcon } from '../../VisualHydrator.js';

/**
 * CompositorPropertyPanel
 * DHARMA: Panel lateral de propiedades e inputs del nodo Compositor.
 * AXIOMA: Agnóstico — lee las CAPABILITIES reales del nodo, sin hardcoding.
 */

const getStatusColor = (status) => {
    switch (status) {
        case 'CONNECTED': return 'var(--accent)';
        case 'BROKEN': return 'var(--error)';
        default: return 'var(--text-dim)';
    }
};

const CompositorPropertyPanel = ({ capabilities, sourceNode, selectedProperty, onSelectProperty }) => {
    // Derivar propiedades desde CAPABILITIES reales del nodo, sin fallbacks hardcodeados
    const properties = Object.keys(capabilities).length > 0
        ? Object.entries(capabilities).map(([key, config]) => ({
            id: key,
            label: config.label || config.human_label || key,
            icon: resolveIcon(config.icon),
            status: config.status || (config.io === 'INPUT' ? 'IDLE' : 'DEFAULT'),
            value: config.value || config.type || '—'
        }))
        : [{
            id: 'data_source',
            label: 'Origen de Datos',
            icon: <span className="text-lg">📡</span>,
            status: sourceNode ? 'CONNECTED' : 'BROKEN',
            value: sourceNode ? (sourceNode.LABEL || sourceNode.id) : 'Sin conexión'
        }];

    return (
        <aside className="w-72 border-r border-[var(--border-subtle)] bg-[var(--surface-header)] flex flex-col p-4 gap-2 z-40 shrink-0">
            <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em] mb-4 pl-2">
                Propiedades_Input
            </span>

            {properties.map(prop => (
                <div
                    key={prop.id}
                    onClick={() => onSelectProperty(prop.id)}
                    className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer group ${selectedProperty === prop.id
                            ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/5'
                            : 'bg-transparent border-transparent hover:border-white/10'
                        }`}
                >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-[var(--surface-card)] flex items-center justify-center text-lg border border-[var(--border-subtle)] group-hover:border-[var(--accent)]/30 transition-all">
                            {typeof prop.icon === 'function'
                                ? React.createElement(prop.icon, { size: 20 })
                                : prop.icon}
                        </div>
                        <div
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-deep)] shadow-sm animate-pulse"
                            style={{ backgroundColor: getStatusColor(prop.status) }}
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${selectedProperty === prop.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                            }`}>
                            {prop.label}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--text-dim)] truncate italic">
                            {prop.status === 'CONNECTED' ? 'Linked_to_Graph' : `Val: ${prop.value}`}
                        </span>
                    </div>
                </div>
            ))}

            {/* Análisis Estático: fuente de datos activa */}
            <div className="mt-auto p-4 rounded-2xl bg-[var(--surface-header)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                    <span className="text-[9px] font-black text-[var(--text-dim)] uppercase">
                        {sourceNode ? 'Fuente_Activa' : 'Sin_Fuente'}
                    </span>
                </div>
                <p className="text-[8px] text-[var(--text-dim)] leading-relaxed font-medium">
                    {sourceNode
                        ? `Recibiendo materia de: ${sourceNode.LABEL || sourceNode.id}`
                        : 'Conecta un nodo al puerto RECEIVE para proyectar datos.'}
                </p>
            </div>
        </aside>
    );
};

export default CompositorPropertyPanel;

