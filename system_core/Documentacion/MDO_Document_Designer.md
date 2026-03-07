# MDO_Document_Designer — Plan Maestro de Operatividad y Refactorización

> **Estado:** Documento de Planificación y Diagnóstico Profundo (Paradigma Paramétrico AutoLayout)
> **Objetivo:** Construir el `DocumentDesigner` como un motor paramétrico estricto de UI/PDF basado en Flexbox puro (AutoLayout), con mecánicas avanzadas de mapeo de datos, interpolación de texto e iteradores especializados.

---

## 1. EL CANON PARAMÉTRICO Y LA INYECCIÓN DE DATOS

El **Document Designer** de Indra abandona por completo el obsoleto "Canvas 2D" (coordenadas X/Y absolutas). En su lugar, es un **Compilador de Árboles Estructurales (AST)** gobernado por las matemáticas de Flexbox. Es responsable de fusionar Diseños Predecibles con Flujos de Datos Dinámicos.

### 1.1 Naturaleza Universal de las Entradas (IN)
*   **Error del Pasado:** Asumir que solo un "Silo" (Carpeta) alimenta al documento.
*   **Axioma Actualizado:** Una entrada (Data Source) es **cualquier artefacto** capaz de emitir un contrato tabular o un objeto JSON (Data Contracts ADR-001). Puede ser un `DATA_SCHEMA`, el output final de un `BRIDGE`, un `DOCUMENT` estructurado o un `WORKFLOW`.
*   La columna IN descarga los esquemas de estos artefactos y expone un catálogo de **Slots (Variables)** listos para ser consumidos en cualquier rincón del documento.

### 1.2 Mecánica de Interpolación en Texto Libre (The `{{Slot}}` Engine)
*   El diseño estricto no riñe con la escritura natural. Un documento puede ser 90% texto estático tipeado a mano ("Estimado cliente, por la presente...").
*   **Reconocimiento Mágico de Placeholders:** Si durante la escritura el usuario tipea `{{`, el sistema debe invocar un intellisense / dropdown sugiriendo los Slots disponibles de la Columna IN.
*   Al autocompletarse `{{cliente_nombre}}`, este fragmento de texto se convierte en una **"Píldora Reactiva"** (Signifier visual: un pequeño badge de color de acento dentro del flujo del texto). Si se detecta un `{{placeholder}}` huérfano (no conectado a la columna IN), se marca en ámbar (Warning) exigiendo mapeo.

---

## 2. ARQUITECTURA DE LA INTERFAZ (UI Distribución Flexbox)

La interfaz no posee anchos fijos, sino proporciones (`flex: 1`, `width: 300px min/max`, etc.) orquestadas bajo el canon M.C.A. y el sistema de espaciado estricto `var(--space-X)`.

### 2.1 El HUD y el Cinturón de Bloques (Top Ribbon)
*   **Ubicación:** Franja horizontal superior, fijada debajo de la barra de título (`flex-shrink: 0`).
*   **Contenido:** Un "Dock de Arrastre o Inserción" con los átomos puros del diseño: `FRAME` (Caja), `TEXT` (Párrafo), `IMAGE` (Multimedia), `ITERATOR` / `TABLE` (Bucles).
*   **Affordances:** Botones tipo píldora (`btn--ghost`) que, al hacer clic, insertan el bloque al final del componente actualmente seleccionado en el lienzo, o permiten *Drag&Drop* hacia el árbol de la izquierda.

### 2.2 Panel Izquierdo: Doble Pestaña (IN_SOURCES y LAYER_TREE)
*   **Ubicación:** Panel lateral izquierdo (Ancho base `280px`, colapsable).
*   **Pestaña 1 (DATA_SOURCES):** Idéntico al `PortManager` del Bridge. Lista los Artefactos conectados, con checkboxes para habilitar qué campos estarán disponibles en memoria.
*   **Pestaña 2 (LAYER_TREE):** Un árbol jerárquico tipo Figma que representa la anatomía del AST. 
    *   *Signifiers:* Iconos distintos (Carpeta para FRAMES, T invertida para TEXT).
    *   *Interacciones:* Permitir reordenación (Drag & Drop en 1D) para sumergir bloques dentro de otros. Seleccionar un nodo aquí lo resalta inmediatamente en el lienzo central.

