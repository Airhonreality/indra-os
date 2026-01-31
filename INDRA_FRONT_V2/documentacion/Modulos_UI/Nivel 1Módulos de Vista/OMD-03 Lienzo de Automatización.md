Blueprint OMD-03: Lienzo de Automatización (Flow Orchestrator)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_flow_orchestrator
Nombre Funcional: Lienzo de Automatización.
Primitiva Vinculada: FLOW_ENGINE (Motor de Orquestación).
Descripción: Entorno espacial interactivo para la composición de grafos lógicos. Utiliza el SPATIAL_ENGINE para gestionar la disposición de nodos y el VISUAL_GRAMMAR para comunicar estados dinámicos.
2. Definición Funcional (El "Qué")
Objetivo Primario: Permitir la creación de flujos secuenciales y reactivos mediante la interconexión de nodos de capacidad.
Acciones Atómicas:
Navegar: Zoom y Pan sobre el lienzo infinito.
Instanciar: Arrastrar nodos desde la biblioteca al lienzo.
Vincular: Crear conexiones entre puertos de salida (Output) e entrada (Input).
Organizar: Ajuste magnético de nodos mediante grid_snap.
Ejecutar: Disparar el flujo para observar el tránsito de datos en tiempo real.
3. Modelo de Datos e Interfaz (El "Contrato")
Input JSON (Estado del Grafo):
code
JSON
{
  "graph_id": "whatsapp_to_calendar_001",
  "nodes": [
    { "id": "n1", "type": "TRIGGER", "pos": { "x": 100, "y": 200 }, "data": { "service": "whatsapp" } },
    { "id": "n2", "type": "ORCHESTRATOR", "pos": { "x": 400, "y": 200 }, "data": { "service": "llm" } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "source_port": "out", "target_port": "in" }
  ]
}
Output JSON (Mutación del Grafo):
code
JSON
{
  "action": "UPDATE_GRAPH",
  "payload": { "nodes": "...", "edges": "..." }
}
Estado de Sincronía: TIEMPO REAL (Real-time). Cada movimiento de nodo o creación de cable debe persistirse o pre-validarse instantáneamente.
4. Comportamiento Camaleónico (Adaptatividad Stark)
Regla de Prioridad de Animación (Resolución de Gap B):
Estado Base: El nodo respira (breathing) según su arquetipo.
Estado de Acción: Si el nodo está procesando (ej. el LLM pensando), la animación de "Identidad" se suspende y se activa la animación de "Intención" (wave o pulse).
Física de Cables (cable_physics): Los cables no son líneas rectas; son curvas Bezier con cable_tension: 0.5. Al arrastrar un cable, este debe mostrar una "tensión elástica" hasta que encuentra un puerto válido.
5. Estrategia de Scaffolding (Pre-visualización)
Sombra de Posicionamiento: Mientras se arrastra un nodo, se muestra un recuadro fantasma en la posición más cercana del grid_snap (cada 20px).
Pre-conexión Semántica: Al acercar un cable a un puerto, si el SCHEMA de salida es compatible con el de entrada, el puerto brilla en verde. Si es incompatible, el cable "rebota" (Inhibición visual).
6. Análisis de Ergonomía Cognitiva (El "Humano")
Carga Mental: Alta. Para mitigarla, el lienzo utiliza Culling Visual: los detalles técnicos de los nodos desaparecen al alejar el zoom, dejando solo el icono y el color del arquetipo.
Affordances: Los puertos de entrada están siempre a la izquierda y los de salida a la derecha (port_mapping). El grosor del cable indica el volumen de datos que fluye por él.
Prevención de Errores: El SPATIAL_ENGINE impide solapar nodos, manteniendo una distancia mínima de seguridad para evitar el desorden visual.
JSON de Artefacto: view_flow_orchestrator
Este JSON define las capas del motor gráfico que el desarrollador debe implementar en el Front-end.
code
JSON
{
  "artefacto": {
    "id": "view_flow_orchestrator",
    "clase_ui": "INFINITE_CANVAS_ENGINE",
    "config_visual": {
      "arquetipo": "ORCHESTRATOR",
      "engine_rules": "SPATIAL_ENGINE",
      "grammar_ref": "VISUAL_GRAMMAR"
    },
    "sub_artefactos": [
      {
        "id": "canvas_background",
        "tipo": "GRID_LAYER",
        "propiedades": {
          "snap_size": 20,
          "pattern": "dots",
          "color": "#1a1a1a"
        },
        "ciclo_uso": "Proporciona la referencia espacial constante para el usuario."
      },
      {
        "id": "node_layer",
        "tipo": "ENTITY_MANAGER",
        "propiedades": {
          "render_mode": "WEBGL_BATCHED",
          "interaction": "DRAG_AND_DROP"
        },
        "ciclo_uso": "Gestiona la renderización de los 17 arquetipos. Aplica 'breathing' o 'vibration' según el estado reportado por el Core."
      },
      {
        "id": "cable_layer",
        "tipo": "PHYSICS_CONNECTION_RENDERER",
        "propiedades": {
          "style": "BEZIER_CURVE",
          "physics": "cable_physics"
        },
        "ciclo_uso": "Dibuja las conexiones. Si un flujo está activo, anima partículas viajando por la curva."
      },
      {
        "id": "interaction_overlay",
        "tipo": "GHOST_SCAFFOLDING",
        "propiedades": {
          "opacity": 0.4,
          "color": "var(--accent-primary)"
        },
        "ciclo_uso": "Muestra previsualizaciones de nodos y cables antes de que la acción se complete."
      },
      {
        "id": "viewport_controls",
        "tipo": "NAVIGATION_HUD",
        "propiedades": {
          "mini_map": true,
          "zoom_indicator": true
        },
        "ciclo_uso": "Permite al usuario orientarse en flujos de gran escala (complejidad Stark)."
      }
    ]
  }
}