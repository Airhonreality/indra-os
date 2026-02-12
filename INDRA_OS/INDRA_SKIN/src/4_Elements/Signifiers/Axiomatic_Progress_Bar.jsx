import React from 'react';
import { useSignifier } from '../../core/kernel/hooks/useSignifier';

/**
 * Axiomatic_Progress_Bar
 * 
 * Un componente atómico que reacciona físicamente al ISK.
 * @param {string} nodeId - El ID del nodo al que este signifier representa.
 * @param {string} className - Clases adicionales de Tailwind.
 */
const AxiomaticProgressBar = ({ nodeId, className = "" }) => {
    const { progress, signifierColor, pulse, iskResonance, opacity } = useSignifier(nodeId);

    return (
        <div className={`h-1.5 w-full bg-[var(--bg-deep)] rounded-full overflow-hidden border border-[var(--border-subtle)]/30 ${className}`}>
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                    width: `${progress}%`,
                    backgroundColor: signifierColor || 'var(--accent)',
                    opacity: opacity !== undefined ? opacity : 1,
                    boxShadow: (pulse || iskResonance) ? `0 0 ${10 + (iskResonance || 0) * 15}px ${signifierColor}` : 'none',
                    filter: iskResonance ? `brightness(${1 + iskResonance * 0.5})` : 'none'
                }}
            ></div>
        </div>
    );
};

export default AxiomaticProgressBar;