### 2.3 Lienzo Central: El Monitor de Proyección
*   **Ubicación:** El área expansiva del medio (`flex: 1`, fondo `var(--color-bg-void)` para generar contraste con el documento blanco o glass oscuro).
*   **Comportamiento:** No es un lienzo de pintar, es el render en vivo de React.
    *   **Selección Activa:** Hacer clic en un `TEXT` renderizado pinta un anillo perimetral exacto con Outline de `var(--color-accent)`.
    *   Las sub-cajas (Frames hijos) muestran *borders dashes* sutiles al hacer hover ("Ghost Outlines") para denotar sus límites de Flexbox.

### 2.4 Panel Derecho: El Universal Layout Inspector
*   **Ubicación:** Panel lateral derecho (Ancho base `320px`, colapsable, fondo `var(--color-bg-elevated)`).
*   **Comportamiento Paramétrico Mutante:** Cambia su UI dependiendo del tipo de bloque seleccionado.
    *   **Si es un FRAME:**
        *   Controles de AutoLayout: Dirección (Fila → / Columna ↓).
        *   Sizing Rules: `Hug Content` (Se estira con su texto interno), `Fill Container` (Ocupa todo el espacio de su padre), `Fixed` (Medida explícita).
        *   Distribución y Alineación (Matriz 3x3 para Justify y Align items).
        *   Padding y Gap: Deslizadores o inputs numéricos.
        *   Estilo: Fondo, Bordes, Radios (Usando exclusivamente Design Tokens `var(--color-...)`).
    *   **Si es TEXT:** Opciones de tipografía (inter, mono), peso, colores y el botón global "Invertir Slot" si deciden hacerlo desde UI en lugar de tipear `{{}}`.
    *   **Si es IMAGE:** Control de ajuste (`Cover`, `Contain`) y el campo `Source`.

---

## 3. MECÁNICAS DE MAPEO AVANZADO Y BLOQUES ESPECIALIZADOS

### 3.1 Resolviendo Multimedia (Bloque `IMAGE`)
*   Una imagen no siempre es estática. A menudo es un Avatar de un usuario cargado desde Drive o URLs dinámicas.
*   **Mapeo Paramétrico:** Al tener el bloque `IMAGE` seleccionado, el Inspector permite definir la `URL Source`. Aquí el usuario puede enchufar un `Slot` (Ej: `{{empleado.foto_url}}`). En el lienzo, Renderizará un placeholder universal de Indra si la imagen final no está disponible en la vista de diseño.

### 3.2 El Ecosistema `ITERATOR` y sus Subtipos (Listas vs. Tablas)
Un iterador es un multiplicador de Layouts que requiere una fuente en Array (Ej: Líneas de Factura).

*   **Subtipo A: El Iterador Libre (Repeater Frame):**
    *   Funciona exactamente como un componente `v-for`. Actúa como un `FRAME` normal, tú lo diseñas (ej: una tarjetita con Foto a la izquierda y Nombre a la derecha).
    *   Al decirle que su fuente de datos es `Facturacion_Items`, en vez de dibujar 1 tarjeta, dibuja las N tarjetas del Sandbox de pruebas apiladas por su regla de AutoLayout materna.
*   **Subtipo B: La Matriz Estricta (`TABLE_BLOCK`):**
    *   Un subtipo especializado donde el usuario quiere una cabecera rígida y filas ordenadas.
    *   El Inspector de la Tabla le pedirá dos cosas:
        1. **Source:** Qué Array de la Columna IN iterará.
        2. **Columnas:** Añadir columnas lógicas, ponerles Título (Estático) y seleccionar qué propiedad de la fila (Ej: `cantidad`, `subtotal`) se inyectará en las celdas de esa columna.

---

## 4. MASTER PLAN DE IMPLEMENTACIÓN (Fases de Cirugía)

Para no colapsar en el intento, el desarrollo se segmenta de menor a mayor complejidad paramétrica:

1.  **FASE ZERO: Cimentación Paramétrica (Layout Engine)**
    *   Desarrollar el `RecursiveBlockContainer` que interprete propiedades estándar (direction, padding, gap, flex) y elimine todo rastro de posicionamiento absoluto.
    *   Establecer en `App State` o estado local la arquitectura AST universal (Array de `objects`).

2.  **FASE UNO: UI Orquestadora (HUD, Paneles Laterales)**
    *   Implementar la distribución Flexbox del propio Designer. 
    *   Clonar la mecánica de la Pestaña "IN" (Data Sources) importando la lógica del BridgeDesigner.
    *   Construir el Árbol de Capas (Layer Tree) en la barra izquierda para poder navegar el documento.

