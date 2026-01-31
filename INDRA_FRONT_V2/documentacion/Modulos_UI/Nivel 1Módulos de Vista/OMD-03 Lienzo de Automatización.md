Blueprint Maestro OMD-03: Lienzo de Automatización (Flow Orchestrator)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_flow_orchestrator
Nombre Funcional: Lienzo de Automatización (The Canvas).
Naturaleza: Escenario Principal de Nivel 1.
Primitiva Vinculada: FLOW_ENGINE + ISK_Kernel (Cables) + MCEP_Distiller.
Axioma de Diseño: "La lógica es espacial; el dato es visible; la conexión es física."
2. Anatomía y Distribución de la Interfaz (UI Shell)
El OMD-03 utiliza una arquitectura híbrida: React para la interfaz de los nodos (formularios/botones) y WebGL (ISK) para el fondo, los cables y las partículas de datos.
A. El Escenario Infinito (The Logic Stage)
Fondo Dinámico: Grid magnético con snap_to_grid: 20. El fondo pulsa levemente cuando el sistema está procesando datos.
Navegación: Pan y Zoom fluido (0.2x a 3.0x) gestionado por el Spatial_Index del ISK.
B. Los Nodos (The Logic Entities)
Node Wrapper: Contenedores HTML proyectados sobre el canvas WebGL.
Cabecera Semántica: Color y icono dictados por el Rol Canónico (ej: Dorado para VAULT, Azul para BRIDGE).
Puertos de Conexión:
Cuadrados (EXECUTE): Flujo de control/disparo.
Círculos (DATA): Flujo de información/variables.
C. Los Cables de Datos (The Photon Links)
Tecnología: Líneas vectoriales renderizadas en WebGL.
Física de Tensión: Curvas de Bezier con la fórmula tension = distance * 0.5.
Modo "Data Pulse": Partículas de luz viajan por el cable. La velocidad de la partícula es inversamente proporcional a la latencia del nodo (más lento = más lag).
3. Definición Funcional (El "Qué")
A. Composición de Realidad Lógica
Instanciación: Al soltar un adaptador del OMD-08, el lienzo crea el nodo y abre automáticamente el OMD-05 (Inspector) para su configuración.
Cableado Inteligente: El sistema valida la conexión en tiempo real. Si intentas conectar DATA con EXECUTE, el cable rebota con un efecto de "cortocircuito" rojo.
B. Depuración Viva (Live Debugging)
Doble Clic en Cable: Inserta automáticamente un nodo OBSERVER (Rol 10) para monitorear el tráfico.
Hover de Datos: Al pasar el mouse sobre un cable, se invoca una mini-ventana del OMD-10 (Context Explorer) mostrando el último payload que pasó por ahí.
4. Comportamiento Camaleónico (Adaptatividad)
Regla de Mutación 01 (Modo Ejecución): Cuando el flujo se activa (PLAY), el lienzo entra en "Stark Mode". Los nodos se vuelven semitransparentes y los cables brillan intensamente según el volumen de datos.
Regla de Mutación 02 (Aislamiento): Al seleccionar un nodo, todos los cables y nodos no conectados a él se atenúan (opacity: 0.2), resaltando el "Camino Crítico" de esa lógica.
5. Estrategia de Scaffolding (Andamiaje)
Sombra de Proyección: Al arrastrar un nodo desde el catálogo, el lienzo proyecta una sombra en el grid indicando dónde aterrizará y qué puertos tiene.
Conexión Potencial: Al estirar un cable hacia un puerto compatible, el puerto emite un "brillo de succión" (magnetic pull) para indicar que la conexión es válida.
6. JSON del Artefacto: view_flow_orchestrator
code
JSON
{
  "omd_03": {
    "id": "view_flow_orchestrator",
    "clase_ui": "HYBRID_CANVAS_ENGINE",
    "engine_ref": "ISK_v3.2",
    "physics_config": {
      "grid_snap": 20,
      "cable_tension": 0.5,
      "magnetic_pull": 15
    },
    "render_layers": {
      "background": "WEBGL_GRID",
      "connections": "WEBGL_PHOTON_LINES",
      "entities": "REACT_NODE_WRAPPERS",
      "overlays": "SVG_HUD"
    },
    "interaction_rules": {
      "onConnect": "VALIDATE_MASTERLAW",
      "onDoubleClickCable": "INSERT_OBSERVER",
      "onPlay": "ACTIVATE_STARK_MODE"
    }
  }
}
7. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
Reducción de la Carga de Error: El sistema de "Cables que Rebotan" y "Puertos que Brillan" elimina el 90% de los errores de conexión antes de que el flujo se ejecute.
Consciencia Situacional: El "Data Pulse" permite al usuario "sentir" dónde está el cuello de botella de su automatización solo con mirar la velocidad de las partículas.
Haptic Feedback: Cada conexión exitosa emite una micro-vibración (en dispositivos compatibles) o un "clic" sonoro de alta frecuencia, cerrando el bucle de confirmación humana.