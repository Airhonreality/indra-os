/**
 * 🛰️ SchemaResolver: Unified Identity Service (Axiomatic Resolver)
 * Axiom: The system is agnostic to physical storage. UUID is the substance.
 * Maps UUID <-> Physical Drive IDs using System_Context.json.
 */
import CoreBridge from './CoreBridge';

class SchemaResolver {
    constructor() {
        this.context = {};
        this.isLoaded = false;
    }

    /**
     * Load the System Context from the Core.
     */
    async loadSystemContext() {
        try {
            console.log('[RESOLVER] Synchronizing System Context...');
            const result = await CoreBridge.callAction('getSystemContext');
            console.log('[RESOLVER] Raw result from Core:', result);

            const contextData = result?.context || result?.configuration || result;

            if (contextData && typeof contextData === 'object' && Object.keys(contextData).length > 0) {
                this.context = contextData;
                this.isLoaded = true;
                console.log(`[RESOLVER] System Context synchronized successfully. ${Object.keys(contextData).length} keys mapped.`);
                return this.context;
            } else {
                console.warn('[RESOLVER] Received empty context data:', result);
                return {};
            }
        } catch (error) {
            console.error('[RESOLVER] Pulse Failure:', error);
            return {};
        }
    }

    /**
     * Resolve a UUID to its physical Drive ID.
     */
    resolveUUID(uuid) {
        return this.context[uuid] || null;
    }

    /**
     * Resolve a Drive ID back to its UUID.
     */
    resolveDriveId(driveId) {
        return Object.keys(this.context).find(key => this.context[key] === driveId) || null;
    }

    /**
     * Update the local mapping.
     */
    registerMapping(uuid, driveId) {
        this.context[uuid] = driveId;
    }

    /**
     * Accessor for full context.
     */
    getContext() {
        return this.context;
    }
}

export const resolver = new SchemaResolver();
export default resolver;
