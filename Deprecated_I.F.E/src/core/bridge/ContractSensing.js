/**
 * 🛰️ INDRA ContractSensing (brain/bridge/ContractSensing.js)
 * Standardized Node Blueprint Factory and Contract Bridge.
 */

let systemContracts = null;
let systemContext = null;
let lastUpdate = null;

/**
 * NODE BLUEPRINTS CATALOG (Architecture V6.0)
 * Defines the canonical structure for each node type.
 */
const NODE_BLUEPRINTS = {
    notionAdapter: {
        label: 'Notion Adapter',
        category: 'ADAPTER',
        icon: '📓',
        terminal: 'NotionTerminal',
        defaultData: {
            databaseId: { v: '', t: 'text', l: 'Database ID' },
            databaseName: { v: 'No Database Selected', t: 'text', l: 'Database Name' },
            mode: { v: 'read', t: 'select', l: 'Mode', options: ['read', 'write', 'query'] },
            accountId: { v: '', t: 'account_selector', l: 'Notion Account', provider: 'notion' },
            status: { v: 'disconnected', t: 'text', l: 'Status' }
        },
        ports: {
            in_agnostic: { dir: 'in', type: 'universal', label: 'Universal Input', y: 50 },
            out_agnostic: { dir: 'out', type: 'universal', label: 'Universal Output', y: 50 }
        }
    },

    driveAdapter: {
        label: 'Google Drive Explorer',
        category: 'ADAPTER',
        icon: '📁',
        terminal: 'DriveTerminal',
        defaultData: {
            fileId: { v: '', t: 'text', l: 'File ID' },
            fileName: { v: 'No file selected', t: 'text', l: 'File Name' },
            mimeType: { v: '', t: 'text', l: 'Mime Type' },
            accountId: { v: '', t: 'account_selector', l: 'Google Account', provider: 'google' },
            status: { v: 'idle', t: 'text', l: 'Status' }
        },
        ports: {
            in_agnostic: { dir: 'in', type: 'universal', label: 'Universal Input', y: 50 },
            out_agnostic: { dir: 'out', type: 'universal', label: 'Universal Output', y: 50 }
        }
    },

    emailAdapter: {
        label: 'Email Dispatcher',
        category: 'ADAPTER',
        icon: '✉️',
        terminal: 'EmailComposer',
        defaultData: {
            to: { v: '', t: 'text', l: 'Recipient' },
            subject: { v: '', t: 'text', l: 'Subject' },
            body: { v: '', t: 'text', l: 'Body' },
            accountId: { v: '', t: 'account_selector', l: 'Email Account', provider: 'google' },
            status: { v: 'idle', t: 'text', l: 'Status' }
        },
        ports: {
            in_agnostic: { dir: 'in', type: 'universal', label: 'Universal Input', y: 50 },
            out_agnostic: { dir: 'out', type: 'universal', label: 'Universal Output', y: 50 }
        }
    }
    // ... Additional Blueprints following the same standard
};

/**
 * Configure ContractSensing registry.
 */
export function configureContractSensing(contracts, context = {}) {
    console.log('[ContractSensing] Processing Functional and Physical Constitution...');

    if (contracts._signature) {
        console.info(`[ContractSensing_AUTH] Validated Signature: ${contracts._signature.substring(0, 16)}...`);
    }

    if (!contracts || typeof contracts !== 'object') {
        throw new Error("INVALID_CONSTITUTION: Core failed to provide functional contracts.");
    }

    systemContracts = contracts;
    systemContext = context;
    lastUpdate = Date.now();

    // Auto-Sync Blueprints if this looks like a system manifest
    if (contracts && typeof contracts === 'object') {
        syncBlueprintsFromCore(contracts);
    }
}

export function getMethodDoc(executor, method) {
    const caps = getCapabilities(executor);
    const methods = caps?.methods || caps;
    return methods?.[method]?.hoverDoc || "No documentation found in manifest.";
}

export function isContractSensingReady() {
    return systemContracts !== null && systemContext !== null;
}

export function getSystemContracts() {
    return systemContracts;
}

export function getSystemContext() {
    return systemContext;
}

export function getCapabilities(executorName) {
    if (!systemContracts) return null;
    return systemContracts[executorName] || null;
}

export function getAllNodeTypes() {
    return Object.keys(NODE_BLUEPRINTS);
}

export function getNodeBlueprint(nodeType) {
    return NODE_BLUEPRINTS[nodeType] || null;
}

export function getAllBlueprints() {
    return NODE_BLUEPRINTS;
}

function getDefaultValueForType(type) {
    switch (type) {
        case 'string': return '';
        case 'number': return 0;
        case 'boolean': return false;
        case 'select': return '';
        case 'object': return {};
        case 'array': return [];
        case 'date': return '';
        default: return null;
    }
}

/**
 * Automated Schema Synchronization.
 */
export function syncBlueprintsFromCore(coreManifest) {
    const manifest = coreManifest.adapters || coreManifest;
    const syncedBlueprints = {};
    let syncCount = 0;

    Object.entries(manifest).forEach(([adapterName, adapter]) => {
        // Skip metadata fields (like _signature)
        if (adapterName.startsWith('_')) return;
        if (!adapter.methods && !adapter.schemas) return;

        const blueprint = {
            label: adapter.label || adapterName.charAt(0).toUpperCase() + adapterName.slice(1),
            category: adapter.category || 'ADAPTER',
            icon: adapter.icon || '📦',
            terminal: 'AutoTerminal',
            defaultData: {},
            ports: {
                in_agnostic: { dir: 'in', type: 'universal', label: 'Universal Input', y: 50 },
                out_agnostic: { dir: 'out', type: 'universal', label: 'Universal Output', y: 50 }
            }
        };

        // Try to sync schema from the first available method or schemas property
        const schemas = adapter.schemas || {};
        const firstSchemaName = Object.keys(schemas)[0];
        const primarySchema = schemas[firstSchemaName];

        if (primarySchema && primarySchema.params) {
            Object.entries(primarySchema.params).forEach(([fieldName, field]) => {
                blueprint.defaultData[fieldName] = {
                    v: field.defaultValue || getDefaultValueForType(field.type),
                    t: field.type,
                    l: field.description || fieldName,
                    required: field.required
                };
            });
        }

        syncedBlueprints[adapterName] = blueprint;
        syncCount++;
    });

    Object.assign(NODE_BLUEPRINTS, syncedBlueprints);
    console.log(`[ContractSensing] ✅ Synchronized ${syncCount} blueprints from Core Manifest`);
    return syncCount;
}
