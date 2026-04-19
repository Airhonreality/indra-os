# ADR_018 — DOCUMENT DESIGNER: Arquitectura del Panel de Control Cognitivo

> **Versión:** 1.0
> **Estado:** PROPUESTO
> **Relacionado con:**
> - [ADR_002 — UI MANIFEST](./ADR_002_UI_MANIFEST.md) §4.4, §8.2
> - [ADR_004 — DESIGN SYSTEM](./ADR_004_DESIGN_SYSTEM.md)
> - [ADR_005 — UI RESONANCE](./ADR_005_UI_RESONANCE.md)
> - [ADR_016 — AGENTIC WORKSPACE MODEL](./ADR_016_AGENTIC_WORKSPACE_MODEL.md)

---

## 1. CONTEXTO Y PROBLEMA

El `DocumentDesigner` existe como unidad de diseño de plantillas de documentos. Sin embargo, su panel de control lateral (actualmente una sola columna de 320px) adolece de las siguientes deficiencias:

### 1.1 Deficiencias del Modelo Actual

| Deficiencia | Descripción | Impacto |
|---|---|---|
| **Control de jerarquía incompleto** | El `LayerTree` muestra el árbol pero los controles de reordenamiento (subir/bajar, anidar/extraer) solo aparecen al seleccionar, sin posibilidad de drag-and-drop real | El usuario debe adivinar que "subir/bajar" son las flechas; no hay feedback espacial |
| **Sin soporte de duplicado** | No existe acción `DUPLICATE_NODE` en la barra de controles | El usuario debe crear y configurar desde cero cada vez |
| **Panel monolítico** | El inspector de propiedades (`PropertiesInspector`) y el árbol de capas (`LayerTree`) compiten por el mismo espacio sin una jerarquía visual clara | El espacio de cada uno es arbitrario (`flex: 0 0 45%` hardcoded) |
| **Fuentes externas planas** | El tab `DATA_SOURCE` muestra los slots como una lista plana, sin acciones contextuales claras ni posibilidad de insertar objetos complejos (tablas, imágenes) | El usuario solo puede copiar o pegar texto, no insertar bloques completos |
| **Ausencia de vista de recursos del workspace** | No hay forma de ver, dentro del DD, los Schemas disponibles en el workspace, los Silos, ni los outputs de Workflows | El diseñador debe salir del motor para consultar datos disponibles |
| **PAGE como CONFIG imperceptible** | La selección de página (root) y sus controles de preset son el mismo inspector que los de un text block | Confunde el nivel jerárquico de "documento" con el de "elemento" |

---

## 2. DECISIÓN ARQUITECTÓNICA

Se rediseña el **Panel de Control Lateral** del `DocumentDesigner` como un componente tríadico con zonas de responsabilidad áurea, siguiendo la misma filosofía del ADR_016.

### 2.1 El Principio de "Panel Cognitivo Vertical"

El panel NO es una lista de opciones. Es una **representación física del documento**. El usuario debe poder "sentir" la estructura del documento con solo mirar el panel. Las entidades en el árbol son los ciudadanos del documento; el inspector de propiedades es el diálogo con la entidad seleccionada.

---

## 3. ARQUITECTURA PROPUESTA: EL PANEL TRÍADICO

El panel lateral pasa de 1 zona a **3 zonas funcionales** apiladas verticalmente con comportamientos de expansión diferenciados:

