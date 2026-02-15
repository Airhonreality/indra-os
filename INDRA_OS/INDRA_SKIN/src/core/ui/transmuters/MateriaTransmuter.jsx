import React from 'react';
import { useAxiomaticSense } from '../hooks/useAxiomaticSense';

/**
 * MATERIA TRANSMUTER (Input Specialist)
 * Dharma: Capturar y normalizar la entrada de datos (Materia Prima).
 */
export const MateriaTransmuter = ({ atom }) => {
    switch (atom.type) {
        case 'INPUT_TEXT':
        case 'INPUT_SECRET':
        case 'INPUT_NUMBER':
            return (
                <div className="axiom-atom flex flex-col gap-2">
                    <label className="axiom-atom-label">{atom.label}</label>
                    <input
                        type={atom.type === 'INPUT_SECRET' ? 'password' : 'text'}
                        className="axiom-atom-input"
                        placeholder={atom.placeholder || '...'}
                    />
                </div>
            );

        case 'TEXTAREA':
            return (
                <div className="axiom-atom stack-v gap-1">
                    <label className="axiom-atom-label">{atom.label}</label>
                    <textarea className="axiom-atom-textarea" rows="3" placeholder={atom.placeholder} />
                </div>
            );

        case 'DROPDOWN': {
            const options = atom.options || [];
            return (
                <div className="axiom-atom flex flex-col gap-2 relative">
                    <label className="axiom-atom-label">
                        {atom.label}
                    </label>
                    <div className="relative">
                        <select className="axiom-atom-select">
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            );
        }

        case 'TOGGLE':
            return (
                <div className="axiom-atom-toggle stack-h items-center justify-between">
                    <span className="axiom-atom-label">{atom.label}</span>
                    <div className="axiom-toggle-rail">
                        <div className="axiom-toggle-knob"></div>
                    </div>
                </div>
            );

        default:
            return null;
    }
};



