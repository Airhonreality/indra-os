# 🌌 INDRA OS: UX INTERACTION SPEC (Estrategia Maestra V1.0)

> **Versión:** 6.0 (Pro Renderer Evolution - Phase 6)
> **Estatus:** Especificación HCI Final e Inmutable
> **Propósito:** Definición de la maniobra física, fisiología del error, límites físicos, recuperación de datos y sincronización maestra.

---

## 🏛️ 1. ARQUITECTURA DE DOS PANELES (Dual-Core Reality) [I - Contexto de Vista]
**Pre-condiciones (Bootstrap Sequence):**
1.  **Gatillo:** Usuario clica en "Workspace Cluster" en el Dashboard.
2.  **Paso BIOS 1:** Splash Screen muestra "Locando Nodos en Drive..." (Carga de `System_Context`).
3.  **Paso BIOS 2:** Splash Screen muestra "Cargando BIOS Funcional..." (Carga de `Core_Manifest`).
4.  **Feedback Final:** Desvanecimiento de Splash y entrada a 120Hz de los 2 paneles principales.

| PANEL | POSICIÓN | FUNCIÓN TÉCNICA |
|-------|----------|-----------------|
| **1. SOURCE EXPLORER** | Izquierda (20%) | Navegador de Proyectos (`.project`) y Entidades (Índice de UUIDs). |
| **2. GRAPH EDITOR (Reality)** | Centro/Derecha (80%) | Orquestador de Flujo (Nodos de Lógica + Renderer Node) |

> [!NOTE]
> **EIDOS (Live Preview)** ya no es un panel estático. Se manifiesta como una **Superposición Dinámica (Overlay)** al interactuar con archivos `.layout`, permitiendo una inmersión total en el runtime del formulario sin sacrificar el espacio de Reality.

### 1.1 Arquitectura de Perspectivas Sinestésicas (ADR-005)
INDRA no usa pestañas; usa planos de realidad que coexisten en el mismo lienzo:
1.  **BIOS (Infraestructura):** Visualización de la salud del sistema y archivos `.sys`.
2.  **EIDOS (Forma):** El plano del diseño visual y la estética (Hi-Fi).
3.  **LOGOS (Nervio):** El plano de los **Sockets** y cables. Las entidades revelan su lógica.
4.  **SOMA (Cuerpo):** El plano de acción. Los componentes se vuelven interactivos (Soma = Cuerpo vivo).

### 1.1 Navegación por Identidad (Resolución de UUIDs)
El sistema opera exclusivamente mediante un modelo de datos orientado a objetos y UUIDs.

*   **Tipificación de Entidades:** Los elementos se agrupan por Tipo de Objeto (UUID-Type): "Clientes", "Cotizaciones", "Lógicas".
*   **Búsqueda Semántica:** El sistema resuelve el UUID a través del `System_Context.json` basándose en la intención de búsqueda de usuario.
*   **Multitenencia Lógica:** Un artefacto es una referencia única (UUID) proyectable en múltiples contextos sin duplicidad de datos.

### 1.2 Contrato de Matrimonio UI/Infraestructura (Doc D + Doc E)
Para garantizar el **Estatus de Invarianza**, el Satélite y el Core firman un pacto de resolución ciega:
*   **La Intention (UI):** El Satélite pide el objeto "Cliente Tesla" basándose en su identidad lógica.
*   **La Resolución (Infraestructura):** El Core no busca una ruta física (ej: `/proyectos/tesla.json`), sino el **UUID inmutable** (ej: `123-456-789`).
*   **Resiliencia Total:** Si un usuario mueve el archivo en Google Drive manualmente, el sistema **no se rompe**. La interfaz sobrevive al accidente físico porque su ancla es la sustancia (UUID) y no el accidente (Ruta).

---

## 🏛️ 2. GRAPH EDITOR (Reality) [II - Anatomía | III - Comportamiento]
**Estado Inicial:** Canvas vacío o Carga de un **Proyecto Visual** (`.project.json`) seleccionado en el Navigator.

### 2.1 Tipos de Nodos y Filosofía de Terminal
Reality contiene **DOS** categorías principales de nodos:

**A. Nodos de Lógica (Genéricos)**
- Widgets estándar con campos de texto planos.
- Configuración manual requerida (copy/paste de IDs).
- Solo viven en el canvas principal de Reality.

**B. Nodos Especializados (Indra OS Terminals)**
- **Concepto:** Actúan como terminales interactivos hacia la realidad externa (Notion, Drive, Gmail, Sheets).
- **Consistencia Visual:** Todos siguen el estándar `SpecializedTerminal.css` (Premium Dark, glassmorphism, cabeceras integradas).
- **Sincronización Activa:** Botón "Refresh Data" que permite interrogar al Core bajo demanda.
- **Lógica Híbrida (Varianza):** Capacidad de resolver datos de dos fuentes:
  - `Native Input`: UI nativa enriquecida (dropdowns, browsers de archivos, editores WYSIWYG).
  - `Flux Input`: Inyección de datos por cable desde otros nodos.
