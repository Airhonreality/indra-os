import { useCoreStore } from '../state/CoreStore';
import { VaultManager } from '../vault/VaultManager';
import { resolver } from './SchemaResolver';

/**
 * 🌉 INDRA CORE BRIDGE (core/bridge/CoreBridge.js)
 * Standardized Telemetry Layer.
 * Axiom: Zero Hardcoding. Context must be sensed, not injected.
 */

export const CoreBridge = {
    /**
     * Layer 1: Handshake
     */
    async discoverCore(seedUrl, masterKey = null) {
        const store = useCoreStore.getState();
        store.addLog('info', `BRIDGE >> Sensing: ${seedUrl}`);

        try {
            const response = await fetch(seedUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'invoke',
                    executor: 'public',
                    method: 'getSystemStatus',
                    payload: {}
                })
            });

            const data = await response.json();

            if (data.success === false) {
                throw new Error(data.error?.message || "CORE_VETO: Handshake Denied.");
            }

            if (data?.result?.status) {
                const health = data.result;
                VaultManager.setConfig({
                    deploymentUrl: seedUrl,
                    systemStatus: health.status,
                    sessionToken: masterKey || ''
                });
                store.addLog('success', `BRIDGE >> Node Active: v${health.version}`);

                // FASE 1.5+: Infusión de Leyes Soberanas (Defensive Sync)
                let lawsHydrated = false;
                try {
                    store.addLog('info', `BRIDGE >> Infusing Sovereign Laws...`);
                    const lawsResult = await this.callCore('public', 'getSovereignLaws');

                    if (lawsResult?.laws) {
                        // 🔥 DEFENSIVE NORMALIZATION: Corregir doble anidamiento de GENETIC
                        // Si el Core envía { GENETIC: { GENETIC: {...} } }, extraemos el subdominio correcto
                        let normalizedLaws = { ...lawsResult.laws };

                        if (normalizedLaws.GENETIC?.GENETIC) {
                            console.warn('[BRIDGE] ⚠️ ANOMALY DETECTED: Double nesting in GENETIC. Auto-correcting...');
                            normalizedLaws.GENETIC = normalizedLaws.GENETIC.GENETIC;
                            console.log('[BRIDGE] ✅ GENETIC normalized. Archetypes:', normalizedLaws.GENETIC.ARCHETYPES?.length || 0);
                        }

                        store.setLaws(normalizedLaws);
                        store.addLog('success', `BRIDGE >> Laws Infused: ${Object.keys(normalizedLaws).length} Domains found.`);
                        lawsHydrated = true;
                    }
                } catch (lawError) {
                    store.addLog('warn', `BRIDGE >> Law Infusion Failed: ${lawError.message}. Using persistence.`);
                }

                if (!lawsHydrated && (!store.laws || Object.keys(store.laws).length === 0)) {
                    store.addLog('critical', 'BRIDGE >> CRITICAL: No Laws found in Satellite Memory. UI may be incoherent.');
                }

                // FASE 1.8+: Synchronize System Context (The Librarian)
                try {
                    store.addLog('info', 'BRIDGE >> Connecting Librarian...');
                    await resolver.loadSystemContext();
                } catch (resError) {
                    store.addLog('warn', `BRIDGE >> Librarian Sync Failed: ${resError.message}`);
                }

                return health;
            }
            throw new Error("Invalid Status Protocol");
        } catch (e) {
            store.addLog('error', `BRIDGE >> Handshake Fail: ${e.message}`);
            throw e;
        }
    },

    /**
     * Layer 2: Action Channel
     */
    async callAction(action, payload = {}) {
        return await this._executeRequest({ action, ...payload });
    },

    /**
     * Layer 3: Executor Channel
     */
    async callCore(executor, method, payload = {}) {
        const body = { executor, method, payload };
        return await this._executeRequest(body);
    },

    /**
     * Engine: Transmission Logic
     */
    async _executeRequest(body) {
        const store = useCoreStore.getState();
        const config = VaultManager.getConfig();

        if (!config?.deploymentUrl) {
            console.error("BRIDGE >> No deploymentUrl in Vault.");
            throw new Error("VAULT_EMPTY: No endpoint configured.");
        }

        // Axiom: Dynamic Context Retrieval (No hardcoded IDs)
        // Se envían credenciales desde el Vault (Master Key -> systemToken)
        const requestBody = {
            ...body,
            systemToken: config.sessionToken || import.meta.env.VITE_SATELLITE_API_KEY || '',
            context: {
                timestamp: Date.now(),
                client: "Indra_Skeleton_v1",
                version: "1.0.1"
            }
        };

        console.log(`BRIDGE >> Sending Request to ${config.deploymentUrl}:`, requestBody);

        try {
            const response = await fetch(config.deploymentUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log("BRIDGE >> Raw Response Data:", data);

            if (data.success === false) {
                console.error("BRIDGE >> Core Veto Error:", data.error);
                throw new Error(data.error?.message || "Core Veto");
            }

            return data.result;
        } catch (fetchError) {
            console.error("BRIDGE >> Fetch/Network Error:", fetchError);
            throw fetchError;
        }
    }
};

export const discoverCore = CoreBridge.discoverCore;
export default CoreBridge;
