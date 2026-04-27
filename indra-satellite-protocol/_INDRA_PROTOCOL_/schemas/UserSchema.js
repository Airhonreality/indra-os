/**
 * =============================================================================
 * INDRA CANONICAL SCHEMA: User Identity (v1.0)
 * =============================================================================
 * Dharma: Definir la estructura universal de un Sujeto Soberano en la malla.
 * Este esquema es agnóstico y debe ser extendido vía relaciones, no campos.
 * =============================================================================
 */

export const UserSchema = {
    class: 'IDENTITY',
    handle: {
        ns: 'com.indra.system.user',
        alias: 'user',
        label: 'Sujetos Soberanos'
    },
    payload: {
        fields: [
            { id: 'email', label: 'Correo Electrónico', type: 'string', required: true },
            { id: 'name', label: 'Nombre Completo', type: 'string' },
            { id: 'google_id', label: 'Google Identity ID', type: 'string' },
            { id: 'role', label: 'Rol de Acceso (UI)', type: 'enum', options: ['STAFF', 'CLIENT', 'ADMIN', 'GUEST'] },
            { id: 'avatar_url', label: 'Foto de Perfil', type: 'url' }
        ],
        // Axioma: La seguridad real emana de los Scopes del Llavero, no de este JSON.
        metadata: {
            is_canonical: true,
            version: '1.0.0'
        }
    }
};