- **Soberanía del Operador (Hot Bypass):** Cada campo inyectado posee un ícono de "Desacople". El usuario puede forzar el valor nativo sin desconectar el cable físico (Override Temporal).
- **Propagación de Esquema Sombra:** Al configurar un terminal (ej: conectar una Sheet), este proyecta su estructura de datos hacia los nodos conectados, habilitando autocompletado inteligente en el destinatario.
- **Doble-Click Contextual:** Abre el terminal especializado correspondiente según lo definido en el `Discovery Blueprint`.

**D. Universal Data Binding UI (Protocolo V5.0)**
- **BindingInput Component:** Los campos de texto en terminales dejan de ser planos para convertirse en "Interactuadores Inteligentes".
- **Gatillo [🔬 Preview]:** Activa el **Microscopio de Datos**. Resuelve las expresiones `{{variable}}` en tiempo real contra el Cosmos actual, permitiendo ver el resultado final (ej: ver el nombre del cliente real en el cuerpo de un email).
- **Gatillo [⚡ Bind]:** Despliega el **Discovery Helper**. Muestra un menú con todos los campos disponibles detectados en los nodos conectados aguas arriba (Upstream Discovery).
- **Consistencia:** Este patrón es obligatorio para TODO nodo que procese información dinámica (Gmail, Calendar, Sheets, Renderer, etc).

**C. Renderer Node (Diseñador Universal Pro)**
- Apariencia en canvas: Caja normal con puertos de entrada/salida.
- **Doble-click → Abre canvas interno "Indra Studio" (Figma-grade)**.
- **Motor Híbrido:** Capa de Canvas 2D para alto rendimiento + DOM Interactivo.
- **Data-Driven:** Capacidad de bindear capas a campos del esquema sombra de nodos upstream.
- **Glassmorphism:** Interfaz inmersiva con desenfoque de fondo ("Deep Space").
- **Multiplayer:** Cursores de colaboradores visibles en tiempo real.

### 2.2 Caso de Uso DETALLADO: Diseñar un PDF de Factura
> [!NOTE]
> **ACTUALIZACIÓN FASE 6 (Pro Renderer):** El Renderer ahora soporta **Auto Layout V2** (Flexbox), **Vector Networks** y **Presencia en Tiempo Real**. Para detalles de la nueva interfaz tipo Figma, consultar el `contrato_renderer_canvas.md` (V2.0). Las interacciones descritas abajo se mantienen conceptualmente pero con mayor potencia visual.

#### FASE 1: Construcción del Flujo de Datos
1. Usuario arrastra `notionAdapter` desde stencils al canvas de Reality
2. **Inspección del adaptador:**
   - Click en el nodo para seleccionar
   - Campos visibles en el cuerpo del nodo:
     - `API Key`: [input password] → Usuario escribe key
     - `Database ID`: [input text] → Usuario pega ID de Notion
     - `Mode`: [select] → Usuario elige "query"
3. Usuario arrastra `Renderer Node` al canvas
4. **Conexión de puertos:**
   - Click y hold en puerto `out_result` del notionAdapter
   - Cable fantasma aparece siguiendo el cursor
   - Soltar sobre puerto `in_data` del Renderer Node
   - Cable se solidifica (animación de partículas corriendo)

#### FASE 2: Apertura del Canvas de Diseño
5. Usuario hace **DOBLE-CLICK** en el cuerpo del `Renderer Node`
   ↓
