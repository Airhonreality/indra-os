/**
 * Archetype_Registry.js
 * DHARMA: Registro Oficial de Arquetipos y Motores de Proyección.
 * Misión: Mapear cada Arquetipo a su Motor de Renderizado Universal (Engine).
 */

import VaultEngine from '../kernel/projections/engines/VaultEngine';
import NodeEngine from '../kernel/projections/engines/NodeEngine';
import CommunicationEngine from '../kernel/projections/engines/CommunicationEngine';
import RealityEngine from '../kernel/projections/engines/RealityEngine';
import ServiceEngine from '../kernel/projections/engines/ServiceEngine';
import SlotEngine from '../kernel/projections/engines/SlotEngine';
import DatabaseEngine from '../kernel/projections/engines/DatabaseEngine';
import IdentityEngine from '../kernel/projections/engines/IdentityEngine';


// Mapa de Arquetipos a Motores
const ARCHETYPE_REGISTRY = {
    // 1. PUENTES Y ALMACENAMIENTO (Bridge/Storage)
    'VAULT': VaultEngine,       // Bóvedas de Conocimiento (Drive, Notion)
    'BRIDGE': VaultEngine,      // Alias para vistas de puente
    'FILES': VaultEngine,       // Alias para sistemas de archivos
    'DATABASE': DatabaseEngine, // Nuevo: Motor de Bases de Datos agnóstico
    'GRID': DatabaseEngine,     // Alias para rejillas de datos
    'DATAGRID': DatabaseEngine, // Alias canónico para Hojas de Cálculo y Tablas

    // 2. COMUNICACIÓN (Messaging/Mail)
    'COMMUNICATION': CommunicationEngine,
    'MAIL': CommunicationEngine,
    'MESSAGING': CommunicationEngine,
    'CHAT': CommunicationEngine,
    'EMAIL': CommunicationEngine, // Added based on the intent from the edit snippet

    // 3. LÓGICA Y PROCESAMIENTO (Compute)
    'NODE': NodeEngine,         // Nodos de Procesamiento (Lógica Pura)
    'AGENT': NodeEngine,        // Agentes Inteligentes
    'SERVICE': ServiceEngine,   // Servicios de IA / Microservicios
    'LLM': ServiceEngine,       // Motor de Modelos de Lenguaje
    'INTELLIGENCE': ServiceEngine,

    // 4. REALIDAD Y ESPACIO (Spatial)
    'REALITY': RealityEngine,   // Motor ISK / WebGL
    'COSMOS': RealityEngine,    // Vista de Galaxia

    // 5. INFRAESTRUCTURA DE UI (Layout)
    'SLOT': SlotEngine,         // Contenedores dinámicos
    'SLOT_NODE': SlotEngine,    // Alias para motor de proyecciones
    'UTILITY': SlotEngine,      // Motor Base para Herramientas Mayores (Macro-Apps)
    'STYLING': NodeEngine,      // Alias para nodos de estilo (Widgets)
    'MATH': NodeEngine,         // Nodos de lógica matemática
    'WIDGET': NodeEngine,       // Micro-aplicaciones (Fallback a Node)

    // 6. ADAPTADORES (Legacy/External)
    'ADAPTER': NodeEngine,      // Conectores externos
    'IDENTITY': IdentityEngine, // Nuevo: Motor de Identidad y Credenciales
    'CONFIG': IdentityEngine,   // Alias para configuración de sistema


    // FALLBACK
    'DEFAULT': NodeEngine
};

/**
 * Resuelve el Motor de Renderizado para un Arquetipo dado.
 * @param {string} archetype - El arquetipo del artefacto (ej. 'VAULT').
 * @returns {React.Component} - El componente Engine correspondiente.
 */
export const resolveEngine = (archetype) => {
    const key = (archetype || 'DEFAULT').toUpperCase();
    const Engine = ARCHETYPE_REGISTRY[key] || ARCHETYPE_REGISTRY['DEFAULT'];

    if (!ARCHETYPE_REGISTRY[key]) {
        console.warn(`[ArchetypeRegistry] Unknown archetype: ${key}. Falling back to NODE.`);
    }

    return Engine;
};

export default ARCHETYPE_REGISTRY;



