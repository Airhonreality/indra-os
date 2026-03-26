/**
 * =============================================================================
 * UTILIDAD: Crystallizer (Cristalizador)
 * RESPONSABILIDAD: Aduana de Sinceridad en el guardado de Documentos.
 * AXIOMA: Antes de salir del navegador, todo token debe ser resuelto 
 * a un estado persistente (Snapshot).
 * =============================================================================
 */

import { AxiomRegistry } from '../../../services/AxiomRegistry';

import { MetaComposer } from '../../services/MetaComposer';

export const Crystallizer = {
    /**
     * Cristaliza los bloques vivos en materia atómica persistente.
     * @param {Array} blocks - Bloques del AST
     * @param {Object} existingAtom - Átomo original para preservar metadatos
     * @param {string} userId - Identidad del autor
     */
    cristalizar(blocks, existingAtom = {}, userId = null) {
        // --- 1. PROCESAMIENTO SEMÁNTICO DE BLOQUES ---
        const crystallizedBlocks = blocks.map(block => {
            const node = { ...block };
            
            // Eliminar estados efímeros de UI
            delete node._ui;
            delete node._isDragging;
            
            return node;
        });

        // --- 2. COMPOSICIÓN DE IDENTIDAD SISTÉMICA ---
        // Usamos el MetaComposer para inyectar el bloque _meta
        const composedAtom = MetaComposer.compose({
            ...existingAtom,
            payload: {
                ...existingAtom.payload,
                blocks: crystallizedBlocks
            }
        }, { userId });

        return composedAtom.payload.blocks; // Por compatibilidad devolvemos solo bloques si es invocado así
    },

    /**
     * Versión que devuelve el átomo completo procesado con metadatos.
     */
    cristalizarAtomo(atom, blocks, userId) {
        // Envolvemos el procesamiento de bloques en la composición meta del átomo
        const payload = {
            ...atom.payload,
            blocks: this.cristalizar(blocks, atom, userId)
        };

        return MetaComposer.compose({
            ...atom,
            payload
        }, { userId });
    }
};
