/**
 * @file System_Hierarchy.gs
 * @description Define las leyes estructurales de la realidad del sistema de archivos del usuario (El "Cosmos").
 * Mantiene la jerarquía: ROOT -> DIRECTORY (Zona) -> FILE/SUBDIRECTORY.
 * @version 2.1 (Estandarizado)
 */

var SYSTEM_HIERARCHY = Object.freeze({
    "LEVELS": {
        "ROOT": { 
            "level": 0, 
            "description": "Raíz del Espacio Soberano del Usuario", 
            "max_depth": 0
        },
        "DIRECTORY": { 
            "level": 1, 
            "description": "Contenedores Semánticos de Nivel Superior", 
            "max_depth": 1 
        },
        "SUBDIRECTORY": { 
            "level": 2, 
            "description": "Agrupaciones Anidadas (Se desaconseja > 3 niveles)", 
            "max_depth": 4 
        },
        "FILE": { 
            "level": 99, 
            "description": "Unidades Funcionales Indivisibles", 
            "max_depth": 99 
        }
    },
    "TYPES": {
        "ROOT": "ROOT",
        "DIRECTORY": "DIRECTORY",
        "SUBDIRECTORY": "SUBDIRECTORY",
        "FILE": "FILE"
    },
    "TAXONOMY": {
        "FLOW": { "ext": ".flow.json", "archetype": "ORCHESTRATOR", "domain_hint": "LOGIC" },
        "VAULT": { "ext": ".vault.json", "archetype": "VAULT", "domain_hint": "DATA" },
        "SCHEMA": { "ext": ".schema.json", "archetype": "SCHEMA", "domain_hint": "CONTRACT" },
        "LAYOUT": { "ext": ".layout.json", "archetype": "TRANSFORM", "domain_hint": "PROJECTION" },
        "CORE": { "ext": ".gs", "archetype": "SERVICE", "domain_hint": "SYSTEM" }
    }
});

var CONTAINMENT_RULES = Object.freeze({
    "ROOT": ["DIRECTORY", "FILE"], // La raíz puede contener Directorios y Archivos de Configuración
    "DIRECTORY": ["SUBDIRECTORY", "FILE"],
    "SUBDIRECTORY": ["SUBDIRECTORY", "FILE"],
    "FILE": [] // Los archivos son terminales
});

/**
 * Clasifica una entidad basándose en su tipo MIME y profundidad en la jerarquía.
 */
function classifyEntity(mimeType, depth) {
  const isFolder = mimeType === MimeType.FOLDER || mimeType === 'application/vnd.google-apps.folder';

  if (depth === 0) return SYSTEM_HIERARCHY.TYPES.ROOT;

  if (isFolder) {
    if (depth === 1) return SYSTEM_HIERARCHY.TYPES.DIRECTORY;
    return SYSTEM_HIERARCHY.TYPES.SUBDIRECTORY;
  }

  // Si no es una carpeta, es un archivo
  return SYSTEM_HIERARCHY.TYPES.FILE;
}

/**
 * Valida si un tipo de padre puede contener un tipo de hijo.
 */
function validateLink(parentType, childType) {
  const allowedChildren = CONTAINMENT_RULES[parentType];
  if (!allowedChildren) return false;
  return allowedChildren.includes(childType);
}

// Exportación para consumo
if (typeof module !== 'undefined') {
  module.exports = { SYSTEM_HIERARCHY, CONTAINMENT_RULES, classifyEntity, validateLink };
}