6. **TRANSICIÓN VISUAL:**
   - Reality se desvanece (fade out 300ms)
   - Renderer Canvas se expande desde el nodo (zoom in 400ms)
   - Se abre INTERFAZ TIPO FIGMA:

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back to Reality]  RENDERER CANVAS: Invoice PDF    [💾 Save]│
├────────┬────────────────────────────────────────────┬────────┤
│ LAYERS │              CANVAS (A4 Portrait)          │ PROPS  │
│────────│                                            │────────│
│ 📄 Page 1                                           │ LAYER: │
│  ├ 🖼️ Header      [A4: 210mm × 297mm]              │ Header │
│  ├ 📊 Content     ┌──────────────────────┐         │────────│
│  └ 🔲 Footer      │ [Logo]    INVOICE    │         │Layout: │
│                   │                      │         │□ Auto  │
│ [+ Add Layer]     │ Cliente: _______     │         │        │
│ [+ Add Page]      │                      │         │Direction│
│                   │ [Table placeholder]  │         │▼ Vert. │
│                   │                      │         │        │
│                   │ Total: $_____        │         │Spacing │
│                   └──────────────────────┘         │[10] mm │
│                                                     │        │
│ TOOLS: [T] [□] [○] [📷] [📊]                      │Padding │
└─────────────────────────────────────────────────────────────┘
```

#### FASE 3: Diseño del Header
7. Usuario hace click en botón **[T]** (Text Tool)
8. Click en el canvas superior
   ↓
9. **Text Layer creado automáticamente:**
   - Aparece en Layer Tree: "Text Layer 1"
   - Cursor parpadeante activo
   - Usuario escribe: "FACTURA"

10. **Estilización vía Property Panel:**
    - Font Size: Mueve slider a **24pt**
    - Font Weight: Selecciona **Bold**
    - Color: Click en token picker → Elige `--text-primary`
    - Alignment: Click icono **Center**

11. Usuario arrastra **Image Tool** [📷]
12. Click en canvas (debajo del título)
    ↓
13. **Modal de Image Source:**
    - Radio button: ( ) URL  ( ) Upload  (●) Data Binding
    - Input aparece: `Source: {{logoData.url}}`
    - [OK]

14. **Agrupación en Container (Auto-Layout):**
    - Shift+Click para seleccionar "FACTURA" + Logo
    - Right-click → "Group in Auto-Layout Container"
    - **Container creado** con nombre "Header Section"
    - En Property Panel:
      - Direction: **Horizontal**
      - Spacing: **10mm**
      - Alignment: **Center**

#### FASE 4: Diseño de Sección de Cliente (Data Binding Dinámico)
15. Usuario hace click en **[T]** (Text Tool) nuevamente
16. Click en canvas (debajo del header)
17. **En lugar de escribir texto fijo, escribe:**
    ```
    Cliente: {{clientData.name}}
    ```
   ↓
18. **SISTEMA DETECTA DATA BINDING:**
    - El texto `{{clientData.name}}` se resalta con fondo verde claro
    - Si hay datos conectados: Muestra valor real "Tesla Inc." en preview
    - Si no hay datos: Muestra placeholder gris "{{clientData.name}}"

19. Usuario presiona Enter y escribe en nueva línea:
    ```
    Dirección: {{clientData.address}}
    Email: {{clientData.email}}
    ```

20. **Agrupación Auto-Layout Vertical:**
    - Selecciona los 3 text layers
    - Ctrl+G → "Group in Auto-Layout"
    - Property Panel:
      - Direction: **Vertical**
      - Spacing: **5mm**
      - Alignment: **Start**
    - Renombra container a "Client Info Section"

#### FASE 5: Tabla de Ítems con Data Source
21. Usuario hace click en **[📊]** (Table Tool)
22. Drag en canvas para definir área de tabla
   ↓
23. **Table Component Configuration Panel aparece:**
    ```
    ┌─────────────────────────────────────┐
    │ TABLE CONFIGURATION                 │
    ├─────────────────────────────────────┤
    │ Data Source (Array Binding):        │
    │ {{invoiceItems}}            [Test▼]│
    │                                      │
    │ Columns:                             │
    │ ┌──────────────────────────────────┐│
    │ │ Field: "name"   Label: "Producto"││
    │ │ Width: 100mm                     ││
    │ │ [Delete]                         ││
    │ └──────────────────────────────────┘│
    │ [+ Add Column]                       │
    │                                      │
    │ Row Height: [10] mm                  │
    │ Header Style: [Edit...]              │
    │ Cell Padding: [5] mm                 │
    │                                      │
    │ [Cancel]  [Apply]                    │
    └─────────────────────────────────────┘
    ```

24. Usuario hace click en **[+ Add Column]** dos veces:
    - Columna 2: Field: `quantity`, Label: "Cantidad", Width: 40mm
    - Columna 3: Field: `price`, Label: "Precio", Width: 50mm

25. Click en **[Test▼]** para ver preview con datos reales
    ↓
26. **Preview Modal se abre mostrando:**
    ```
    ┌───────────────────────────────────────┐
    │ Producto      │ Cantidad │ Precio    │
    ├───────────────┼──────────┼───────────┤
    │ Laptop Dell   │ 2        │ $1,200.00 │
    │ Mouse Logitech│ 5        │ $25.00    │
    └───────────────┴──────────┴───────────┘
    ```

27. Usuario ajusta Column Width dragreando separadores
28. Click **[Apply]** → Tabla se renderiza en el canvas

#### FASE 6: Footer con Cálculo Total
29. Text Tool → Click en parte inferior del canvas
30. Usuario escribe:
    ```
    Subtotal: ${{subtotal}}
    IVA (21%): ${{subtotal * 0.21}}
    TOTAL: ${{subtotal * 1.21}}
    ```

31. **Formato del Total:**
    - Selecciona línea "TOTAL: ..."
    - Property Panel:
      - Font Size: **18pt**
      - Font Weight: **Bold**
      - Color: `--accent-primary`

#### FASE 7: Paginación y Ajustes Finales
32. **Sistema detecta overflow:**
    - Indicador rojo aparece: "Content exceeds page height"
    - Usuario hace click en warning
    ↓
33. **Opciones de Paginación:**
    - ( ) Reduce font sizes
    - ( ) Increase page margins
    - (●) Create new page (Keep-Together)

34. Click **Apply** → Página 2 se crea automáticamente
35. Footer se mueve a página 2

36. **Definición de Templates:**
    - Right-click en "Header Section" → "Set as Header Template"
    - Checkbox aparece: "Repeat on all pages"
    - Header ahora aparece en página 1 y 2

#### FASE 8: Guardado y Salida
37. Usuario hace click en **[💾 Save]**
    ↓
38. **Save Dialog:**
    ```
    ┌──────────────────────────────────────┐
    │ SAVE RENDERER OUTPUT                 │
    ├──────────────────────────────────────┤
    │ Output Type:                         │
    │ (●) Document (PDF)                   │
    │ ( ) Form (.layout)                   │
    │                                      │
    │ Name: [Invoice_Template]             │
    │                                      │
    │ [Cancel]  [Save]                     │
    └──────────────────────────────────────┘
    ```

39. Click **[Save]**
40. **Transición de regreso:**
    - Renderer Canvas se contrae (zoom out 400ms)
    - Reality se materializa (fade in 300ms)
    - Usuario vuelve al canvas principal con el flujo completo

#### FASE 9: Ejecución del Flujo
41. Usuario hace click en botón **"Export PDF"** del Renderer Node
42. Sistema ejecuta:
    ```
    notionAdapter.query() 
      → Datos reales de Notion
      → Renderer Node resuelve todos los {{bindings}}
      → Core genera PDF
      → PDF se sube a Drive
    ```
43. Notificación aparece: "Invoice_Template.pdf generado ✓"

---

**NOTA CRÍTICA:** En NINGÚN momento de este proceso el usuario usó Eidos para diseñar. Eidos permanece vacío. TODO el diseño ocurrió dentro del Renderer Node Canvas.

### 2.3 Indicadores de Estado de Sistema (Fisiología Visual)
*   🟢 **Verde:** Estado sincronizado.
*   🟡 **Divergencia:** Notificación de conflicto.
*   🔴 **Rollback (Veto):** Si el Core rechaza un dato, el nodo emite **Pulso Rojo**.
*   ⚫ **Amnesia (Wipe):** Al cerrar sesión, **Wipe Animation** (degradado a negro).
*   🌊 **Animación de Comunicación:** Los cables muestran partículas cuando hay petición `fetch`.

### 2.5 Sistema de Borrado y Purga (Hard Delete)
El borrado de nodos no es una acción accidental, sino un gesto de soberanía sobre el grafo.

1.  **Gatillo de Teclado:** Al seleccionar un nodo (`selectedId`), las teclas `Delete` o `Backspace` disparan el **Protocolo de Purga**.
2.  **Gatillo de UI:** Botón **[🗑️]** en la barra contextual del nodo.
3.  **Fisiología del Borrado:**
    *   **Feedback:** El nodo emite un **Pulso Rojo** (destello de 200ms).
    *   **Cascada:** Se eliminan automáticamente todas las conexiones (`wires`) entrantes y salientes vinculadas al UUID.
    *   **Amnesia:** El nodo desaparece del `cosmos` y el registro de persistencia se actualiza.

### 2.6 Integrated Node Actions (The Command Header)
Para reducir el ruido visual y la masa flotante, las acciones de gestión de nodos se integran directamente en el **Marco Superior (Header)** del nodo:

-   **Anatomía:** Iconos minimalistas en la esquina superior derecha del nodo: `[⚡ Run]`, `[📑 Clone]`, `[🗑️ Delete]`.
-   **Comportamiento:**
    *   **Visibilidad:** Siempre presentes o revelados al hover/selección para mantener la limpieza estética.
    *   **Interacción:** Clic directo dispara el protocolo correspondiente (Eliminación, Ejecución o Duplicidad).
    *   **Sincronización:** Reflejan el estado del nodo (ej: El rayo de ejecución pulsa durante la actividad).

---

## 🏛️ 3. LIVE PREVIEW (Eidos) [II - Anatomía | III - Comportamiento]
**Estado Inicial:** Vacío. Se activa SOLO al hacer click en un archivo `.layout` del Source Explorer.

### 3.1 Propósito Puro de Eidos
**EIDOS ES EXCLUSIVAMENTE UN RUNTIME DE FORMULARIOS.**

- **NO** renderiza nodos del grafo
- **NO** muestra PDFs generados
- **SOLO** ejecuta formularios interactivos diseñados en el Renderer Node

### 3.2 Flujo de Activación

**Paso 1: Diseñar Formulario**
- Usuario abre Renderer Node (doble-click)
- Diseña formulario "RegistroCliente"
- Componentes: Input (Nombre), Input (Email), Select (País), Button (Enviar)
- Configura data binding a Amnesia
- **Guarda como `RegistroCliente.layout`**

**Paso 2: Aparición en Source Explorer**
- El `.layout` guardado aparece en la sección "LAYOUTS"
- Icono: 📋 (formulario)

**Paso 3: Ejecución del Formulario**
- Usuario hace **click** en `RegistroCliente.layout`
   ↓
- **EIDOS SE ACTIVA**
- Muestra el formulario diseñado con campos editables
- Usuario llena datos en Eidos
- Click en "Enviar"
   ↓
- Datos capturados → Amnesia → Fluyen al grafo en Reality

**Paso 4: Datos Alimentan el Flujo**
```
[Eidos: Formulario] → [Amnesia: clientData]
                        ↓
                   [Reality: Flow]
                   notionAdapter ← clientData
                        ↓
                   Renderer (PDF)
                        ↓
                   Export to Drive
