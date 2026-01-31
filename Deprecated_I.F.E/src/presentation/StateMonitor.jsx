import React, { useMemo, useState } from 'react';
import { useCoreStore } from '../core/state/CoreStore';
import { Code, Activity } from 'lucide-react';

/**
 * 👁️ StateMonitor: The Conscious Mirror
 * High-fidelity JSON visualization of the system's live state.
 * Axiom: Total transparency of the declarative engine.
 */
const StateMonitor = () => {
    const { nodes, flows, laws, currentProject, status } = useCoreStore();

    const distilledState = useMemo(() => ({
        system: {
            status,
            project: currentProject?.name || 'VAGRANT_WORKSPACE',
            version: '2.0.0_PURITY'
        },
        topology: {
            node_count: Object.keys(nodes).length,
            connection_count: flows?.connections?.length || 0,
            instances: nodes
        },
        laws: {
            genetic: laws.GENETIC ? 'HYDRATED' : 'MISSING',
            phenotype: laws.PHENOTYPE ? 'HYDRATED' : 'MISSING'
        }
    }), [nodes, flows, laws, currentProject, status]);

    return (
        <div className="state-monitor-panel">
            <header className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2">
                    <Code size={12} className="text-accent-primary" />
                    <span className="mono-bold text-[9px] uppercase tracking-widest opacity-60">Live_State_Stream</span>
                </div>
                <div className="flex items-center gap-2">
                    <Activity size={10} className="text-accent-success pulsing" />
                    <span className="mono text-[8px] opacity-20 uppercase">Sync_Active</span>
                </div>
            </header>

            <div className="json-node-container custom-scrollbar">
                <JsonNode data={distilledState} name="CORE_MIRROR" depth={0} />
            </div>

            <footer className="p-2 border-t border-white/5 flex justify-between bg-black/20">
                <span className="mono text-[8px] opacity-20 uppercase tracking-tighter">Signal: Stable</span>
                <span className="mono text-[8px] opacity-20 uppercase tracking-tighter">Reactive: True</span>
            </footer>
        </div>
    );
};

const JsonNode = ({ data, name, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const isObject = data !== null && typeof data === 'object';

    const renderValue = (val) => {
        if (typeof val === 'string') return <span className="text-accent-success opacity-80">"{val}"</span>;
        if (typeof val === 'number') return <span className="text-secondary opacity-80">{val}</span>;
        if (typeof val === 'boolean') return <span className="text-accent-primary opacity-80">{val ? 'true' : 'false'}</span>;
        return null;
    };

    if (!isObject) {
        return (
            <div className="ml-4 py-0.5">
                <span className="opacity-40">{name}:</span> {renderValue(data)}
            </div>
        );
    }

    return (
        <div className={`ml-${depth > 0 ? '4' : '0'} py-0.5`}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="cursor-pointer flex items-center gap-2 group"
            >
                <span className="text-[7px] opacity-20 group-hover:opacity-100 transition-opacity">{isExpanded ? '▼' : '▶'}</span>
                <span className="opacity-60 group-hover:opacity-100 transition-opacity">{name}</span>
                <span className="opacity-10 text-[8px]">{Array.isArray(data) ? `[${data.length}]` : '{...}'}</span>
            </div>
            {isExpanded && (
                <div className="border-l border-white/5 mt-1">
                    {Object.entries(data).map(([key, value]) => (
                        <JsonNode key={key} name={key} data={value} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StateMonitor;
