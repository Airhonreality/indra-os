/**
 * modules/isk/ISKShellProjector.jsx
 * 
 * DHARMA: Proyector del Kernel Espacial de Indra.
 * Lee la ley (JSON) y manifiesta la realidad (Componentes).
 */

import React, { useEffect, useState, Suspense } from 'react';
import { ISK_MODULE_REGISTRY } from './ISK_Module_Registry';
import StarkProjector from '../../../core/StarkProjector';
import './ISKShellProjector.css';

export function ISKShellProjector({ law }) {
    const layout = law; // Enlace directo a la ley inyectada
    const [isMaximized, setIsMaximized] = useState(false);

    if (!layout) return (
        <div className="isk-error flex flex-col gap-4">
            <span className="text-accent-primary animate-pulse">📡 BUSCANDO_FRECUENCIA_ESTRUCTURAL...</span>
            <code className="text-[10px] opacity-30">ERR_VOID_LAW_SIGNAL</code>
        </div>
    );

    const toggleMaximize = () => setIsMaximized(!isMaximized);

    // Helpers de Renderizado
    const renderArtefacts = (entity) => {
        const artefacts = entity.artefacts || [];

        if (artefacts.length === 0) {
            // Fallback al Canon de Andamiaje Localizado (Buscador de Módulos Legacy)
            const ModuleComponent = ISK_MODULE_REGISTRY[entity.id];
            if (ModuleComponent) return <ModuleComponent />;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:10px_10px]">
                    <div className="w-6 h-6 border border-white/10 rotate-45 mb-4 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-accent-primary/20"></div>
                    </div>
                    <span className="text-[7px] font-mono tracking-widest text-white/40 uppercase">VOID::{entity.id}</span>
                </div>
            );
        }

        // Proyección Stark de Artefactos Normalizados
        return (
            <div className="stark-artefact-stream flex flex-col gap-2">
                {artefacts.map(art => (
                    <StarkProjector
                        key={art.id}
                        data={art}
                        slot={entity.slot || entity.id}
                    />
                ))}
            </div>
        );
    };

    // Resolución de Entidades (Resiliencia SDUI 2.0)
    const entities = layout.artefacts
        ? [{ label: layout.functional_name, artefacts: layout.artefacts, id: layout.omd }]
        : (layout.sub_modules || []);

    return (
        <div className={`isk-shell-projector ${isMaximized ? 'isk-fullscreen' : ''} flex flex-wrap gap-1 p-1 bg-black/20`}>
            {/* Zen Control */}
            <button className="isk-zen-toggle" onClick={toggleMaximize}>{isMaximized ? '↙' : '⤢'}</button>
            <Suspense fallback={<div className="text-[10px] animate-pulse">Igniting...</div>}>
                {entities.length > 0 ? (
                    entities.map((entity, idx) => (
                        <div
                            key={entity.id || idx}
                            className="isk-zone"
                        >
                            <header className="isk-zone-header">
                                <span className="isk-zone-label truncate mr-4">{entity.label}</span>
                                <span className="text-[7px] font-mono text-accent-primary/20 shrink-0">[{entity.archetype || 'ENTITY'}]</span>
                            </header>
                            <main className="isk-zone-content">
                                {renderArtefacts(entity)}
                            </main>
                        </div>
                    ))
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 opacity-20">
                        <span className="text-[10px] font-mono tracking-[0.5em]">EMPTY_REALITY_PLANE</span>
                    </div>
                )}
            </Suspense>
        </div>
    );
}