```
┌─────────────────────────────── PANEL DERECHO (320px) ──────────────────┐
│                                                                         │
│  ┌─ ZONA A: ENTITY NAVIGATOR ─────────────────────────────────────────┐│
│  │  [LAYERS] [WORKSPACE]         (TabBar primitivo)                    ││
│  │  ─────────────────────────────────────────────────────────────      ││
│  │  ⊞ PAGE (root)                  ↑ ↓  ⊡ ⌫         [HEAD_LOCKED]   ││
│  │    ▼ FRAME #a1b2                ↑ ↓  ⊡ ⌫                          ││
│  │        TEXT #c3d4  ←[SELECTED]  ↑ ↓  ⊡ ⌫   ← controles visibles   ││
│  │        IMAGE #e5f6              ↑ ↓  ⊡ ⌫                          ││
│  │    ITERATOR #g7h8               ↑ ↓  ⊡ ⌫                          ││
│  │  ─────────────────────────────────────────────────────────────      ││
│  │                  [flex: 0 0 auto, min-height: 160px]                ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ── RESIZE HANDLE ────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─ ZONA B: ENTITY INSPECTOR ─────────────────────────────────────────┐│
│  │  [ TEXT BLOCK — #c3d4 ]  [DUPLICATE] [DELETE:hold]                 ││
│  │  ─────────────────────────────────────────────────────────────      ││
│  │  ► LAYOUT                                                           ││
│  │     direction: [row] [col]     gap: [10px_______]                   ││
│  │     align: [start][center][end]  justify: [...]                     ││
│  │  ─────────────────────────────────────────────────────────────      ││
│  │  ► CONTENT                                                          ││
│  │     content: [____________________________textarea]                  ││
│  │     fontSize: [12pt]   weight: [400]                                ││
│  │     color: [■ #ffffff_______]                                       ││
│  │  ─────────────────────────────────────────────────────────────      ││
│  │  ► SURFACE                                                          ││
│  │     background: [■ #000000____]                                     ││
│  │     border: [1px solid #333___]  radius: [4px]                      ││
│  │  ─────────────────────────────────────────────────────────────      ││
│  │  ► EFFECTS                                                          ││
│  │     opacity: [100%]   shadow: [none___________]                     ││
│  │                  [flex: 1 — ocupa el espacio restante]              ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.1 ZONA A — Entity Navigator (Árbol de Entidades)

**Responsabilidad:** Representación física del AST del documento como árbol navegable. Ancla permanente en la parte superior del panel.

#### 3.1.1 Sub-pestañas del Navigator

El navigator tiene **2 pestañas** (usando el primitivo `TabBar`):

| Tab | ID | Contenido |
|---|---|---|
| **LAYERS** | `LAYERS` | El árbol de entidades del documento (AST) |
| **WORKSPACE** | `WORKSPACE` | Recursos del workspace: Schemas, Silos, Workflows |

#### 3.1.2 Tab LAYERS — Árbol de Entidades

Cada nodo del árbol muestra:

```
[▶][ICON][LABEL_TIPO][#id_corto]       [↑][↓][⊡][⌫]
```

| Elemento | Descripción | Estado |
|---|---|---|
| `▶ / ▼` | Colapsar/expandir hijos (solo si `hasChildren`) | Siempre visible |
| `ICON` | `IndraIcon` del tipo de bloque (`DOCUMENT`, `FRAME`, `TEXT`, `IMAGE`, `REPEATER`) | Siempre visible |
| `LABEL_TIPO` | `node.type` en mono. Si el nodo tiene un alias en `props.label`, se muestra el alias primero | Siempre visible |
| `#id_corto` | 4 últimos chars del ID, opacidad baja | Siempre visible |
| `↑` `↓` | `moveNode(id, -1 / +1)` — Reordenar entre hermanos | Visible en ALL rows (no solo la seleccionada) |
| `⊡` | Duplicar nodo | Visible en hover / selección |
| `⌫` | `IndraActionTrigger` con `requiresHold=true` para eliminar | Visible en hover / selección |

**Cambio crítico respecto al modelo actual:** Los controles `↑` y `↓` deben ser visibles **siempre** (aunque con baja opacidad) para que el usuario comprenda inmediatamente que las filas son reordenables. Al hacer hover la opacidad aumenta. Al seleccionar, resaltan en accent.

**Regla de la Raíz Bloqueada (`HEAD_LOCKED`):** El nodo `PAGE` (root) tiene `moveNode` y `removeNode` deshabilitados. Un badge `HEAD_LOCKED` lo indica sutilmente.

#### 3.1.3 Drag-and-Drop de Nivel 2

Además de los botones `↑` `↓`, cada fila expone un `DragHandle` (primitivo existente en `utilities/primitives/DragHandle.jsx`) que permite arrastrar para reordenar dentro del mismo nivel padre. El reordenamiento por drag **no permite cambiar el nivel de anidamiento** (para eso existen los botones de indent/outdent `←` `→`).

#### 3.1.4 Tab WORKSPACE — Recursos Externos

Reemplaza y extiende el antiguo tab `DATA_SOURCE`. Muestra los recursos del workspace disponibles para insertar en el documento.

```
[SCHEMA] [SLOTS] [OBJECTS]     (sub-tabs secundarios)
```

| Sub-tab | Contenido | Acciones por fila |
|---|---|---|
| **SCHEMA** | Lista de `DATA_SCHEMA` disponibles en el workspace | `{{copy}}` (copia el placeholder), `INSERT` (inserta Iterator con ese schema) |
| **SLOTS** | Variables disponibles del contexto del documento (slots del Bridge/Workflow vinculado) | `{{copy}}` (copia el tag), `INSERT_TEXT` (inserta Text block con el slot) |
| **OBJECTS** | Silos de datos, colecciones, imágenes del Drive | `PREVIEW`, `INSERT_IMAGE`, `INSERT_TABLE` |

Cada fila del sub-tab WORKSPACE sigue la taxonomía:

```
[ICON][LABEL]           [{{}}][INSERT]
```

- `{{}}` botón: Copia el placeholder `{{FIELD_NAME}}` al portapapeles con feedback de Toast.
- `INSERT` botón: Crea el bloque apropiado (TEXT, IMAGE, ITERATOR) en el canvas con el dato pre-configurado. El bloque se inserta como hijo del nodo actualmente seleccionado, o como hijo de `root` si no hay selección.

---

### 3.2 ZONA B — Entity Inspector (Propiedades de la Entidad Activa)

**Responsabilidad:** Panel paramétrico dinámico de la entidad seleccionada. Cambia completamente según el tipo del nodo activo. Ocupa el espacio restante (`flex: 1`) bajo el árbol.

#### 3.2.1 Header del Inspector

```
[ICON] [TIPO] — [#ID]       [DUPLICATE_BTN] [DELETE_BTN:hold]
```

Siempre visible. Botones de acción de entidad: duplicar y eliminar (con hold para protección).

#### 3.2.2 Secciones Acordeón por Tipo de Bloque

El inspector se organiza en **secciones acordeón** (`►`/`▼`) que el usuario puede colapsar para reducir el ruido cognitivo. Cada sección agrupa propiedades temáticamente relacionadas:

##### Secciones para `PAGE` (root):

| Sección | Propiedades |
|---|---|
| **FORMAT** | Preset (A4 / LETTER / SQUARE / CUSTOM), ancho, alto |
| **SURFACE** | Background, padding global |
| **FLOW** | Direction (column/row), gap entre hijos directos |

##### Secciones para `FRAME`:

| Sección | Propiedades |
|---|---|
| **LAYOUT** | Direction (row/col), gap, alignItems, justifyContent, wrap |
| **DIMENSIONS** | width, height, minWidth, minHeight |
| **SURFACE** | Background, padding, border, borderRadius |
| **EFFECTS** | opacity, boxShadow, overflow |

##### Secciones para `TEXT`:

| Sección | Propiedades |
|---|---|
| **CONTENT** | content (textarea multiline con soporte `{{slot}}`) |
| **TYPOGRAPHY** | fontSize, fontWeight, fontFamily, lineHeight, letterSpacing |
| **COLOR** | color (text), textAlign |
| **SPACING** | margin, padding |
| **EFFECTS** | opacity, textShadow |

##### Secciones para `IMAGE`:

| Sección | Propiedades |
|---|---|
| **SOURCE** | src (vault_artifact selector), alt |
| **DIMENSIONS** | width, height, objectFit |
| **SURFACE** | border, borderRadius |
| **EFFECTS** | opacity, filter (blur, brightness) |

##### Secciones para `ITERATOR` (Repeater):

| Sección | Propiedades |
|---|---|
| **DATA_BINDING** | schemaId (ArtifactSelector filtrado a DATA_SCHEMA), field de iteración |
| **TEMPLATE** | (botón para entrar al modo de edición de plantilla del item) |
| **LAYOUT** | direction, gap, wrap del contenedor del repeater |

#### 3.2.3 Regla de Estado Vacío

Cuando no hay ningún nodo seleccionado, el inspector muestra las propiedades globales del documento:
- Un resumen de estadísticas del AST: nº de bloques, profundidad máxima, nº de text nodes, nº de iteradores.
- Un `EmptyState` con instrucción: `SELECT_BLOCK_TO_INSPECT`.

---

## 4. INTERACCIÓN ENTRE ZONAS (El Protocolo de Selección)

```
Usuario click en LayerTree (Zona A)
    → selectNode(id) [SelectionContext]
    → Zona A: fila resalta con accent border
    → Zona B: re-renderiza con las secciones del tipo del nodo seleccionado
    → Canvas: el bloque en el canvas recibe outline accent

Usuario click en bloque del Canvas
    → selectNode(id) [SelectionContext]
    → Zona A: el árbol se auto-scrollea hasta la fila del nodo seleccionado
    → Zona B: re-renderiza con las secciones del tipo del nodo
```

Este protocolo es **unidireccional a través del `SelectionContext`**. El contexto es la única fuente de verdad para "qué está seleccionado".

---

## 5. COMPONENTES NUEVOS / MODIFICADOS

### 5.1 Nuevos Artefactos

| Artefacto | Responsabilidad | Ubicación |
|---|---|---|
| `WorkspaceResourcePanel.jsx` | Tab WORKSPACE completo: sub-tabs SCHEMA / SLOTS / OBJECTS | `DocumentDesigner/layout/` |
| `EntityInspectorSection.jsx` | Sección acordeón genérica `[► NOMBRE] [content]` | `DocumentDesigner/inspector/` |
| `inspectorManifests.js` | Objeto de configuración de secciones por tipo de bloque (toda la declaración de campos) | `DocumentDesigner/inspector/` |

### 5.2 Artefactos Modificados

| Artefacto | Cambio |
|---|---|
| `LayerTree.jsx` | Agregar botón DUPLICATE. Hacer `↑ ↓` siempre visibles (baja opacidad por defecto). Agregar `DragHandle` por fila. |
| `NavigatorPanel.jsx` | Renombrar tab `DATA` → `WORKSPACE`. Sustituir contenido del tab por `WorkspaceResourcePanel`. Agregar lógica de inserción de bloques desde workspace. |
| `PropertiesInspector.jsx` | Refactorizar secciones en acordeones usando `EntityInspectorSection`. Migrar data a `inspectorManifests.js`. Agregar botón DUPLICATE al header. |
| `ASTContext.jsx` | Agregar método `duplicateNode(id)` al contexto. |
| `index.jsx` | Ajustar el layout del panel derecho para que Zona A tenga altura mínima garantizada y Zona B tenga `flex: 1`. |

---

## 6. AXIOMAS DE IMPLEMENTACIÓN

Estos axiomas son **inviolables** durante la implementación. Contradicen el ADR si se violan.

**A1 — Árbol Siempre Visible:** El `LayerTree` (Zona A) NUNCA colapsa más allá de su `min-height: 160px`. Si el inspector necesita más espacio, es el inspector quien hace scroll, no el árbol quien desaparece.

**A2 — Inserción Contextual:** Todo recurso del tab WORKSPACE que se inserte en el canvas, se coloca como hijo del nodo **actualmente seleccionado**. Si no hay selección, el nodo se inserta al final de `root.children`. Nunca como hermano raíz de `root`.

**A3 — Duplicado es Lazy:** `duplicateNode` produce un clon superficial del nodo con un nuevo ID. Los IDs de los hijos también se regeneran recursivamente. El clon se inserta **inmediatamente después** del nodo original en el árbol (mismo padre, posición + 1).

**A4 — Acordeones Persistentes:** El estado abierto/cerrado de cada sección acordeón del inspector debe persistir en `localStorage` con la clave `indra_dd_inspector_sections`. El usuario cierra la sección `EFFECTS` una vez y no vuelve a verla abierta salvo que la abra él mismo.

**A5 — Copy Placeholder es Inmediato:** El botón `{{}}` del tab WORKSPACE no abre ningún modal ni requiere confirmación. Copia al portapapeles y dispara `ToastNotification` con el texto copiado. Zero friction.

**A6 — Soberanía del CSS (ADR-004 §A6):** Ningún estado de selección, hover, ni focus de los controles del panel usa `style={{ ... }}` en React. Se usa `data-selected`, `data-type`, `data-locked` para que CSS global tenga control exclusivo. La única excepción es el `paddingLeft` del `LayerTree` para simular la indentación del árbol, que es un valor computado en JS.

**A7 — Sin Duplicado en Raíz:** El botón DUPLICATE está deshabilitado (`disabled`, no invisible) cuando el nodo seleccionado es `root` (PAGE). El botón DELETE también. Un tooltip explica: `PAGE_IS_THE_ROOT`.

---

## 7. ESPECIFICACIÓN DE LAYOUT — PANEL TRÍADICO

```css
/* Panel contenedor (Zona A + B) */
.document-panel {
    width: 320px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-bg-surface);
    border-left: 1px solid var(--color-border);
}

/* Zona A: tamaño mínimo garantizado, crece hasta un máximo */
.document-panel__navigator {
    flex: 0 0 auto;
    min-height: 160px;
    max-height: 45vh;   /* No permite que el árbol aplaste al inspector */
    overflow-y: auto;
    border-bottom: 1px solid var(--color-border);
}

/* Zona B: toma TODO el espacio restante */
.document-panel__inspector {
    flex: 1;
    overflow-y: auto;
    min-height: 0;      /* Critical: permite que flex shrink funcione */
}
```

La distribución **no es de proporción fija áurea** en este caso. La Zona A es **adaptativa**: crece con el árbol hasta el 45% del viewport y luego hace scroll internamente. Esto permite que documentos con 3 elementos no desperdicien espacio con un árbol vacío, y documentos complejos con 20 elementos mantengan el árbol útil sin aplastar el inspector.

---

## 8. PLAN DE IMPLEMENTACIÓN (FASES)

### Fase 1 — Fundación (Refactor sin cambios de comportamiento)
1. Crear `inspectorManifests.js` con toda la declaración de campos por tipo de bloque, extrayéndolos de `FrameBlock.jsx`, `TextBlock.jsx`, etc.
2. Crear `EntityInspectorSection.jsx` — acordeón puro, sin lógica de negocio.
3. Refactorizar `PropertiesInspector.jsx` para usar `EntityInspectorSection` + `inspectorManifests.js`.
4. Agregar `duplicateNode` al `ASTContext.jsx`.

### Fase 2 — Robustecimiento del LayerTree
1. Hacer `↑ ↓` siempre visibles (opacity reducida, se eleva en hover/selection).
2. Agregar botón DUPLICATE al `LayerTree`.
3. Implementar `DragHandle` drag-and-drop para reordenamiento entre hermanos.
4. Agregar badges `data-locked` al nodo root.

### Fase 3 — WorkspaceResourcePanel
1. Crear `WorkspaceResourcePanel.jsx` con los 3 sub-tabs (SCHEMA / SLOTS / OBJECTS).
2. Integrar en `NavigatorPanel.jsx` sustituyendo el tab `DATA_SOURCE`.
3. Implementar la lógica de inserción de bloques desde recursos del workspace.

### Fase 4 — Layout Final
1. Ajustar el CSS del panel en `index.jsx` para el modelo `navigator (auto) + inspector (flex:1)`.
2. Implementar la persistencia de acordeones en `localStorage`.
3. Actualizar `ADR_002_UI_MANIFEST.md` §3 con los nuevos sub-artefactos.

---

## 9. REFERENCIAS A PRIMITIVOS REUTILIZADOS

| Primitivo | Uso en este ADR |
|---|---|
| `DragHandle.jsx` | Arrastre de nodos en `LayerTree` |
| `IndraActionTrigger.jsx` | Botón DELETE con hold en `LayerTree` y en inspector header |
| `TabBar` (a crear o adaptar) | Tabs LAYERS/WORKSPACE y sub-tabs SCHEMA/SLOTS/OBJECTS |
| `EmptyState.jsx` | Estado vacío del inspector cuando no hay selección |
| `Spinner.jsx` | Carga del tab WORKSPACE mientras hidrata recursos |
| `Badge` | `HEAD_LOCKED`, tipo de bloque en inspector header |
| `ToastNotification` | Feedback de `{{copy}}` y de acciones de inserción |

---

*Este documento es el contrato de diseño y arquitectura para la evolución del panel del `DocumentDesigner`. Ninguna implementación debe contradecir sus axiomas sin una decisión documentada de revisión de este ADR.*
