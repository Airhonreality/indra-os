 Blueprint OMD-07: Explorador de Proyectos (The Archivist)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_project_explorer
Nombre Funcional: Explorador de Proyectos (The Archivist).
Naturaleza: Módulo de Vista de Nivel 1 (Escenario Principal).
Primitiva Vinculada: Topology_Laws + Project_Manager + PublicAPI.gs.
Axioma de Diseño: "La navegación es la conciencia del Cosmos; la selección es la Ignición de una Realidad."
2. Anatomía y Distribución de la Interfaz (UI Shell)
El Archivista se presenta como un panel lateral de alta densidad, optimizado para la navegación jerárquica y la gestión del ciclo de vida de las realidades.
A. Cabecera de Navegación Global (The Cosmos Selector)
Selector de Cosmos: Dropdown/Botón con icono Globe para cambiar entre Namespaces (ej: "Mi Cosmos", "Cosmos Compartido").
Buscador de Proyectos: Input con autocompletado para localizar proyectos por nombre o ID.
Botón de Creación: Icono Plus para invocar el Creation_Hub (crear nuevo proyecto/artefacto).
B. El Árbol de Proyectos (The Reality Tree)
TREE_VIEW_ACCORDION: Estructura jerárquica colapsable:
Proyecto (Contenedor):
Nombre: project.name.
Estado: Icono breathing si es el proyecto activo (motion: "breathing").
Acciones Contextuales: Right-Click para Clonar, Archivar, Eliminar (con validación).
Artefacto (Entidad):
Icono: Según archetype (Flow, Vault, Layout).
Nombre: artifact.name.
Estado de Salud: Icono Warning si es "Materia Impura" (ver Topology_Laws).
Acciones Contextuales: Right-Click para Abrir, Inspeccionar (invoca OMD-05).
C. Pie de Estado (The Integrity Pulse)
Status de Sincronización: Topology_Status: SYNCED / OFFLINE / ERROR.
Contador de Artefactos: Total: X Flows, Y Vaults, Z Layouts.
3. Definición Funcional (El "Qué")
El Archivista es el guardián de la Topology_Laws, garantizando la coherencia del Cosmos de Indra.
A. Protocolo de Ignición (SYSTEM_IGNITION)
Acción: Al seleccionar un project_id.
Mecánica: Emite un evento SYSTEM_IGNITION(project_id) al CoreOrchestrator.
Efecto: Dispara la hidratación de todos los demás módulos de Nivel 1 y 2 (OMD-03, OMD-09, OMD-10, OMD-05).
B. Gestión de "Materia Impura" (Integrity Check)
Acción: Escaneo periódico o bajo demanda de la Topology_Laws.
Mecánica: Compara el flow.json con los archivos físicos en Drive.
Efecto: Marca los artefactos con status: "IMPURO" si hay discrepancias (ej: archivo borrado, esquema corrupto). Ofrece Repair_Tools.
C. Clonación Axiomática
Acción: Duplicar un Flow o Layout.
Mecánica: Crea una copia profunda del JSON, genera nuevos UUIDs y registra el nuevo artefacto en Topology_Laws.
Validación: Previene la clonación si el ANCHOR_ID del proyecto ya existe.
4. Comportamiento Camaleónico (Adaptatividad)
El Archivista se adapta al contexto del usuario y del sistema.
Regla de Mutación 01 (Filtro de Arquetipo): Los filtros de búsqueda resaltan los artefactos por su archetype (VAULT, FLOW, LAYOUT) usando la Visual_Grammar.
Regla de Mutación 02 (Estado de Hibernación): Los proyectos no accedidos en X tiempo se muestran con opacity: 0.4 y un icono Moon para indicar estado latente.
Regla de Mutación 03 (Refactor Shield): Si el Core reporta un cambio estructural en Topology_Laws, el Archivista muestra un WARNING y sugiere una migración.
5. Estrategia de Scaffolding (Andamiaje)
Estado Fantasma (Ghost State): Al cargar, el Archivista muestra la estructura de Cosmos y Proyectos con skeleton_loaders antes de que los nombres reales se hidraten desde Topology_Laws.
Hidratación Progresiva: Los nombres de los proyectos aparecen con un efecto de "escaneo" (radar-sweep) a medida que Topology_Laws confirma su existencia.
6. JSON del Artefacto: view_project_explorer
code
JSON
{
  "omd_07": {
    "id": "view_project_explorer",
    "clase_ui": "HIERARCHICAL_NAVIGATOR",
    "laws_reference": {
      "topology": "Topology_Laws",
      "logic": "Logic_Axioms",
      "visual": "Visual_Grammar"
    },
    "sub_artefactos": [
      {
        "id": "cosmos_selector",
        "tipo": "NAMESPACE_SWITCHER",
        "visual": { "container": "glass-panel-neon", "icon": "Globe" },
        "events": { "onSelect": "EMIT_SYSTEM_IGNITION" }
      },
      {
        "id": "project_tree",
        "tipo": "TREE_VIEW_ACCORDION",
        "visual": { "row_height": 30, "font_style": "mono-bold" },
        "events": {
          "onSelectProject": "EMIT_SYSTEM_IGNITION",
          "onSelectArtifact": "INVOKE_OMD_05"
        }
      },
      {
        "id": "artifact_card",
        "tipo": "ENTITY_PREVIEW",
        "visual": { "width": 220, "motion": "static" },
        "actions": ["OPEN", "INSPECT", "CLONE", "ARCHIVE"]
      },
      {
        "id": "creation_hub",
        "tipo": "ACTION_BAR",
        "visual": { "intent": "EXECUTE", "token": "var(--accent-primary)" },
        "actions": ["CREATE_PROJECT", "CREATE_FLOW", "CREATE_LAYOUT"]
      }
    ]
  }
}
7. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
Prevención de Colisión de Realidades: El Archivista es el guardián que impide que el usuario abra dos proyectos que compartan el mismo ANCHOR_ID, evitando la corrupción de datos.
Reducción de Carga Cognitiva: Utiliza una Jerarquía de Profundidad. No muestra todos los archivos de golpe, sino que guía al usuario: Cosmos > Proyecto > Artefacto.
Reproceso de "Archivo Perdido": Si un artefacto no cumple con su Contract_Blueprint, el Archivista lo marca con un icono de "Materia Impura" y ofrece una herramienta de reparación automática.
Veredicto del Arquitecto
El OMD-07 Maestro es el Centro de Control de Realidades. Su diseño es robusto, coherente y esencial para la navegación y gestión de proyectos en INDRA.