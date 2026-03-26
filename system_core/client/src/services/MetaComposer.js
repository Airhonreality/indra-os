/**
 * =============================================================================
 * SERVICIO: MetaComposer.js
 * DOGMA: Determinismo y No Sorpresa
 * =============================================================================
 * Responsable de crear, actualizar y calcular la huella digital del bloque _meta.
 */
import { buildInitialMeta, buildCloneMeta } from '../contracts/AtomMeta';

export const MetaComposer = {
    /**
     * Enriquece un átomo con _meta antes de guardarlo.
     * Actualiza solo los campos de mutación si ya existe.
     */
    compose(atom, { userId } = {}) {
        const existingMeta = atom._meta || buildInitialMeta({ createdBy: userId });
        
        // --- CALCULAR HUELLA DE INTEGRIDAD ---
        const payloadToHash = atom.payload || {};
        const hash = this._computeHash(payloadToHash);

        return {
            ...atom,
            _meta: {
                ...existingMeta,
                mutated_at:     new Date().toISOString(),
                mutant_id:      userId || existingMeta.mutant_id,
                integrity_hash: hash,
            }
        };
    },

    /**
     * Crea un clon basado en un original, conservando el linaje.
     */
    clone(originAtom, { userId } = {}) {
        const clonedAtomData = {
            class:  originAtom.class,
            handle: { 
                ...originAtom.handle, 
                label: `${originAtom.handle?.label} (Importado)` 
            },
            payload: JSON.parse(JSON.stringify(originAtom.payload || {})),
            _meta:   buildCloneMeta({ 
                createdBy: userId, 
                originAtom 
            }),
        };
        return clonedAtomData;
    },

    /**
     * Compara un clon con su origen para detectar derivas estructurales.
     */
    detectDrift(atom, originAtom) {
        if (!atom._meta?.origin_id) return 'SOVEREIGN';
        if (!originAtom) return 'ORPHAN';
        if (atom._meta.origin_hash !== originAtom._meta?.integrity_hash) return 'DIVERGENT';
        return 'SYNCED';
    },

    /** Hash FNV-1a simple y rápido para integridad estructural. */
    _computeHash(payload) {
        const str = JSON.stringify(payload);
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
        }
        return hash.toString(16);
    }
};
