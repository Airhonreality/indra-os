import React, { useState } from 'react';
import SpatialCanvas from './SpatialCanvas';

/**
 * 🚀 ISK STRESS TEST: 10,000 REACTIVE NODES
 * Genera una horda de círculos reactivos para estresar el Expression Engine y el Renderer.
 */
const SpatialStressTest = () => {
    const [scenarios, setScenarios] = useState({
        corruptHandshake: false,
        resourceWaste: false
    });

    const stateModifier = (state) => {
        let newState = { ...state };
        if (scenarios.corruptHandshake) {
            delete newState['core.power']; // Eliminamos un campo vital
        }
        if (scenarios.resourceWaste) {
            newState['extra.garbage_data'] = "I am useless data from the Core";
            newState['telemetry.unused_sensor_01'] = 99.9;
        }
        return newState;
    };
    const generateStressLaws = (count) => {
        const laws = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;

            laws.push({
                identity: {
                    uuid: `stress_node_${i}`,
                    role: "STRESS_TEST_PARTICLE"
                },
                dna: {
                    archetype: "circle",
                    reification_protocol: "INSTANCED_TEXTURE_V1",
                    geometry: {
                        type: "circle",
                        expressions: {
                            // Cada nodo tiene su propia fase de oscilación
                            x: `${x} + oscillate(time.now + ${i}, 0.5) * 50`,
                            y: `${y} + oscillate(time.now * 0.8 + ${i}, 0.3) * 50`,
                            radius: `5 + oscillate(time.now * 2 + ${i}, 1.0) * 10`
                        }
                    }
                },
                physiology: {
                    reactive_bindings: []
                }
            });
        }
        return laws;
    };

    const stressLaws = generateStressLaws(10000);

    return (
        <div className="w-full h-full relative">
            <SpatialCanvas laws={stressLaws} stateOverride={stateModifier} />

            {/* Panel de Control de Estrés e Integridad */}
            <div className="absolute top-20 left-4 flex flex-col gap-2">
                <button
                    onClick={() => setScenarios(prev => ({ ...prev, corruptHandshake: !prev.corruptHandshake }))}
                    className={`px-3 py-1 mono text-[9px] border transition-colors ${scenarios.corruptHandshake ? 'bg-red-500 text-white border-red-400' : 'bg-white/5 text-white/40 border-white/10'}`}
                >
                    [SIM] CORRUPT_HANDSHAKE: {scenarios.corruptHandshake ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => setScenarios(prev => ({ ...prev, resourceWaste: !prev.resourceWaste }))}
                    className={`px-3 py-1 mono text-[9px] border transition-colors ${scenarios.resourceWaste ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-white/5 text-white/40 border-white/10'}`}
                >
                    [SIM] RESOURCE_WASTE: {scenarios.resourceWaste ? 'ON' : 'OFF'}
                </button>
            </div>

            <div className="absolute bottom-8 right-8 p-4 bg-white/5 backdrop-blur-md border border-white/10 mono text-[10px] text-white/60">
                <p>ACTIVE_NODES: {stressLaws.length}</p>
                <p>PROTOCOL: INSTANCED_WEBGL2</p>
                <p>JIT_STATUS: HYBRID_ACTIVE</p>
                <p className="text-accent-primary mt-2">TARGET: 60 FPS // LERP_INTERPOLATION: ON</p>
            </div>
        </div>
    );
};

export default SpatialStressTest;
