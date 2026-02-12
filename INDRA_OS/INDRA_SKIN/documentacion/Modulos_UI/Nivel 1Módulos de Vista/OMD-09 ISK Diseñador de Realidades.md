💎 Blueprint OMD-09: Diseñador de Realidades (Stark Designer & Layout Engine)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_ui_designer_ide
Nombre Funcional: Diseñador de Realidades (The Designer).
Primitiva Vinculada: UI_RENDERER + MATH_ENGINE + SCHEMA_REGISTRY.
Axioma de Diseño: "La forma sigue al dato, pero la estética obedece al usuario."
2. Anatomía y Distribución de la Interfaz (UI Shell)
El espacio de trabajo se divide en cuatro zonas de especialización funcional para minimizar la carga cognitiva:
A. Zona Izquierda: El Navegador de Estructura y Datos
Panel de Capas (Layers): Árbol jerárquico de objetos, grupos y frames. Permite el bloqueo, ocultación y reordenamiento (Z-Index).
El Cubo de Datos (Semantic Data Cube): Explorador agnóstico de variables. Lista todas las salidas de los nodos del flujo (Módulo 03) categorizadas por origen (Notion, Sheets, LLM, etc.).
B. Zona Central: El Escenario (The Stage)
Lienzo 2D Infinito: Motor de renderizado vectorial con soporte para zoom fluido y paneo.
Reglas y Guías: Sistema de medición dinámico basado en la Spatial_Physics para alineación magnética (Snapping).
C. Zona Derecha: El Inspector Dual (Visual + Lógica)
Pestaña Visual: Controles de estilo tradicional (Figma-style): Posición, Tamaño, Rotación, Relleno, Bordes, Sombras, Tipografía y Auto-layout.
Pestaña de Lógica (The Bridge): Configuración de Vínculos (Bindings) y Disparadores de Estilo (Triggers).
D. Zona Flotante: El HUD de Herramientas (Toolbelt)
Herramientas de Creación: Rectángulo, Círculo, Texto, Imagen, Slot de Datos, Repetidor de Listas.
La Forja de Operadores: Acceso rápido a funciones matemáticas y lógicas.
3. Taxonomía de Visualización y Operación de Datos
El sistema permite cuatro formas de inyectar realidad en el diseño:
Datos Fijos (Contenido Estático): Texto o valores introducidos manualmente que no cambian (ej. Título de un encabezado).
Datos Dinámicos (Contenido Vinculado): El objeto muestra el valor literal de una variable del Cubo de Datos (ej. El nombre de un cliente).
Datos Computados (Operadores): El usuario crea una nueva variable usando la Forja de Operadores.
Ejemplo: Suma_Total = (Precio * Cantidad) + Impuestos.
Datos Afectadores (Drivers de Estilo): El dato no se ve, pero controla una propiedad visual.
Ejemplo: Si Stock < 5, entonces Opacidad = 0.5 y Color = Rojo.
4. Ciclo de Uso y Reprocesos (User Journey)
Paso 1: Maquetación de la Cáscara
El usuario selecciona la herramienta "Texto" en el HUD y dibuja un área en el Escenario. Define la fuente y el color en el Inspector Visual.
Paso 2: Vinculación Semántica (Binding)
El usuario selecciona el texto creado. En el Inspector de Lógica, abre el Cubo de Datos y selecciona Notion.Cliente_Nombre. El texto ahora muestra un "Dato Fantasma" (Scaffolding) con el nombre de un cliente de ejemplo.
Paso 3: Operación Matemática
El usuario necesita mostrar el precio con IVA. Abre la Forja de Operadores, selecciona la función MULT, elige la variable Sheets.Precio y escribe 1.21. El sistema crea la variable computada Precio_IVA, la cual el usuario vincula a un nuevo Slot de texto.
Paso 4: Programación de Reglas (Afectadores)
El usuario selecciona un círculo decorativo al lado del precio. En el Inspector de Lógica, crea una regla:
SI Precio_IVA > 1000
ENTONCES Efecto: Glow_Neon + Color: Dorado.
Paso 5: Iteración de Listas (El Repetidor)
Para crear una tabla de productos, el usuario diseña una sola fila. Selecciona la fila y activa el "Repetidor de Listas". Vincula el repetidor a la colección Notion.Lista_Productos. El sistema genera automáticamente una fila por cada producto en la base de datos.
5. JSON Compilado del Artefacto: view_ui_designer_ide
Este es el contrato técnico que define la totalidad del módulo para el desarrollador.
code
JSON
{
  "modulo_09": {
    "id": "view_ui_designer_ide",
    "clase_ui": "STARK_DESIGN_IDE",
    "engine": "VECTOR_2D_CANVAS",
    "distribucion_espacial": {
      "panel_izquierdo": {
        "top": "layer_manager",
        "bottom": "semantic_data_cube"
      },
      "panel_derecho": {
        "tabs": ["visual_inspector", "logic_bridge"]
      },
      "hud_flotante": ["drawing_tools", "operator_forge"]
    },
    "funcionalidades_core": {
      "maquetacion": {
        "objetos": ["rect", "ellipse", "text", "image", "group", "frame"],
        "sistemas": ["auto_layout", "grid_snap", "z_index_control"]
      },
      "vinculacion_datos": {
        "modos": ["LITERAL_CONTENT", "STYLE_AFFECTOR"],
        "tipos_vinculo": ["ONE_WAY_SYNC", "COMPUTED_REF"]
      },
      "motor_logico": {
        "operadores": ["SUM", "SUB", "MULT", "DIV", "IF_ELSE", "CONCAT", "FORMAT_DATE"],
        "reglas_estilo": {
          "propiedades_afectables": ["fill", "stroke", "opacity", "scale", "visibility", "blur"],
          "operadores_logicos": [">", "<", "==", "!=", "CONTAINS"]
        }
      }
    },
    "scaffolding_logic": {
      "ghost_data_provider": "SAMPLE_JSON_GENERATOR",
      "preview_mode": "HYDRATED_REAL_TIME"
    },
    "export_protocols": ["PDF_VECTOR", "GOOGLE_SLIDES_API", "HTML_DASHBOARD", "PRINT_READY"]
  }
}
6. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
Reducción de la Fragmentación: Al integrar el diseño y la lógica en una sola superficie, eliminamos el "costo de cambio de contexto" (Context Switching). El usuario no tiene que salir del diseño para calcular un dato.
Agnosticismo Estructural: El sistema no depende de la fuente del dato. Una vez que el dato está en el Cubo de Datos, se trata como una entidad pura, facilitando la creación de plantillas reutilizables.
Prevención de Errores: El Inspector de Lógica valida las operaciones en tiempo real. Si el usuario intenta sumar un "Texto" con un "Número", el sistema bloquea la operación y sugiere una función de conversión.
Visibilidad del Estado: El Live Preview constante asegura que el usuario siempre tenga una "Consciencia Situacional" total del resultado final.