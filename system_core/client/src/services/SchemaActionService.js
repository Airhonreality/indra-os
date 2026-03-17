/**
 * =============================================================================
 * SERVICIO: SchemaActionService.js
 * RESPONSABILIDAD: Mutaciones estructurales en Átomos de Esquema.
 * DHARMA:
 *   - Sinceridad Jerárquica: Mantiene la integridad del AST.
 *   - Ubicuidad: Permite actualizar esquemas desde cualquier Engine.
 * =============================================================================
 */

import { executeDirective } from './directive_executor';

export const SchemaActionService = {
    /**
     * Añade un nuevo campo a un esquema existente.
     */
    async addField(schemaAtom, options = {}, protocol) {
        const { 
            parentId = null, 
            type = 'TEXT', 
            label = 'NUEVO CAMPO',
            alias = null 
        } = options;

        const newField = {
            id: 'field_' + Date.now(),
            label: label,
            alias: alias || 'nuevo_campo_' + Math.floor(Math.random() * 10000),
            type: type,
            children: []
        };

        const updatedFields = this._injectField(schemaAtom.payload.fields, parentId, newField);

        // AXIOMA DE RESONANCIA: Si el átomo es resonante, usamos SCHEMA_MUTATE
        const isResonant = schemaAtom.origin === 'RESONANT' || schemaAtom.payload?.external_ref;

        return await executeDirective({
            provider: schemaAtom.provider || 'system',
            protocol: isResonant ? 'SCHEMA_MUTATE' : 'ATOM_UPDATE',
            context_id: schemaAtom.id,
            data: {
                payload: {
                    ...schemaAtom.payload,
                    fields: updatedFields
                },
                strategy: isResonant ? 'RESISTANCE_SYNC' : 'OVERWRITE'
            }
        }, protocol.url, protocol.secret);
    },

    /**
     * Elimina un campo de la estructura.
     */
    async removeField(schemaAtom, fieldId, protocol) {
        const updatedFields = this._pruneField(schemaAtom.payload.fields, fieldId);

        // AXIOMA DE RESONANCIA: Si el átomo es resonante, usamos SCHEMA_MUTATE
        const isResonant = schemaAtom.origin === 'RESONANT' || schemaAtom.payload?.external_ref;

        return await executeDirective({
            provider: schemaAtom.provider || 'system',
            protocol: isResonant ? 'SCHEMA_MUTATE' : 'ATOM_UPDATE',
            context_id: schemaAtom.id,
            data: {
                payload: {
                    ...schemaAtom.payload,
                    fields: updatedFields
                },
                strategy: isResonant ? 'RESISTANCE_SYNC' : 'OVERWRITE'
            }
        }, protocol.url, protocol.secret);
    },

    /**
     * Helper recursivo para inyectar campos.
     */
    _injectField(fields, parentId, newField) {
        if (!parentId) return [...fields, newField];

        return fields.map(f => {
            if (f.id === parentId) {
                return { ...f, children: [...(f.children || []), newField] };
            }
            if (f.children) {
                return { ...f, children: this._injectField(f.children, parentId, newField) };
            }
            return f;
        });
    },

    /**
     * Helper recursivo para podar campos.
     */
    _pruneField(fields, fieldId) {
        return fields
            .filter(f => f.id !== fieldId)
            .map(f => {
                if (f.children) {
                    return { ...f, children: this._pruneField(f.children, fieldId) };
                }
                return f;
            });
    }
};
