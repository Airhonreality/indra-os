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
    {
        id: 'schema_designer',
        class: 'DATA_SCHEMA',
        label: 'DATA_SCHEMA',
        description: 'Define estructuras de captura y validación.',
        icon: 'SCHEMA',
        color: 'var(--color-accent)',
        order: 1
    },
    {
        id: 'bridge_designer',
        class: 'BRIDGE',
        label: 'LOGIC_BRIDGE',
        description: 'Alambra flujos de transformación y lógica.',
        icon: 'BRIDGE',
        color: 'var(--color-cold)',
        order: 2
    },
    {
        id: 'document_designer',
        class: 'DOCUMENT',
        label: 'DOCUMENT_TEMPLATE',
        description: 'Diseña plantillas de salida y reportes.',
        icon: 'DOCUMENT',
        color: 'var(--color-warm)',
        order: 3
    }
];

export function getEngineForClass(atomClass) {
    return ENGINE_MANIFESTS.find(m => m.class === atomClass);
}