3.  **FASE DOS: El Inspector Mutante y Styling**
    *   Desarrollar el Panel Derecho (Inspector) que reacciona inteligentemente según si seleccionas el Árbol o el Canvas.
    *   Programar los controles visuales para alterar las propiedades AST (Ej: inyectar `flex-direction: column` mediante botones iconográficos en vez de escribir css).

4.  **FASE TRES: Interpolación Avanzada y Data Binding**
    *   Desarrollar el motor regex de `{{placeholders}}` en el componente de TEXT para que se expanda en un Chip reactivo en vivo.
    *   Codificar la lógica del `ITERATOR` y `TABLE` consumiendo el banco real de datos proporcionado por el Sandbox IN.

---

## 5. RESTRICCIÓN ESTÉTICA Y CONTROL DE OVERFLOW (ADR-004)

Para garantizar la pureza visual "Solar Punk / Glassmorphism" y evitar el temido efecto de "botones abombados", textos desbordados o componentes deformes, el motor inyectará obligatoriamente una capa de **Saneamiento CSS Constante** en cada nodo renderizado:

### 5.1 El Blindaje Anti-Desbordamiento (Overflow Control)
Todo texto plano o variable dinámica (`{{slot}}`) se encapsula en una directiva estricta de truncamiento a no ser que el padre declare explícitamente comportamiento multilínea (`white-space: pre-wrap`):
*   **Restricción base de texto (Single Line):** En badges, botones y headers de frames se fuerza: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`.
*   **ScrollBar Hidden:** Todo contenedor interno usa `overflow-y: auto`, pero se esconde la barra de desplazamiento visualmente (`::-webkit-scrollbar { display: none; }`) para mantener el look "Glass" impecable.

### 5.2 Tipografía Paramétrica Estricta
*   En el *Layout Inspector*, el usuario **NUNCA** podrá escribir números absolutos para tipografías (Ej: `27px`).
*   Los Selects tipográficos estarán mapeados **únicamente** a la escala permitida del `ADR_004`: `--text-2xs (10px)` hasta `--text-3xl (36px)`.
*   Las familias están restringidas a `--font-sans` (Inter) y `--font-mono` (JetBrains), prohibiendo fuentes ajenas que rompan la métrica.

### 5.3 Aislamiento de Layout (Rule of the Parent)
*   **Prohibición de Márgenes:** Ningún bloque hijo en el AST puede tener la propiedad `margin`. El espaciado exterior es gobernado 100% por la propiedad `gap` de su `FRAME` padre. 
*   **Box-Sizing universal:** Todos los componentes heredan un estricto `box-sizing: border-box`. Un padding de `var(--space-4)` jamás agrandará la caja (abombamiento), sino que constriñirá el contenido interno herméticamente.
*   **Bordes Inmutables:** Los bordes se declaran en variables con opacidad (`rgba()`), de tal manera que `1px solid var(--color-border)` nunca choca con `var(--color-bg-elevated)`.

---

### 6. ARQUITECTURA DE MÓDULOS REACT (FILE SYSTEM)

El motor se descompone en piezas atómicas bajo el principio de **Modularización Excedida (ADR-002)**:

```bash
src/components/macro_engines/
├── DocumentDesigner.jsx            # Orquestador del Motor
└── DocumentDesigner/               # Sub-artefactos específicos
    ├── blocks/                     # Átomos de renderizado
    │   ├── FrameBlock.jsx          # Contenedor Flex
    │   ├── TextBlock.jsx           # Nodo Texto (Interpolatión)
    │   ├── ImageBlock.jsx          # Nodo Multimedia
    │   └── IteratorBlock.jsx       # Repetidor de Datos
    ├── hooks/
    │   ├── useDocumentAST.js       # Mutadores recursivos del árbol
    │   └── useDocumentHydration.js # Conexión a fuentes de datos (IN)
    ├── layout/                     # Piezas de la interfaz
    │   ├── TopRibbon.jsx           # HUD de Herramientas
    │   ├── LeftPanel.jsx           # Layers & Data Explorer
    │   ├── LayerTree.jsx           # Árbol de navegación local
    │   └── RightPanel.jsx          # Inspector Paramétrico
    └── renderer/
        └── RecursiveBlock.jsx      # Engine de renderizado recursivo (The Matrix)

