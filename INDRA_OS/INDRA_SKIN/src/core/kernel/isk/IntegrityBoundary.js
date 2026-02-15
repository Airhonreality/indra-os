/**
 * 🛡️ ISK: INTEGRITY BOUNDARY
 * El firewall arquitectónico del Indra Spatial Kernel.
 * Asegura la coherencia absoluta entre el Core y el Hybrid.
 */

export class IntegrityBoundary {
    constructor() {
        this.schemaSnapshots = new Map(); // ID -> Hash del esquema
    }

    /**
     * 1. STRUCTURAL VALIDATOR
     * Verifica que los datos recibidos del Core coincidan con lo que el JIT compiló.
     * @param {Object} coreState - El estado vivo del Core.
     * @param {Object} compiledLaws - Las leyes compiladas por el JIT.
     */
    validateStructure(coreState, compiledLaws) {
        const missingFields = new Set();

        // Recorremos las leyes para ver qué dependencias tienen
        for (const [id, law] of Object.entries(compiledLaws)) {
            for (const [attr, jitResult] of Object.entries(law)) {
                jitResult.dependencies.forEach(dep => {
                    // dep suele ser "core.power"
                    const value = this._getValueByPath(coreState, dep);
                    if (value === undefined) {
                        missingFields.add(dep);
                    }
                });
            }
        }

        if (missingFields.size > 0) {
            return {
                step: 'HANDSHAKE',
                status: 'CRITICAL',
                message: 'Incoherencia Estructural Detectada',
                missing: Array.from(missingFields)
            };
        }

        return { status: 'VALID' };
    }

    /**
     * 2. EXPLOITATION AUDITOR
     * Identifica si el Core está enviando datos que el Hybrid ignora (Sub-explotación).
     * @param {Object} coreState 
     * @param {Object} compiledLaws 
     */
    auditExploitation(coreState, compiledLaws) {
        const allCoreFields = this._getAllPaths(coreState);
        const usedFields = new Set();

        for (const law of Object.values(compiledLaws)) {
            for (const jitResult of Object.values(law)) {
                jitResult.dependencies.forEach(dep => usedFields.add(dep));
            }
        }

        const unusedFields = allCoreFields.filter(field => !usedFields.has(field));

        if (unusedFields.length > 0) {
            return {
                status: 'WARNING',
                message: 'Sub-explotación de Datos Detectada',
                unusedRatio: `${unusedFields.length}/${allCoreFields.length}`,
                unusedFields
            };
        }

        return { status: 'OPTIMAL' };
    }

    /**
     * 3. REFACTOR SHIELD
     * Registra un snapshot del esquema actual para detectar cambios futuros.
     */
    createRefactorSnapshot(id, coreState) {
        const snapshot = JSON.stringify(this._getAllPaths(coreState).sort());
        this.schemaSnapshots.set(id, snapshot);
    }

    checkRefactorDebt(id, coreState) {
        if (!this.schemaSnapshots.has(id)) return { status: 'NEW' };

        const current = JSON.stringify(this._getAllPaths(coreState).sort());
        const last = this.schemaSnapshots.get(id);

        if (current !== last) {
            return {
                status: 'REFACTOR_ALARM',
                message: 'Cambio de esquema detectado en el Core. El ISK puede estar desactualizado.'
            };
        }

        return { status: 'SAFE' };
    }

    _getValueByPath(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    _getAllPaths(obj, prefix = '') {
        return Object.keys(obj).reduce((res, el) => {
            const fullPath = prefix ? `${prefix}.${el}` : el;
            if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
                return res.concat(this._getAllPaths(obj[el], fullPath));
            }
            return res.concat([fullPath]);
        }, []);
    }
}



