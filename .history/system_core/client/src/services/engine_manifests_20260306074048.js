/**
 * =============================================================================
 * ARTEFACTO: services/engine_manifests.js
 * RESPONSABILIDAD: El Receptor de Identidad de Motores.
 *
 * DHARMA:
 *   - Proporcionar un punto de descubrimiento agnóstico para que el Dashboard 
 *     sepa qué puede crear y cómo debe editarlo.
 * 
 * AXIOMAS:
 *   - Un motor no existe si no tiene un Manifiesto en esta lista.
 *   - La clase (class) del átomo es la clave primaria de descubrimiento.
 * 
 * RESTRICCIONES:
 *   - NO contiene lógica de ejecución. Solo metadatos y punteros a iconos.
 * =============================================================================
 */

export const ENGINE_MANIFESTS = [
    icon: 'SCHEMA',
    color: 'var(--color-accent)',
    order: 1,
    canCreate: true
    },
{
    id: 'bridge_designer',
        class: 'BRIDGE',
            label: 'LOGIC_BRIDGE',
                description: 'Alambra flujos de transformación y lógica.',
                    icon: 'BRIDGE',
                        color: 'var(--color-cold)',
                            order: 2,
                                canCreate: true
},
{
    id: 'document_designer',
        class: 'DOCUMENT',
            label: 'DOCUMENT_TEMPLATE',
                description: 'Diseña plantillas de salida y reportes.',
                    icon: 'DOCUMENT',
                        color: 'var(--color-warm)',
                            order: 3,
                                canCreate: true
},
{
    id: 'infra_silo',
        class: 'FOLDER',
            label: 'STORAGE_SILO',
                description: 'Explorador de archivos y almacenamiento externo.',
                    icon: 'FOLDER',
                        color: 'var(--color-text-tertiary)',
                            order: 9
},
{
    id: 'identity_core',
        class: 'ACCOUNT_IDENTITY',
            label: 'ACCOUNT',
                description: 'Identidad y permisos del usuario.',
                    icon: 'USER',
                        color: 'var(--color-accent)',
                            order: 10
}
];

export function getEngineForClass(atomClass) {
    return ENGINE_MANIFESTS.find(m => m.class === atomClass);
}
