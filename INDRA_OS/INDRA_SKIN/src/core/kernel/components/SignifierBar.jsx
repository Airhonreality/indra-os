import React from 'react';
import { useSignifier } from '../hooks/useSignifier';

/**
 * SignifierBar (V8.4 - Atomized)
 * Componente semiótico universal para retroalimentación de hidratación y carga.
 * Puede ser invocado desde cualquier motor o terminal pasando el nodeId.
 */
const SignifierBar = ({ nodeId, showLabel = true, compact = false }) => {
    const { label: statusLabel, progress, color, pulse, totalItems } = useSignifier(nodeId);

    if (compact) {
        return (
            <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-1 bg-[var(--bg-deep)] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: color,
                            boxShadow: pulse ? `0 0 8px ${color}66` : 'none'
                        }}
                    />
                </div>
                <span className="text-[8px] font-mono" style={{ color }}>{progress}%</span>
            </div>
        );
    }

    return (
        <div className="space-y-3 w-full animate-in fade-in duration-500">
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-dim)]">
                <span>Status</span>
                <span style={{ color }} className={pulse ? 'animate-pulse font-bold' : ''}>
                    {statusLabel}
                </span>
            </div>
            {showLabel && (
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-dim)]">
                    <span>Hydration</span>
                    <span>{progress}%</span>
                </div>
            )}
            <div className="h-1.5 w-full bg-[var(--bg-deep)] rounded-full overflow-hidden border border-[var(--border-subtle)]/30">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: color,
                        boxShadow: pulse ? `0 0 12px ${color}55` : 'none'
                    }}
                ></div>
            </div>
            {!compact && (
                <span className="text-[9px] font-mono text-[var(--text-dim)] opacity-50 block text-right">
                    {totalItems} artifacts projected
                </span>
            )}
        </div>
    );
};

export default SignifierBar;
