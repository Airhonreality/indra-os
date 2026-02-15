🏛️ Blueprint Integral: Indra OS v6.0 (The Systemic Hierarchy)

> [!NOTE]
> **Alineación Sistémica**: Este documento es la manifestación de las leyes L0 (`UI_Distribution.gs`) en el cuerpo del Front-End. Los axiomas de renderizado y transmutación residen ahora en las secciones 2 y 3 de este Blueprint integral.

1. Arquitectura de Superficies (The Shell)
La interfaz se organiza en una Estructura de Cuatro Cuadrantes con un Lienzo Central de Doble Perspectiva, diseñada para minimizar la fatiga visual y maximizar la eficiencia operativa.
1.1 Distribución de Módulos (Anatomía del Sistema)
Zona	Módulo	Función Sistémica	Slot Canónico
Acceso	M01: Auth Gate	Validación de la Constitución	`AUTH_OVERLAY`
Estructura (Izq)	M07: Archivist	Navegación por Cosmos	`SIDEBAR_PRIMARY`
Lienzo (Centro)	M03: Canvas	Orquestación Espacial	`CANVAS_MAIN`
Detalle (Der)	M05: Inspector	Configuración Granular	`SIDEBAR_SECONDARY`
Control (Inf)	M04: Copilot	Terminal Neuronal (IA)	`TERMINAL_STATUS`
Cabecera	M08: Service Bar	Servicios Globales	`TOP_BAR_SYSTEM`
2. Axiomas de Renderizado (Continuous Flex Chain)
Para evitar el colapso visual, INDRA utiliza una cadena de flexión continua forzada desde el Root (`100vh`) hasta el Módulo:
- **The Shell**: Contenedor Flex principal.
- **The Slot**: Ranuras canónicas (`SIDEBAR_PRIMARY`, `CANVAS_MAIN`, etc.) con `flex: 1` y `overflow: hidden`.
- **The Module**: Ocupa el 100% del slot. Se prohíben medidas fijas en PX para el layout global.

3. El Proceso de Transmutación (Data-to-UI)
1. **JSON Law**: Define la intención (ej: `clase_ui: "FLOW_CANVAS"`).
2. **Component Registry**: Traduce la intención en Materia (React).
3. **DynamicLayoutEngine**: Inyecta el componente en el Slot según las `Visual_Laws.js`.

4. Taxonomía de Visualización de Datos (Hidratación)
Para que el sistema sea agnóstico, los datos se manifiestan en la UI bajo cuatro modalidades de "Hidratación":
A. Datos Fijos (Static Constants)
Definición: Valores inmutables definidos por el usuario (Hardcoded).
Uso: Títulos de reportes, IDs de carpetas raíz, constantes matemáticas.
Visualización: Texto plano o campos de entrada estándar en el M05: Inspector.
B. Datos Dinámicos (Live Streams)
Definición: Información que fluye desde los ADAPTERS externos en tiempo real.
Uso: Mensajes de WhatsApp, filas de Notion, sensores de clima.
Visualización: Representados como "Etiquetas de Variable" en el M09: Designer y como "Pulsos de Luz" en los cables del M03: Canvas.
C. Datos Computados (Logic Outputs)
Definición: Resultado de operaciones matemáticas o lógicas aplicadas a datos dinámicos.
Uso: Suma de totales, filtrado de listas, traducción de idiomas vía LLM.
Visualización: Variables con el prefijo fx_ en el Cubo de Datos.
D. Datos Afectadores (Drivers)
Definición: Datos que no se muestran, sino que modifican la forma de la UI.
Uso: Si el stock es bajo, el icono parpadea; si el cliente es VIP, el fondo es dorado.
Visualización: Reglas de estilo condicional en el M09: Designer.
3. El Módulo Maestro: M09 - Diseñador de Realidades (Deep Dive)
Este es el programa de diseño integrado. Su objetivo es permitir que el usuario dibuje la "Cáscara" y la vincule al "Alma" de los datos.
Interfaz de Diseño (The Designer UI)
Herramientas de Dibujo (HUD): Formas geométricas, Texto, Imágenes, Slots de Datos y Repetidores de Listas.
Sistema de Capas: Gestión de Z-Index y visibilidad condicional.
Auto-Layout: Motor de alineación inteligente basado en la Spatial_Physics.
Interfaz de Lógica (The Logic Bridge)
Cubo de Datos (Data Cube): Explorador de todas las variables disponibles en el proyecto.
Vinculador Semántico (Binding):
Contenido: El objeto muestra el valor literal.
Afectador: El valor del dato controla propiedades (Opacidad, Color, Tamaño, Rotación).
Forja de Operadores: Constructor visual de fórmulas (Ej: (A + B) * IVA).
4. JSON Global de Configuración (The Master Manifest)
Este es el archivo que el desarrollador de Front-end utiliza para orquestar toda la aplicación.
code
JSON
{
  "indra_os_v5_5": {
    "laws_reference": ["CORE_LOGIC", "VISUAL_GRAMMAR", "SPATIAL_ENGINE"],
    "ui_shell": {
      "layout_mode": "AXIOM_HUD",
      "panels": [
        {
          "id": "view_flow_orchestrator",
          "modes": ["SPATIAL_GRAPH", "STRUCTURAL_MATRIX"],
          "physics": "cable_physics",
          "interactions": ["drag", "connect", "snap", "zoom"]
        },
        {
          "id": "view_ui_designer",
          "capabilities": {
            "drawing": ["vector", "text", "slots", "repeaters"],
            "logic": ["math_forge", "style_triggers", "data_binding"],
            "export": ["pdf", "html", "slides", "forms"]
          }
        }
      ]
    },
    "data_manifestation_rules": {
      "binding_types": {
        "LITERAL": { "visual": "text_fill", "update": "reactive" },
        "AFFECTOR": { "visual": "property_mutation", "update": "real_time" },
        "COMPUTED": { "visual": "fx_badge", "update": "on_change" }
      }
    }
  }
}
5. Análisis de Ergonomía Cognitiva (Conclusión de Tesis)
¿Por qué este sistema es superior?
Unificación de Modelos Mentales: El usuario no tiene que saltar entre una app de diseño (Figma) y una de lógica (Zapier). Indra OS fusiona ambas en un solo flujo de pensamiento.
Reducción de la Carga de Evaluación: Gracias al Monitor de Trazabilidad Humano y al Live Preview, el usuario sabe instantáneamente si su lógica y su diseño funcionan.
Agnosticismo Total: El sistema trata a una base de datos de Notion y a un sensor de temperatura con la misma gramática visual, permitiendo que el cerebro humano aplique los mismos patrones de resolución de problemas a cualquier dominio.
Veredicto Final:
Indra OS v5.5 es una Extensión Cognitiva. Permite que un solo individuo orqueste realidades digitales complejas con la precisión de un ingeniero y la libertad de un artista. La arquitectura está lista para la Ignición.




