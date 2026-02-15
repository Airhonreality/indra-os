import React from 'react';

/**
 * src/modules/Nivel_3_Sovereignty/OMD-00_TestProbe/TestProbe.jsx
 * 🛰️ COMPONENTE PROBETA (Automated UI)
 * Este componente se renderiza basándose puramente en la Ley Compilada.
 */
const TestProbe = ({ compiledLaw }) => {
    // Estas propiedades vienen del LawCompiler, no están hardcodeadas en la UI
    const { visual_rules, functional_name, config } = compiledLaw;

    const style = {
        border: `2px solid ${visual_rules.border_color}`,
        animation: `${visual_rules.motion} 2s infinite`,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '1rem',
        borderRadius: '8px',
        color: '#fff',
        fontFamily: 'monospace'
    };

    return (
        <div style={style} className="axiom-component">
            <header className="flex items-center gap-2 mb-2">
                <span className="text-gold">[{compiledLaw.id}]</span>
                <h4 className="font-bold">{functional_name}</h4>
            </header>
            <div className="text-xs opacity-70">
                <p>Arquetipo: {config.archetype}</p>
                <p>Estado: READY</p>
                <p>Pulso: {config.refresh_rate}</p>
            </div>
            <div className="mt-2 flex gap-1">
                {compiledLaw.capabilities.map(cap => (
                    <span key={cap} className="px-1 bg-zinc-800 text-[10px] rounded">
                        {cap}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default TestProbe;



