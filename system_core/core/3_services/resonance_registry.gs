/**
 * =============================================================================
 * ARTEFACTO: 3_services/resonance_registry.gs
 * RESPONSABILIDAD: Mapa de Capacidades y Rasgos Soberanos.
 * AXIOMA: Las clases son etiquetas; los rasgos son leyes.
 * =============================================================================
 */

// --- CATÁLOGO DE RASGOS (TRAITS) ---
const TRAIT = Object.freeze({
  PHYSICAL_RESONANCE: 'PHYSICAL_RESONANCE', // El átomo tiene presencia en el mundo físico
  IDENTITY_ANCHOR:    'IDENTITY_ANCHOR',    // El nombre físico manda sobre el lógico
  LOGICAL_SYNC:       'LOGICAL_SYNC',       // Propagación en cascada a otros átomos (Pins)
  PERISTALTIC:        'PERISTALTIC'         // Soporta flujos industriales de datos
});

// --- ANATOMÍA FÍSICA (ANCHORS) ---
// Define dónde se manifiesta físicamente cada átomo.
const ANCHOR_TYPE = Object.freeze({
  DNA_FILE:   'DNA_FILE',   // El archivo .json de metadatos (atom.id)
  CONTAINER:  'CONTAINER',  // La carpeta que contiene la materia (payload.cell_folder_id)
  TABULAR:    'TABULAR',    // Un archivo de hoja de cálculo vinculado
  LEDGER_ROW: 'LEDGER_ROW'  // La entrada en el Ledger Maestro
});

/**
 * MAPA MAESTRO DE CAPACIDADES Y ANATOMÍA
 * Define la estructura vital de cada clase de átomo.
 */
const RESONANCE_MAP = Object.freeze({
  'WORKSPACE': {
    traits: [TRAIT.PHYSICAL_RESONANCE, TRAIT.IDENTITY_ANCHOR, TRAIT.LOGICAL_SYNC],
    anchors: [ANCHOR_TYPE.DNA_FILE, ANCHOR_TYPE.CONTAINER, ANCHOR_TYPE.LEDGER_ROW]
  },
  'DATA_SCHEMA': {
    traits: [TRAIT.PHYSICAL_RESONANCE, TRAIT.LOGICAL_SYNC],
    anchors: [ANCHOR_TYPE.DNA_FILE, ANCHOR_TYPE.LEDGER_ROW]
  },
  'DOCUMENT': {
    traits: [TRAIT.PHYSICAL_RESONANCE],
    anchors: [ANCHOR_TYPE.DNA_FILE, ANCHOR_TYPE.LEDGER_ROW]
  },
  'WORKFLOW': {
    traits: [TRAIT.PHYSICAL_RESONANCE, TRAIT.LOGICAL_SYNC],
    anchors: [ANCHOR_TYPE.DNA_FILE, ANCHOR_TYPE.LEDGER_ROW]
  },
  'BRIDGE': {
    traits: [TRAIT.IDENTITY_ANCHOR],
    anchors: [ANCHOR_TYPE.DNA_FILE, ANCHOR_TYPE.LEDGER_ROW]
  },
  'SATELLITE': {
    traits: [TRAIT.IDENTITY_ANCHOR],
    anchors: [ANCHOR_TYPE.DNA_FILE, ANCHOR_TYPE.LEDGER_ROW]
  }
});

/**
 * Resuelve los rasgos de una clase específica.
 */
function resonance_registry_get_traits(atomClass) {
  return RESONANCE_MAP[atomClass]?.traits || [];
}

/**
 * Resuelve los anclajes físicos de una clase específica (Anatomía).
 * @returns {string[]} Lista de tipos de anclaje (DNA_FILE, CONTAINER, etc.)
 */
function resonance_registry_get_anchors(atomClass) {
  return RESONANCE_MAP[atomClass]?.anchors || [];
}

/**
 * Verifica si una clase tiene un rasgo específico.
 */
function resonance_registry_has_trait(atomClass, trait) {
  const traits = resonance_registry_get_traits(atomClass);
  return traits.includes(trait);
}
