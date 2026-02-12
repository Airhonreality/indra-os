import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AxiomaticProvider, useAxiomaticStore } from './core/state/AxiomaticStore';
import assembler from './core/System_Assembler';
import DevLab from './modules/DevLab';
import PortalDeAcceso from './1_Bootstrap/PortalDeAcceso';
import LayerOrchestrator from './0_Orchestration/LayerOrchestrator';
import './index.css';

/**
 * StarkBootloader
 * DHARMA: Secuencia de arranque del Frontend.
 * Responsabilidad: Orquestar la ignición del SystemAssembler y decidir qué interfaz mostrar.
 */
const StarkBootloader = () => {
    const { dispatch } = useAxiomaticStore();
    const [bootStatus, setBootStatus] = useState('BOOTING'); // BOOTING | ACTIVE | LOCKED
    const [assemblyData, setAssemblyData] = useState(null);

    useEffect(() => {
        const igniteSystem = async () => {
            console.log("🚀 [Main] Iniciando Bootloader...");

            // 1. Invocamos al Ensamblador Maestro
            const assembly = await assembler.assemble();

            if (assembly.success && assembly.status === 'ACTIVE') {
                // 2. Si el ensamblaje es exitoso y el núcleo responde "ACTIVE"
                console.log("✅ [Main] Sistema Activo. Transfiriendo control a Orchestrator.");

                setAssemblyData(assembly);
                setBootStatus('ACTIVE');
            } else {
                // 3. Si falla (Token inválido, servidor caído, o bloqueo explícito)
                console.warn("⚠️ [Main] Sistema Bloqueado o Requiere Autenticación.");
                setBootStatus('LOCKED');
            }
        };

        igniteSystem();
    }, [dispatch]);

    // RENDER DE ESTADOS
    if (bootStatus === 'BOOTING') {
        return (
            <div className="w-screen h-screen bg-black flex flex-col items-center justify-center gap-6 text-[var(--accent)] font-mono">
                <div className="w-16 h-16 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs tracking-[0.5em] animate-pulse uppercase">
                    INITIALIZING INDRA OS
                </div>
            </div>
        );
    }

    if (bootStatus === 'ACTIVE') {
        return <LayerOrchestrator initialAssembly={assemblyData} />;
    }

    // Fallback: Portal de Acceso (Login)
    return <PortalDeAcceso />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AxiomaticProvider>
            <StarkBootloader />
        </AxiomaticProvider>
    </React.StrictMode>,
);
