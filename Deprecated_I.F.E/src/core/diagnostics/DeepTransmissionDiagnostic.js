/**
 * 🔬 DEEP DIAGNOSTIC: Core-Satellite Law Transmission
 * Este test intercepta TODA la cadena de transmisión de leyes
 */

import useCoreStore from '../state/CoreStore';

export const DeepTransmissionDiagnostic = {
    /**
     * Intercepta y registra cada paso de la transmisión
     */
    async runDeepDiagnostic() {
        console.group('🔬 DEEP TRANSMISSION DIAGNOSTIC');

        const store = useCoreStore.getState();

        // PASO 1: Verificar el estado actual del store
        console.group('📦 PASO 1: Current Store State');
        console.log('Store.laws exists:', !!store.laws);
        console.log('Store.laws.GENETIC exists:', !!store.laws?.GENETIC);
        console.log('Store.laws.GENETIC.ARCHETYPES:', store.laws?.GENETIC?.ARCHETYPES);
        console.log('Store.laws.GENETIC.GENETIC exists (double nesting):', !!store.laws?.GENETIC?.GENETIC);
        console.groupEnd();

        // PASO 2: Hacer una llamada fresca al Core
        console.group('🌐 PASO 2: Fresh Core Call');
        try {
            const { default: CoreBridge } = await import('../bridge/CoreBridge');
            console.log('CoreBridge imported successfully');

            const rawResponse = await CoreBridge.callCore('public', 'getSovereignLaws');
            console.log('Raw response from Core:', rawResponse);

            if (rawResponse?.laws) {
                console.log('Laws received. Keys:', Object.keys(rawResponse.laws));
                console.log('GENETIC structure:', rawResponse.laws.GENETIC);
                console.log('GENETIC.ARCHETYPES:', rawResponse.laws.GENETIC?.ARCHETYPES);
                console.log('GENETIC.GENETIC exists:', !!rawResponse.laws.GENETIC?.GENETIC);

                if (rawResponse.laws.GENETIC?.GENETIC) {
                    console.error('🔴 DOUBLE NESTING DETECTED IN RAW RESPONSE FROM CORE');
                    console.log('GENETIC.GENETIC.ARCHETYPES:', rawResponse.laws.GENETIC.GENETIC.ARCHETYPES);
                }
            }
        } catch (e) {
            console.error('Failed to call Core:', e);
        }
        console.groupEnd();

        // PASO 3: Verificar la función setLaws
        console.group('💾 PASO 3: setLaws Function Test');
        const testLaws = {
            GENETIC: {
                ARCHETYPES: ['TEST1', 'TEST2', 'ADAPTER']
            },
            PHENOTYPE: {},
            SPATIAL: {}
        };

        console.log('Calling setLaws with test data:', testLaws);
        store.setLaws(testLaws);

        const afterSet = useCoreStore.getState().laws;
        console.log('After setLaws, store.laws.GENETIC.ARCHETYPES:', afterSet?.GENETIC?.ARCHETYPES);
        console.groupEnd();

        // PASO 4: Verificar localStorage
        console.group('💿 PASO 4: LocalStorage Inspection');
        try {
            const vaultData = localStorage.getItem('purity-core-vault');
            if (vaultData) {
                const parsed = JSON.parse(vaultData);
                console.log('LocalStorage keys:', Object.keys(parsed.state || {}));
                console.log('LocalStorage has laws:', !!parsed.state?.laws);
                if (parsed.state?.laws) {
                    console.log('LocalStorage laws.GENETIC:', parsed.state.laws.GENETIC);
                }
            } else {
                console.log('No purity-core-vault in localStorage');
            }
        } catch (e) {
            console.error('Failed to read localStorage:', e);
        }
        console.groupEnd();

        console.groupEnd();

        return {
            storeLaws: store.laws,
            hasDoubleNesting: !!store.laws?.GENETIC?.GENETIC
        };
    }
};

// Auto-register
if (import.meta.env.DEV) {
    window.DeepTransmissionDiagnostic = DeepTransmissionDiagnostic;
    console.log('💡 Deep Diagnostic available: DeepTransmissionDiagnostic.runDeepDiagnostic()');
}
