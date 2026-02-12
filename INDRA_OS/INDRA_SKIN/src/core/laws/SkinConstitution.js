/**
 * src/core/laws/SkinConstitution.js
 * 
 * 🗺️ MAPA DE POSICIONAMIENTO AXIOMÁTICO
 * Define dónde vive visualmente cada tipo de consciencia.
 * 
 * Este archivo reemplaza a UI_Layout_Axioms.gs del Core.
 */

export const SKIM_INTENT_MAP = Object.freeze({
    // Intención -> Slot Destino
    // ENMIENDA v1.0 (Tabula Rasa): Todo tiende al Centro.
    'BRIDGE': 'CANVAS_MAIN',
    'IDEATION': 'CANVAS_MAIN',
    'DASHBOARD': 'CANVAS_MAIN',
    'ORCHESTRATION': 'CANVAS_MAIN',

    // Anteriormente Sidebars, ahora centralizados para revisión agnóstica
    'COMMUNICATION': 'CANVAS_MAIN',
    'ASSISTANCE': 'CANVAS_MAIN',
    'INSPECTION': 'CANVAS_MAIN',
    'DIAGNOSTIC': 'CANVAS_MAIN',

    'GATE': 'CANVAS_MAIN',
    'NAVIGATION': 'CANVAS_MAIN',
    'EXPLORATION': 'CANVAS_MAIN',
    'IDENTITY': 'CANVAS_MAIN',

    // Excepciones técnicas
    'MONITORING': 'TERMINAL_STATUS',
    'SYSTEM': 'HIDDEN'
});

export const DEFAULT_SLOT = 'CANVAS_MAIN';

/**
 * Resuelve el Slot para un componente dado su Canon.
 */
export function inferSlot(canon) {
    if (!canon) return DEFAULT_SLOT;

    const intent = (canon.SEMANTIC_INTENT || canon.semantic_intent || '').toUpperCase();
    const archetype = (canon.ARCHETYPE || canon.archetype || '').toUpperCase();

    // 1. Prioridad: Intención Semántica
    if (intent && SKIM_INTENT_MAP[intent]) {
        return SKIM_INTENT_MAP[intent];
    }

    // 2. Prioridad: Detección Técnica (Sanity Check para Gateway/Commander)
    const label = (canon.LABEL || '').toUpperCase();
    if (label.includes('GATEWAY') || label.includes('COMMANDER') || label.includes('SYSTEM')) {
        return 'SIDEBAR_SECONDARY';
    }

    // 3. Prioridad: Arquetipo (Fallback)
    // ENMIENDA v1.0: Libertad de Movimiento.
    // Todos los arquetipos fluyen al Default, salvo Servicios puros.
    if (archetype === 'SERVICE') return 'TERMINAL_STATUS'; // Servicios a la barra inferior? O Hidden.

    return DEFAULT_SLOT;
}