```

### 3.3 Lo Que Eidos NO Hace
- ❌ NO diseña formularios (eso es el Renderer Node)
- ❌ NO muestra PDFs renderizados
- ❌ NO renderiza nodos del grafo
- ❌ NO tiene controles de diseño (grids, fonts, colors)
El sistema gestiona la interfaz en dos capas diferenciadas dentro del archivo `.layout`:

| CAPA | ROL FUNCIONAL | PERSISTENCIA |
|------|---------------|--------------|
| **INPUT LAYER** | Captura de datos de usuario (Formularios). | Atributos de entrada en `.layout`. |
| **OUTPUT LAYER** | Visualización de datos y reportes (PDF). | Plantilla de renderizado en `.layout`. |

### 3.2 El Motor de Mapeo Físico (Snap-Grid Engine)
La configuración de la UI es una maniobra física gobernada por un sistema de imanes visuales:

1.  **Pinzamiento de Nodo:** Usuario mantiene **Click Izquierdo** sobre un puerto en el **Graph Editor**.
2.  **Trayectoria (Phantom Wire):** Un cable semi-transparente sigue al cursor hacia el **Live Preview**.
3.  **Zonas Magnéticas (Snap-to-Grid):** Al entrar en el panel de Preview, el sistema resalta "Drop Zones" rectangulares. El widget se auto-ajusta a la rejilla de diseño al soltar.
4.  **Re-ordenamiento Dinámico:** Si un widget se suelta entre dos existentes, estos se desplazan visualmente (Push Animation) para abrir espacio.
5.  **Arrastre Kinestésico (Acción por Proximidad):** 
    *   **Mecánica:** Al arrastrar un UUID de entidad (ej: Empleado) desde el Source Explorer y "lanzarlo" sobre un Nodo de Lógica específico.
    *   **Feedback:** El nodo emite un **Aura de Atracción** y se auto-conecta al puerto de entrada más afin. El sistema dispara la lógica (ej: Aprovisionamiento) sin necesidad de cableado manual en casos de flujo pre-definido.

### 3.3 Contextual Style Panel (Herramienta de Diseño)
El control estético no es una propiedad oculta, sino una herramienta de acceso directo:

1.  **Gatillo:** **Clic Derecho** sobre cualquier Widget en el Live Preview.
2.  **Interfaz:** Se despliega un panel flotante de propiedades.
3.  **Controles Tangibles:**
    *   **Tipografía:** Selectores de escala (H1-Body).
    *   **Color:** Acceso a paletas UUID-Linked y círculo cromático.
    *   **Métricas:** Sliders para Padding y Margen con reflejo instantáneo en el lienzo.

### 3.4 Eidos Diagramming Canvas (Diagramación 2D)
Para el diseño de la **Output Layer (PDF)**, el Live Preview activa el modo de composición rica:

1.  **Lienzo de Composición:** Muestra reglas milimétricas y guías magnéticas (Figma-style).
2.  **Smart Frames & Geometría de Repetición:** 
    *   **Auto-layout Engine:** Contenedores con ejes de flujo (Horizontal/Vertical).
    *   **Regla de Desbordamiento:** Si una lista excede el ancho del frame, el sistema activa el `Flex-wrap` automático o muestra un **Indicador de Corte (Línea Roja)** para obligar al usuario a redimensionar.
3.  **Paginación Física:** 
    *   **Page Break UI:** El canvas muestra una línea discontinua de "Salto de Página". 
    *   **Manejo de Huérfanos:** No se permite que un Smart Frame se divida a la mitad; si el contenido no cabe, el bloque entero salta a la siguiente página (Keep-together logic).
4.  **Ghost Data & Resistencia de Texto:** 
    *   **Inyección de Datos Reales:** Switch "Live Ghost".
    *   **Regla de Texto Largo:** Los campos de datos aplican **Truncado con Elipsis (...)** por defecto. El usuario puede conmutar a "Crecimiento Vertical" en el panel de estilos, lo que empuja los elementos inferiores (Collision Push).
5.  **Tiradores, Borrado y Deshacer:** 
    *   **Handles:** Nodos de control de redimensionamiento.
    *   **Gatillo de Borrado:** Al hacer hover, aparece un icono de **Papelera Roja**. Acción: Clic o tecla `Delete`.
    *   **Feedback "Amnesia":** El elemento se desvanece con un efecto de tinta disuelta.
    *   **Mecánica de Deshacer (The Recall):** Comando `Ctrl+Z`. No hay botón visual. 
    *   **Feedback "Flashback":** El elemento se reconstituye con una animación de tinta condensándose de nuevo en el widget.
6.  **Sincronización Multicanal (Sync Link):** 
    *   **Icono de Eslabón:** Indicador en la esquina del widget (Cadena). 
    *   **Re-sincronización (Priority Master):** Al cerrar un eslabón roto, los estilos del **Preview (Satélite)** sobrescriben los del PDF. 
    *   **Feedback:** Destello cian breve sobre el widget del PDF para confirmar la paridad.

### 3.5 Indicadores de Estado de Datos y Bloqueos
*   🔵 **Cian Pulsante:** Datos sincronizados.
*   🟠 **Naranja:** Dato modificado (Pendiente de persistencia).
*   � **Rojo Discontinuo (Veto):** Error de validación o falta de stock.
*   **Estado de Ítem Vetado (Estado Fantasma):**
    *   **Visualización:** El ítem permanece en la lista para auditoría pero se desatura al 50%.
    *   **Borde:** Línea roja discontinua.
    *   **Indicador:** Icono de advertencia (!) junto al campo de datos con tooltip del error del Core.
*   �🔒 **Bloqueo de Gatillo (Cooldown):** En Error 422, el botón de ejecución se deshabilita físicamente y muestra un contador de cuenta regresiva.
*   🔒 **Bloqueo de Gatillo (Cooldown):** En Error 422, el botón de ejecución se deshabilita físicamente y muestra un contador de cuenta regresiva.
*   **Veto Ghosting (Previsualización de Riesgo):**
    *   **Mecánica:** Mediante pre-fetch asíncrono, si el Core detecta una condición de veto inminente (ej: margen < 5%).
    *   **Visualización:** El botón de acción se vuelve translúcido al 20% y aplica un **Imán Inverso** (se aleja levemente del cursor al intentar clicar).
    *   **Propósito:** Avisar del peligro cognitivamente antes de que ocurra la colisión de datos.

### 3.6 Versioning Monitor (Notas de Arquitectura)
*   **Propósito:** Notificar al usuario/dev sobre limitaciones técnicas temporales para evitar "magia" fallida.
*   **Ejemplo PDF:** Widget de alerta persistente en el Eidos Canvas: *"Nota V5.2: Renderizado Hi-Fi activo. Este documento requiere 'Print PDF' desde el navegador para fidelidad total. El renderizado en segundo plano (Core) tiene limitaciones de estilo."*
*   **Gobernanza:** Estas notas son inyectadas por el `.sys` y pueden ser desactivadas globalmente por un flag de producción.

---

## 🏛️ 4. AETHER CONSOLE & RIBBON (TRANSPARENCIA OPERATIVA) [V - Estados de Borde]
Para garantizar la transparencia del sistema, se implementa la **Consola de Precisión Aether**, diseñada para no obstruir pero estar siempre presente.

### 4.1 El Aether Ribbon (Barra de Tutoriales)
*   **Anatomía:** Una barra extremadamente delgada (5px - 8px) pegada al borde inferior de la pantalla.
*   **Función de Autodocumentación:** Al pasar el cursor (Hover) sobre cualquier interactor, botón o puerto, el Ribbon muestra un texto descriptivo breve y técnico (Mini-Tutorial).
    *   *Ejemplo:* Hover sobre "Create Filter" -> Ribbon muestra: `"DOC: Instanciar filtro lógico reutilizable (Módulo Logos)"`.
*   **Mecánica Code-to-UI:** Todo método de acción en el código debe incluir una propiedad `hoverDoc` que el Satélite proyecta en el Ribbon en tiempo real.
*   **Atom Zoom (Lupa de Linaje de Datos):**
    *   **Gatillo:** Gesto de "Pinch" (Pinza) o `Alt + Scroll` sobre un campo de datos (`UniversalItem`).
    *   **Acción:** El Ribbon se transforma en un **Mapa de Linaje**, mostrando la cadena de UUIDs (Creador -> Validador -> Sensor) de la que proviene ese dato específico.
    *   **Transparencia:** Permite auditar la verdad de un dato sin salir del contexto de visualización.

### 4.2 Consola de Precisión Aether v2.0 (Atomic Audit)
Al activar la consola desde el Ribbon, se despliega el centro de diagnóstico avanzado:

1.  **📡 NEUTRON LOGS (Handshake):** 
    *   Registro atómico y expandible de toda comunicación con el Core.
    *   **Atomic Detail:** Permite ver el `Payload` enviado y la `Response` completa en formato JSON para debugging profundo.
2.  🚨 **ERRORS (Anomaly Detector):**
    *   Filtrado exclusivo de colisiones de realidad.
    *   Captura automática de fallos en el `flowId` y denegaciones del servidor.
3.  🌊 **DATA FLUX (Materia Registry):**
    *   Telemetría de Átomos (nodos), Conexiones (cables) y Workspaces.
    *   Estado de la sincronización en vivo.
4.  🧠 **STATE (Zustand Inspector):**
    *   Inspección de la memoria RAM del Satélite: Sesión activa, metadatos y manifiestos.
5.  ⚡ **SYNC MONITOR (Persistencia):**
    *   Muestra la cola de mutaciones en espera.
    *   Visualiza el latido de persistencia hacia el `flowRegistry` del Core.

### 4.3 Comportamiento y Pausa de Realidad
*   **Pausa Operativa:** Botón que congela el canal Neutrón, permitiendo al operador inspeccionar el estado exacto de los datos antes de un `Rollback` o `Sync`.
*   **Capacidad de Auditoría:** Memoria de hasta 200 logs atómicos para análisis retrospectivo.

---

## 🏛️ 5. PROTOCOLO DE TRANSMISIÓN (Neutrón V5.5)
Para garantizar la **Soberanía de Datos**, todas las peticiones al Core siguen el **Axioma de Invarianza Total**:

- **Atomic Payload Wrapper:** Los parámetros nunca viajan sueltos. Se encapsulan en un objeto `payload` para que el Orquestador del Core pueda desglosarlos a argumentos posicionales de forma segura.
- **Bypass de CORS:** Uso de `text/plain` para evitar Preflight OPTIONS y maximizar la velocidad de ignición.
- **Resiliencia Exponencial:** 3 reintentos automáticos tras fallo de red antes de declarar el `CRASH` en el Aether Console.

---

## 🏛️ 6. ONTOLOGÍA Y CONTRATOS

### 4.1 Categorías de Nodos
*   **Master Nodes:** Registros inmutables (Clientes).
*   **Transaction Nodes:** Registros dependientes (Facturas).
*   **Logic Nodes:** Archivos `.logic`. Transformadores puros de datos.

### 4.2 Mapeo por Afinidad Semántica
*   **Quick Fix:** Si un puerto de salida coincide en nombre con un puerto de entrada, el sistema ofrece: *"¿Sellar mapeo automático de [n] campos?"*. Un solo clic para evitar el micro-mapeo manual.

---

## 🏛️ 5. ESTRUCTURA DE AUDITORÍA POR CASO DE USO (EL VIAJE DEL USUARIO)
La auditoría no evalúa pantallas estáticas, sino la **Continuidad del Viaje**. Todo fragmento de diseño debe pertenecer a una fase de este ciclo. Si hay un "salto de fe" (magia) entre fases, la auditoría falla.

| Fase del Viaje | Propósito (La Intención) | Evidencia Obligatoria (Evidencia) |
|----------------|--------------------------|------------------------------------|
| **1. Llegada (Contexto)** | "Saber dónde estoy y qué puedo hacer." | Nombre de Vista, Pre-condiciones, Estado Inicial. |
| **2. Orientación (Anatomía)** | "Identificar herramientas para mi objetivo." | Inventario de Paneles, Botones y Áreas de Drop. |
| **3. Acción (Interacción)** | "Ejecutar el cambio o solicitud." | Gatillo exacto (Clic/Drag), Módulo utilizado. |
| **4. Reacción (Feedback)** | "Confirmación de que el sistema entendió." | Spinners, Validaciones visuales, LEDs de estado. |
| **5. Resolución (Salida)** | "Obtener el resultado y terminar." | Nuevo recurso (Output), Cambio de estado o anclaje. |

---

## 🏛️ 6. PROTOCOLO DE DATOS Y CONFLICTOS [IV - Integración | V - Estados de Borde]

### 5.1 El Fin del "Guardar como..." (Anclaje Automático)
*   **Acción:** El guardado no es una decisión del usuario, es una consecuencia del flujo. Al cerrar un nodo o completar un formulario, el sistema dispara el anclaje al `storage/` plano.
*   **Resolución de Conflictos:** Si la nube es más reciente (ETag mismatch), el sistema entra en **Estado de Divergencia**. No borra el trabajo local; muestra ambas versiones y pide al Operador que elija la "Realidad Ganadora".

---

## 🏛️ 7. GOBERNANZA Y VETO [III - Comportamiento | V - Estados de Borde]

### 6.1 El Botón de Ignición (Anclaje)
*   **Cooldown:** 10 segundos tras un error crítico para evitar saturación del Core.
*   **Honestidad Visual:** Si la API de Notion falla, el sistema informa del "Anclaje Parcial". Nunca finge consistencia si no hay confirmación del Core.

---

## 🏛️ 8. GUÍA DE MANIOBRA FÍSICA: EL CASO DEL COTIZADOR [III - Comportamiento]
Narrativa técnica de las acciones físicas para operar el sistema eliminando toda "magia".

### FASE 1: Construcción y Rectificación (Layout Engine)
1.  **Llegada:** Clic en "Workspace Cluster". Bios Flash Screen.
2.  **Mapeo y Error Humano:** 
    *   **Drag & Drop:** El usuario arrastra "Silla Oficina" tres veces por error.
    *   **Gatillo de Borrado:** Hover sobre el tercer widget -> Clic en el icono de papelería roja. 
    *   **Amnesia Feedback:** El widget se disuelve. El sistema reajusta el Snap-Grid.
3.  **Ajuste de Límites (Texto Largo):** 
    *   Activa "Live Ghost". Un producto muestra: "Mesa de Roble Escandinavo Tratada con...". 
    *   **Feedback de Corte:** El texto aparece con elipsis (...). El usuario expande el Smart Frame manualmente; el widget inferior se desplaza (Collision Push) para mantener el Gap.
4.  **Diagramación Multicanal:** 
    *   Activa el **Eidos Canvas**. Verifica que el **Eslabón** esté cerrado para mantener el estilo visual.
    *   **Paginación:** Arrastra el bloque de "Condiciones de Venta". La línea de Salto de Página indica que el bloque es demasiado largo. El bloque salta automáticamente a la Página 2 (Keep-together).
5.  **Feedback de Origen:** Check Verde en Source Explorer.

### FASE 2: Ejecución y Gestión de Errores
1.  **Selección:** Clic en buscador de clientes. Click Izquierdo en "Tesla".
2.  **Inserción y Duplicidad:**
    *   Doble Clic en "Sofá". Aparece en la lista.
    *   **Caso Duplicado:** Doble Clic nuevamente en "Sofá". El ítem en la lista emite un **Destello Amarillo** y el contador de cantidad salta visualmente (+1).
3.  **Disparador y Veto de Inventario:**
    *   El usuario desliza el **Switch** a "APROBADO".
    *   **ESCENARIO VETO (Sin Stock):** El Core rechaza. El Switch ejecuta una **Shake Animation** (vibración roja), vuelve a "BORRADOR" y el borde del widget pulsa en Rojo Crítico.
4.  **Resolución Exitosa:** Al ser validado, el botón de Persistir emite **Onda de Partículas** y el log de la Bottom Bar confirma el anclaje físico.

---

## 🏛️ 9. AUDITORÍA DE COLAPSO Y VETO [V - Estados de Borde]
| Punto de Falla | Acción de INDRA OS | Feedback Visual |
|----------------|-------------------|-----------------|
| **Vulnerable** | Veto Absoluto si el Log falla. | Botón parpadea en Rojo. El Espejo vuelve a "Pendiente". |
| **Conflictivo** | Bloqueo por Mismatch (ETag). | UI muestra "Estado de Divergencia". Requiere resolución manual. |

---
> **Nota de Auditoría Final:** Este documento cumple con el **Sello de Invarianza Total (V5.3)**. Se han cerrado todas las fracturas de interacción: recuperación de datos, prioridad de sincronización, estados de error auditables, depuración técnica (Aether Ribbon) y sistema de Autodocumentación por Hover. El Blueprint está listo para la materialización industrial.


---

## 🏛️ 10. HORIZONTE ESTRATÉGICO (PRÓXIMOS PASOS) - FASE 7+
La estabilización del Renderer Pro (Fase 6) habilita la recta final hacia la producción masiva.

### 🎨 Renderer Node (Motor de Visualización de Datos)
*   **Función:** Transformar schemas de datos conectados en interfaces visuales ejecutables.
*   **Paradigma:** El usuario arrastra **campos de datos** desde nodos conectados (Notion, Drive), no herramientas de diseño.
*   **Modos de Renderizado:** Cada campo puede visualizarse como Text, Input, Badge, Select, etc.
*   **Integración:**
    *   Panel Izquierdo: Muestra campos arrastrables del schema descubierto.
    *   Panel Central: Canvas de diseño con capas data-aware.
    *   Panel Derecho: Selector de "Render Mode" para cada capa de datos.
*   **Output:** Archivo `.layout` ejecutable en Eidos con bindings resueltos en runtime.

### FASE 8: CORE PRODUCTION (PDF ENGINE)
*   **Objetivo:** Renderizado de alta fidelidad en el servidor (Core).
*   **Gap Actual:** El Front renderiza HTML/Canvas, pero el Core necesita generar binarios PDF.
*   **Acción Táctica:**
    *   Portar el motor de render (`AutoLayout` + `VectorNetwork`) a Google Apps Script (o servicio híbrido).
    *   Garantizar pixel-perfect match entre Canvas y PDF final.

### FASE 9: INDRA MARKETPLACE
*   **Objetivo:** Ecosistema de nodos y plantillas compartibles.
*   **Acción Táctica:**
    *   Sistema de paquetería de Nodos (`NodeRegistry`).
    *   Galería de Templates para `.layout`.

---
*Fin del Documento D - Versión 6.1 (ROADMAP ACTUALIZADO)*

