/**
 * 🕸️ NETWORK LAYER (Layer 0)
 * Wraps CoreBridge to verify backend connectivity.
 */
import { callCore, callAction } from '../../bridge/CoreBridge';
import { useSystemStore } from '../../state/ReactiveStore';
import { configureContractSensing } from '../../bridge/ContractSensing';

export class NetworkLayer {
    constructor() {
        this.name = 'network';
        this.context = null;
    }

    async init() {
        console.log('[LAYER:0] Network Init: Requesting System Constitution...');
        try {
            // 1. Fetch Functional Contracts (What can the system do?)
            const contracts = await callAction('getSystemContracts');
            if (contracts) {
                useSystemStore.getState().setSystemContracts(contracts);
                console.log('[LAYER:0] System Contracts Synchronized.');
            }

            // 2. Fetch Physical Context (Where does the system live?)
            const context = await callAction('getSystemContext');
            if (context) {
                this.context = context;
                useSystemStore.getState().setSystemContext(context);
                console.log('[LAYER:0] System Context Synchronized.');
            }

            // 3. Configure ContractSensing Bridge (Logic Binding)
            if (contracts && context) {
                configureContractSensing(contracts, context);
            }

            return true;
        } catch (e) {
            console.error('[LAYER:0] Constitution failure during Init:', e.message);
            return false;
        }
    }

    async diagnose() {
        console.log('--- Diagnosis: Network Layer ---');
        const results = {};

        try {
            results.bridge_config = 'OK';
            const start = Date.now();
            const context = await callAction('getSystemContext');

            if (context) {
                results.latency = `${Date.now() - start}ms`;
                results.status = 'READY';
                this.context = context;
            } else {
                results.status = 'WEAK';
            }

        } catch (e) {
            results.status = 'FAILED';
            results.error = e.message;
        }

        return results;
    }
}
