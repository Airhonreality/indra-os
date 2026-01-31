Blueprint OMD-07: Explorador de Proyectos (The Archivist)
Este módulo es la encarnación de la Ley 1.3: Topology_Laws. Su misión es mapear el Cosmos de Indra OS para que el usuario pueda navegar entre realidades sin perder la cordura.
1. Identificación y Alcance (ID & Context)
ID Técnico: view_project_explorer
Nombre Funcional: Explorador de Proyectos (El Archivista).
Primitiva Vinculada: Topology_Laws / PROJECT_MANAGEMENT.
Arquetipo Visual: SYSTEM_INFRA (Usa container_style: "glass-panel-dim", motion: "static", header_icon: "Cpu").
2. Definición Funcional (El "Qué")
Objetivo Primario: Visualizar y gestionar la jerarquía de Namespaces (Cosmos), Contenedores (Proyectos) y Entidades (Artefactos), garantizando la segregación lógica de datos.
Acciones Atómicas:
Navegar Cosmos: Cambiar entre espacios de trabajo compartidos.
Abrir Proyecto: Cargar el grafo de flujos y sus bóvedas asociadas.
Clonar Artefacto: Duplicar un Flow o Layout manteniendo la integridad del Contract_Blueprint.
Archivar: Mover entidades al estado de "Inhibición" (Ley 1.1).
3. Modelo de Datos e Interfaz (El "Contrato")
Input JSON (Mapa de Topología):
code
JSON
{
  "cosmos_id": "indra_main_01",
  "projects": [
    {
      "project_id": "p_001",
      "name": "Bot Agendador WA",
      "artifacts": {
        "flows": ["f_wa_01"],
        "vaults": ["v_meta_01", "v_google_01"],
        "layouts": ["l_dashboard_01"]
      }
    }
  ]
}
Output JSON: Envía el project_id seleccionado para disparar la Hidratación del sistema.
Estado de Sincronía: BAJO DEMANDA (On-Demand). Solo se actualiza cuando hay cambios en la estructura de Drive.
4. Comportamiento Camaleónico (Adaptatividad)
Regla de Mutación 01 (Filtro de Arquetipo): Si el usuario busca "Vaults", el explorador oculta los "Flows" y resalta las Bóvedas usando el border_color de la Visual_Grammar.
Regla de Mutación 02 (Estado de Proyecto Abierto): El proyecto activo brilla con un motion: "breathing" para indicar que es la "Realidad Actual".
5. Estrategia de Scaffolding (Andamiaje)
Estado Fantasma (Ghost State): Al iniciar, el Archivista proyecta los "Slots" de los Cosmos disponibles. No hay nombres aún, solo la estructura de la UI_Distribution.
Hidratación: Los nombres de los proyectos aparecen con un efecto de "escaneo" (radar-sweep) a medida que Topology_Laws confirma su existencia en Drive.
6. Análisis de Ergonomía Cognitiva (Uso en Campo)
Prevención de Colisión de Realidades: El Archivista impide abrir dos proyectos que compartan el mismo ANCHOR_ID de la System_Constitution para evitar la corrupción de datos.
Reducción de Carga de Memoria: Utiliza una Jerarquía de Profundidad. No muestra todos los archivos de golpe, sino que sigue el flujo: Cosmos > Proyecto > Artefacto.
Reproceso de "Archivo Perdido": Si un artefacto no cumple con su Contract_Blueprint, el Archivista lo marca con un icono de "Materia Impura" y ofrece una herramienta de reparación automática.
JSON de Artefacto: view_project_explorer
Este JSON es el mapa que el desarrollador usará para construir el "Cuerpo" del Archivista.
code
JSON
{
  "artefacto": {
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
        "ciclo_uso": "El usuario elige el 'Universo' de trabajo. Cambia todo el contexto de APIs y Bóvedas."
      },
      {
        "id": "project_tree",
        "tipo": "TREE_VIEW_ACCORDION",
        "visual": { "row_height": 30, "font_style": "mono-bold" },
        "ciclo_uso": "Navegación por proyectos. Al expandir un proyecto, se invocan los arquetipos de 'Logic_Axioms' para etiquetar los archivos."
      },
      {
        "id": "artifact_card",
        "tipo": "ENTITY_PREVIEW",
        "visual": { "width": 220, "motion": "static" },
        "ciclo_uso": "Muestra detalles rápidos de un Flow o Vault (Fecha de creación, estado de salud, última ejecución)."
      },
      {
        "id": "creation_hub",
        "tipo": "ACTION_BAR",
        "visual": { "intent": "EXECUTE", "token": "var(--accent-primary)" },
        "ciclo_uso": "Botones para crear 'Nueva Realidad' (Proyecto) o 'Nuevo Artefacto'. Valida contra 'Contract_Blueprints' antes de crear el archivo en Drive."
      }
    ]
  }
}
Notas de Auditoría para el Desarrollador:
Integridad de la Ley: El Archivista es el guardián de la Topology_Laws. No debe permitir la creación de ningún archivo que no esté registrado en el Contract_Blueprints.
Espacialidad: Aunque es un panel lateral, debe respetar el SIDEBAR_LEFT_WIDTH: 320 definido en la UI_Distribution.
Sincronización: Cuando el usuario selecciona un proyecto aquí, este módulo debe enviar una señal de "Ignición" a todos los demás paneles para que se "hidraten" con los datos del nuevo proyecto.