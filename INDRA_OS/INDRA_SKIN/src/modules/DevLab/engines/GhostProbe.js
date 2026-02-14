/**
 * GhostProbe.js
 * Sonda Forense para diagnosticar la inyección de Fantasmas en DevLab.
 * 
 * USO: Importar y llamar a runProbe() desde la consola o un botón de test.
 */

import { useAxiomaticStore } from '../../../state/AxiomaticStore';

export const runGhostProbe = () => {
    // Hack de acceso global al Store (posible race condition pero útil para sondas)
    const store = window.AxiomaticStore;

    if (!store) {
        console.error("❌ PROBE ABORTED: AxiomaticStore not exposed globally.");
        return;
    }

    const { dispatch, getState } = store;

    console.group("👻 GHOST PROBE INITIATED");

    // 1. Estado Previo
    const preState = getState();
    console.log("1. Pre-State (DevLab Target):", preState.phenotype.devLab?.targetId);

    // 2. Disparo Manual
    console.log("2. Firing: INJECT_PHANTOM_ARTIFACT -> SLOT");
    dispatch({ type: 'INJECT_PHANTOM_ARTIFACT', payload: { engineId: 'SLOT' } });

    // 3. Verificación Inmediata (Micro-task delay simulation)
    setTimeout(() => {
        const postState = getState();
        const targetId = postState.phenotype.devLab?.targetId;
        const artifacts = postState.phenotype.artifacts || [];

        console.log("3. Post-State (DevLab Target):", targetId);

        // A. ¿El target cambió?
        if (targetId === 'garage_slot') {
            console.log("✅ CHECK A (Target Update): SUCCESS");
        } else {
            console.error("❌ CHECK A (Target Update): FAILED. Expected 'garage_slot', got:", targetId);
        }

        // B. ¿El fantasma está en el fenotipo?
        const ghost = artifacts.find(a => a.id === 'garage_slot');
        if (ghost) {
            console.log("✅ CHECK B (Ghost Existence): SUCCESS. Found:", ghost);

            // C. ¿Tiene capacidades?
            if (ghost.CAPABILITIES && Object.keys(ghost.CAPABILITIES).length > 0) {
                console.log("✅ CHECK C (Ghost Capabilities): SUCCESS. Capabilities:", Object.keys(ghost.CAPABILITIES));
            } else {
                console.warn("⚠️ CHECK C (Ghost Capabilities): EMPTY. Ghost has no powers.");
            }

        } else {
            console.error("❌ CHECK B (Ghost Existence): FAILED. Ghost artifact not found in state.");
        }

        console.groupEnd();
    }, 500);
};
