import React, { useState } from 'react';
import compiler from '../../../core/laws/Law_Compiler';
import diagnostic from '../../../core/diagnostics/IntegrityMatrix';
import { AxiomaticGroup } from '../../../core/ui/AxiomaticTransmuter';

/**
 * IDENTITY VAULT (OMD-02)
 * Capa: Soberanía (Nivel 3)
 */
const IdentityVault = () => {
    const law = compiler.getLaw('OMD-02');
    const [activeContract, setActiveContract] = useState('ALL'); // ALL, LLM, SOCIAL, ORGANIZER

    if (!law || !law.sub_modules) {
        return <div className="p-4 text-status-error font-mono text-[10px]">ERR::OMD-02_DNA_CORRUPT</div>;
    }

    const contracts = [
        { id: 'ALL', label: 'Todos' },
        { id: 'LLM', label: 'Cerebros (AI)' },
        { id: 'ORGANIZER', label: 'Gestión (DB)' },
        { id: 'SOCIAL', label: 'Social (Omni)' }
    ];

    return (
        <div id="omd-02-vault" className="h-full flex flex-col bg-black/60 glass border-r border-white/5">
            {/* Header Soberano (Minimalist Industrial) */}
            <header className="px-10 pt-12 pb-6 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex items-center justify-between mb-8">
                    <div className="stack-v">
                        <h2 className="text-white text-[13px] font-black tracking-[0.4em] uppercase leading-none opacity-80">{law.functional_name || 'THE VAULT'}</h2>
                        <span className="text-[7px] font-mono text-accent-primary uppercase tracking-[0.2em] opacity-30 mt-1">N3_BACKBONE</span>
                    </div>
                </div>

                {/* Filtros de Contrato (Limpios) */}
                <nav className="flex items-center gap-5 border-b border-white/[0.03]">
                    {contracts.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setActiveContract(c.id)}
                            className={`text-[8px] font-mono uppercase tracking-[0.15em] transition-all duration-300 pb-2 border-b-2 ${activeContract === c.id ? 'border-accent-primary text-white' : 'border-transparent text-white/10 hover:text-white/30'}`}
                        >
                            {c.id}
                        </button>
                    ))}
                </nav>
            </header>

            {/* Manifestación de Grupos de Identidad (The Fabric) */}
            <div className="flex-1 overflow-y-auto px-10 py-8 stack-v gap-axiom-groups custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.02),transparent)]">
                {Object.entries(law.sub_modules).map(([key, sub]) => (
                    <AxiomaticGroup
                        key={key}
                        subModule={{
                            ...sub,
                            data_params: { contract: activeContract }
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default IdentityVault;
