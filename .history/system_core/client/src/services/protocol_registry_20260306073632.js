/**
 * =============================================================================
 * ARTEFACTO: services/protocol_registry.js
 * RESPONSABILIDAD: El Diccionario de Capacidades del Sistema.
 *
 * DHARMA:
 *   - Agnosticismo de Acción: Mapea protocolos técnicos a identidades visuales.
 *   - Sinceridad Operativa: Define qué requiere seguridad (hold) y qué no.
 * =============================================================================
 */

export const PROTOCOL_MAP = {
    'ATOM_READ': {
        icon: 'EYE',
        label: 'OPEN_ARTIFACT',
        color: 'var(--color-text-secondary)',
        activeColor: 'var(--color-accent)',
        requiresHold: false
    },
    'ATOM_UPDATE': {
        icon: 'SETTINGS',
        label: 'CONFIGURE',
        color: 'var(--color-text-secondary)',
        activeColor: 'var(--color-accent)',
        requiresHold: false
    },
    'ATOM_DELETE': {
        icon: 'DELETE',
        label: 'DELETE_PERMANENTLY',
        color: 'var(--color-danger)',
        activeColor: 'var(--color-danger)',
        requiresHold: true,
        holdTime: 1500
    },
    'SYSTEM_UNPIN': {
        icon: 'DELETE', // O un icono de desanclar si existe
        label: 'REMOVE_FROM_WORKSPACE',
        color: 'var(--color-warm)',
        activeColor: 'var(--color-danger)',
        requiresHold: true,
        holdTime: 1000
    },
    'HIERARCHY_TREE': {
        icon: 'FOLDER',
        label: 'EXPLORE_CONTENTS',
        color: 'var(--color-text-secondary)',
        activeColor: 'var(--color-accent)',
        requiresHold: false
    }
};

/**
 * Retorna la configuración visual para un protocolo dado.
 */
export function getActionForProtocol(protocol) {
    return PROTOCOL_MAP[protocol] || {
        icon: 'ATOM',
        label: protocol,
        color: 'var(--color-text-tertiary)',
        activeColor: 'var(--color-text-primary)',
        requiresHold: false
    };
}