src/components/utilities/
└── GraphicDesignUtils/             # Utilidades Desacopladas (Agnósticas)
    ├── SpacingControl.jsx          # Control de Padding/Gap
    ├── TypographyControl.jsx       # Control de Fuentes
    ├── AlignmentControl.jsx        # Matriz de Alineación 3x3
    ├── ColorPicker.jsx             # Selector HSL del sistema
    └── BorderControl.jsx           # Control de Bordes y Radio
```

### 6.1 El Dharma del Flujo de Datos (Prop Drilling vs Zustand)
*   **Zustand para lo Global:** La recolección profunda de `Pins` y `Silos` sigue bebiendo del global `app_state.js`.
*   **AST en Local (`useDocumentAST`):** El árbol de nodos de diseño no se sube a Zustand porque muta frenéticamente a 60fps (drag & drop, tipado rápido). Se mantiene en el estado superior `DocumentDesigner.jsx` y fluye hacia abajo (`Prop Drilling` de corto alcance) hacia el Lienzo y el Inspector. Solo se empuja al Core GAS en la fase de `ATOM_UPDATE`.
*   **Aislamiento de Módulo:** Los componentes de `blocks/` (Ej: `TextBlock`) son completamente "tontos" (Dumb Components). Solo reciben propiedades visuales (estilos pre-procesados) y contenido. No consultan el estado; si tienen un `{{slot}}`, el string ya viene resuelto por el `RecursiveBlock` padre que actuó de intermediario inteligente.
---

## 7. DEUDA TÉCNICA Y UX (15 FALENCIAS CRÍTICAS)

Tras la primera incursión operativa, se han identificado los siguientes cuellos de botella que impiden una productividad profesional:

1.  **Layout Contra-Natura:** El panel de capas a la izquierda rompe el flujo estándar (Figma/Webflow). Los paneles deben estar a la derecha.
2.  **Inspector Fantasma:** Si no hay un nodo seleccionado, el panel derecho queda vacío, dejando al usuario sin guía de acción.
3.  **Lienzo Ciego (Blind Canvas):** Imposibilidad de editar texto directamente en el papel; dependencia de un `textarea` remoto.
4.  **Bloqueo de Desplazamiento (Scroll-Lock):** El centrado CSS bloquea el desbordamiento; el documento de 1100px se vuelve inaccesible en pantallas pequeñas.
5.  **Agnosticismo de Imagen Inútil:** Pedir una URL manual es ineficiente. Debe integrar el `ArtifactSelector` del Vault.
6.  **Sin Paginación Real:** No hay distinción visual entre hojas; se percibe como una "tira infinita" sin estructura de impresión.
7.  **Slots via Portapapeles:** El flujo de copiar `{{slot}}` es manual y arcaico. Falta un sistema de Drag & Drop de datos.
8.  **Jerarquía Plana:** El árbol de capas carece de iconografía técnica para diferenciar tipos de bloques de un vistazo.
9.  **Falta de Zoom / Pan:** Imposibilidad de alejarse para ver la composición general o acercarse para detalles finos.
10. **Manejadores Invisibles:** No hay "handles" en los bordes para redimensionar bloques visualmente en el canvas.
11. **Configuración de Página Rígida:** Formatos (A4, Oficio) hardcodeados, no seleccionables por el usuario.
12. **Sin Historial (Undo/Redo):** Cualquier error de movimiento o borrado es irreversible en la sesión actual.
13. **Placeholder Estático:** El texto de ayuda no es reactivo ni desaparece elegantemente al interactuar.
14. **Ausencia de Presets:** No existen bloques pre-construidos (Cabeceras, Tablas de Items); todo debe nacer desde el átomo.
15. **Feedback de Sincronización Débil:** El botón de guardado no comunica versiones ni estados intermedios de persistencia.

---

## 8. PLAN DE MEJORA DE UX (15 PUNTOS DE IMPLEMENTACIÓN)

Para subsanar las falencias, se ejecutará el siguiente plan de acción táctico:

1.  **Reingeniería de Layout (Right Hand Side):** Traslado de `LeftPanel` y `RightPanel` a una columna unificada a la derecha.
2.  **Inspector Persistente:** Estado de "Global Props" o "Empty State" informativo cuando no hay selección.
3.  **Edición Inline:** Implementación de inputs transparentes sobre el canvas para edición directa de texto.
4.  **Fix de Visualización:** Cambio de `center` a `top` con `margin: auto` y `overflow-y: auto` para permitir scroll natural.
5.  **Integración de Vault:** Enlace directo entre el bloque `IMAGE` y el `ArtifactSelector`.
6.  **Paginador Visual:** Renderizado de sombras y divisores entre múltiples hojas físicas.
7.  **Data Drag & Drop:** Menú flotante de Slots que permite arrastrarlos directamente al texto o etiquetas.
8.  **Iconografía Técnica:** Adición de glifos específicos en `LayerTree` (Frame, Text, Image, Repeater).
9.  **Utilidad de Zoom:** Implementación de `transform: scale()` en el contenedor del monitor.
10. **Resizers Activos:** Añadir puntos de anclaje (handles) visuales en el bloque seleccionado.
11. **Page Settings Selector:** Panel para cambiar dimensiones de página dinámicamente.
12. **Undo/Redo Stack:** Pila de estados local en `useDocumentAST` para navegación temporal.
13. **Placeholder Reactivo:** Lógica de `onFocus/onBlur` para limpiar guías visuales de forma inteligente.
14. **Librería de Presets:** Botones de un solo clic para insertar estructuras complejas (ej: Invoice Header).
15. **Status de Persistencia Real:** Indicadores de "Saved", "Syncing" y "Cloud Ready" en tiempo real.

---

## 9. ARQUITECTURA DEL VIEWPORT Y CANVAS (EL MONITOR)

El diseño del área central no debe ser un contenedor rígido, sino un **Adaptive Viewport Context**. Siguiendo los estándares de herramientas como Figma y Canva, la visualización se rige por un eje de coordenadas relativas escalado.

### 9.1 El Axioma del Viewport Fluido
*   **Contenedor Maestro (`main`):** Debe actuar como un `Infinite Scroller Node`. Su responsabilidad única es gestionar el desbordamiento y proporcionar un fondo neutro (`var(--color-bg-deep)`) con una rejilla de referencia.
*   **Escalado de Precisión:** El zoom no aumenta los píxeles reales (lo cual rompería el layout), sino que aplica una matriz de transformación `scale(Z)` con un `transform-origin` anclado en `top center`. Esto garantiza que el scroll vertical sea predecible y que el documento siempre crezca hacia abajo.
*   **Axioma del Suelo Flexible:** El documento no se "corta" porque el contenedor del lienzo posee un `min-height: 100%` y un margen dinámico que permite scrollear hasta ver el pie de página sin hacks de altura fija ni scrollbars forzados.

---

## 10. PANEL DE CONFIGURACIÓN GLOBAL (PAGINACIÓN Y FORMATOS)

Las unidades de medida deben seguir el estándar de la industria (ISO 216) para asegurar que un documento diseñado en pantalla coincida con el mundo físico.

### 10.1 Estándares de Unidades (Ratio 96 DPI)
Para una traslación perfecta entre pantalla y papel, el sistema adopta los siguientes ratios:
*   **Millímetros (mm):** 1mm ≈ 3.78px.
*   **Puntos (pt):** 1pt ≈ 1.33px. Estándar para tipografía y exportación PDF profesional.
*   **Píxeles (px):** Unidad base para el renderizado interactivo.

### 10.2 Presets de Formato (Paginación Profesional)
*   **ISO_A4:** 210 x 297 mm (Referencia global).
*   **US_LETTER:** 215.9 x 279.4 mm (8.5 x 11 in).
*   **US_LEGAL:** 215.9 x 355.6 mm (8.5 x 14 in).
*   **CUSTOM:** Dimensiones libres que actualizan el `width` y `minHeight` del Root de forma axiomática.

---

## 11. PANEL DE INSPECTOR PARAMÉTRICO (LAYOUT & CONTENIDO)

Estructura de control necesaria para cada bloque del AST:

1.  **Layout Box:** Matriz de Alineación 3x3, Padding (unificado/desglosado) y Gap.
2.  **Sizing Rules:** Fixed, Hug (se adapta al contenido), Fill (se expande al padre).
3.  **Typography Engine:** Mapeo de Tokens de Diseño (Escala ADR-004), no valores arbitrarios.
4.  **Appearance Lab:** Sistema HSL, Bordes (Border-width, type, color) y Radios paramétricos.
5.  **Data Binding Hub:** Identificación y mapeo de Slots dinámicos `{{...}}` conectados a fuentes IN.
