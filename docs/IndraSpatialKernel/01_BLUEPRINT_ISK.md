# 🌌 BLUEPRINT: INDRA SPATIAL KERNEL (ISK)
## Motor de Manifestación y Proyección Sistémica (v3.0 - SUH Canon)

> **ESTADO**: CANONIZADO (Hybrid 3.0)
> **FECHA**: 2026-01-26
> **REEMPLAZA**: Render Vector Pro (RVP)
> **AXIOMAS**: Sovereign (S), Universal (U), High-Fidelity (H)

---

## 1. DEFINICIÓN SISTÉMICA
El **Indra Spatial Kernel (ISK)** es un motor de proyección espacial de alta fidelidad que actúa como la interfaz de manifestación física de los contratos del Core. No es un editor de dibujo; es un entorno de **reificación reactiva** donde la geometría es una función del estado del sistema.

### ¿Qué lo define como Nodo Híbrido?
1.  **Soberanía de Ejecución (S)**: El 90% de la fuerza de cálculo (Motor Geométrico, Expression Engine) reside en el Cliente (Edge), permitiendo operatividad offline total tras la carga del contrato.
2.  **Universalidad de Proyección (U)**: Geometría agnóstica a la plataforma. El ISK puede proyectar en WebGL, AR o paneles LED sin cambiar la lógica del `SpatialLaw`.
3.  **Alta Fidelidad (H)**: Respuesta instantánea (latencia < 16ms) con manejo de hasta 10,000 elementos reactivos mediante culling espacial persistente.

---

## 2. EL "STARK FACTOR" (Reactividad Pura)
El núcleo del ISK es su motor de expresiones reactivas. Permite que cualquier atributo visual (posición, color, escala, filtro) esté vinculado a una fuente de datos sistémica.

**Sintaxis**: `{{ source.path | filter | math }}`

**Ejemplo de Reificación**:
```json
{
  "id": "pulse_circle",
  "type": "geometry.circle",
  "radius": "{{ microphone.volume | noise(0.5) | map(0, 1, 50, 200) }}",
  "fill": "hsla({{ system.load | map(0, 100, 200, 0) }}, 80%, 50%, 1)"
}
```
*Traducción*: El círculo pulsa según el volumen del micro y cambia de color (Azul -> Rojo) según la carga de CPU del sistema.

---

## 3. ARQUITECTURA DE INTEGRACIÓN (The ISK Stack)

```
┌─────────────────────────────────────────────────────────────────┐
│                    INDRA SPATIAL KERNEL (ISK)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         L1: CAPA DE LEY (SpatialLaw / DNA)                │ │
│  │  • Expression Engine (Soberanía de cálculo)               │ │
│  │  • Dependency Graph (Resolución de vínculos)              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ▲                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         L2: CAPA DE PROYECCIÓN (Kernel Core)              │ │
│  │  • Spatial Index (R-Tree / 60 FPS Culling)                │ │
│  │  • Attribute Buffers (Zero-latency data injection)         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ▲                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         L3: CAPA DE MANIFESTACIÓN (Anatomy)               │ │
│  │  • GLSL Shaders (Post-procesamiento matemático)           │ │
│  │  • Module_AutoLayout / Module_FX                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────┬─────────────────────────────────────┬─────────────┘
              │ Universal Connection (CoreBridge)   │
              ▼                                     ▼
┌─────────────────────────────┐       ┌───────────────────────────┐
│      PROJECTION KERNEL      │       │      VECTOR ADAPTER       │
│ (Semántica y Contratos IO)  │       │ (Persistencia y Assets)   │
└─────────────────────────────┘       └───────────────────────────┘
```

---

## 4. CONEXIÓN CON EL CORE

### `ProjectionKernel`
Es la fuente de verdad semántica. El ISK consulta al Kernel para:
1.  **Descubrimiento**: "¿Qué capacidades (nodos) están habilitadas en mi contrato?".
2.  **Validación**: Asegurar que las expresiones `{{ ... }}` apuntan a fuentes de datos autorizadas por el rol del usuario.

### `VectorAdapter` (Core Service)
Servicio especializado para el soporte del Nodo Híbrido:
- **Double Persistence**: Gestiona el `.layout.json` (visuales) sincronizado con el `.flow.json` (lógica).
- **Library Provider**: Suministra los símbolos base y definiciones de Shaders GLSL para L3.
- **Export Engine**: Convierte proyecciones espaciales en artefactos estáticos (PDF, SVG).

---

## 5. REGLAS DE ORO (ISK Canon)

1.  **Geometría es Función**: Ningún píxel se mueve sin un "por qué" sistémico.
2.  **Zero Glitch Policy**: La UI debe ser fluida. Si un cálculo de expresión es pesado, se desplaza a un WebWorker para no bloquear L2.
3.  **Soberanía Total**: Si el Core cae, el ISK sigue funcionando con la última captura de estado, permitiendo edición local.
4.  **Agnosticismo de Datos**: El `.layout.json` no guarda valores; guarda intenciones (Fórmulas).

----
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