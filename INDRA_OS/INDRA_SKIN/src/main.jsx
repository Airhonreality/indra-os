import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AxiomaticProvider, useAxiomaticStore } from './core/1_Axiomatic_Store/AxiomaticStore.jsx';
import assembler from './core/System_Assembler.js';
// ADR-021: DevLab ERRADICADO — import eliminado
import CoreSelector from './1_Bootstrap/CoreSelector.jsx';
import LayerOrchestrator from './0_Orchestration/LayerOrchestrator.jsx';
import AxiomaticSpinner from './4_Atoms/AxiomaticSpinner.jsx';
import { CONFIG } from './core/Config.js';
import './index.css';

/**
 * AxiomBootloader
 * DHARMA: Secuencia de arranque del Frontend.
 * Responsabilidad: Orquestar la ignición del SystemAssembler y decidir qué interfaz mostrar.
 */
const AxiomBootloader = () => {
    const { dispatch } = useAxiomaticStore();
    const [bootStatus, setBootStatus] = useState('BOOTING'); // BOOTING | ACTIVE | LOCKED
    const [assemblyData, setAssemblyData] = useState(null);

    useEffect(() => {
        const igniteSystem = async () => {
            console.log("🚀 [Main] Iniciando Bootloader...");

            // AXIOMA: Guardia de Conconectividad Previa
            if (!CONFIG.CORE_URL) {
                console.warn("⚠️ [Main] No se detectó URL de Core. Redirigiendo a Selector.");
                setBootStatus('LOCKED');
                return;
            }

            // 1. Invocamos al Ensamblador Maestro
            const assembly = await assembler.assemble();

            if (assembly.success && assembly.status === 'ACTIVE') {
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
    }, []); // Dependencias vacías para mount único (dispatch es estable)

    // RENDER DE ESTADOS
    if (bootStatus === 'BOOTING') {
        return (
            <div className="w-screen h-screen bg-black flex flex-col items-center justify-center">
                <AxiomaticSpinner size={80} label="Initializing Axiom OS" />
            </div>
        );
    }

    if (bootStatus === 'ACTIVE') {
        return <LayerOrchestrator initialAssembly={assemblyData} />;
    }

    // Fallback: Core Selector (Navegador de Realidades)
    return <CoreSelector />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AxiomaticProvider>
            <AxiomBootloader />
        </AxiomaticProvider>
    </React.StrictMode>,
);




