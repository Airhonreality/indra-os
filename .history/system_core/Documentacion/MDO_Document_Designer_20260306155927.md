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
