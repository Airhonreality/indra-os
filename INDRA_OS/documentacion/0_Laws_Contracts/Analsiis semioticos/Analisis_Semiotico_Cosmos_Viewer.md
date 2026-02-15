# Análisis Semiótico: Cosmos Viewer (Graph Engine)
### Arquetipo: META-ORCHESTRATOR
### Dominio: SPACETIME

Este documento define la fenomenología completa del **Cosmos Viewer**, la interfaz soberana que unifica la experiencia de diseño (Modo Edición) y operación (Modo Ejecución) dentro de INDRA OS. Establece el axioma de que el sistema operativo ya no es una colección de ventanas, sino un territorio topológico navegable.

---

## 1. Ontología Dual: Ejecución vs. Edición

INDRA OS opera bajo el principio de **Transmutación de Vista**. El mismo artefacto (Cosmos) puede proyectarse de dos formas, utilizando el mismo motor de datos subyacente (`AxiomaticStore`) pero diferentes motores de renderizado visual (`DynamicLayoutEngine`).

### A. Modo Ejecución (The Dashboard / Runtime)
**"La Cabina del Piloto"**
*   **Naturaleza:** Es idéntica al `SlotRenderer` tradicional o al `DynamicLayoutEngine` en modo "BOARD".
*   **Propósito:** Operación diaria, entrada de datos, visualización de métricas. Cero distracción estructural.
*   **Portabilidad:** Sí, un Dashboard es un artefacto exportable. Si envías un Cosmos a otro usuario con permisos de "Solo Ejecución", él verá única y exclusivamente esta vista.
*   **Motor:** Usa `ComponentProjector` proyectando en modo `BRIDGE` o `WIDGET`. Los componentes ocupan slots definidos (Grillas, Paneles).

### B. Modo Edición (The Graph / Blueprint)
**"El Plano del Arquitecto"**
*   **Naturaleza:** Es el `GraphEngine` puro.
*   **Propósito:** Construcción de sistemas, cableado de lógica, depuración visual.
*   **Visualización:** Los componentes "explotan" o se "encapsulan" en Nodos.
*   **Motor:** Usa `ComponentProjector` proyectando en modo `NODE`.
    *   *Confirmación Técnica:* El `ComponentProjector` v8.0 ya soporta isomorfismo. Si recibe `perspective="NODE"`, renderiza el chasis con puertos (Inputs/Outputs) y minimiza el contenido interno (o muestra una versión sumaria).

---

## 2. Anatomía de la Interfaz (Desglose de Paneles)

### 2.1. El Lienzo Infinito (The Void)
Es el contenedor de todas las realidades.
*   **Comportamiento Física:** Pan & Zoom infinito (estilo Figma/Miro).
*   **Semántica Espacial:**
    *   *Eje Z (Profundidad):* Al hacer Zoom In en un Nodo Holónico, lo atraviesas y entras a su sub-cosmos.
    *   *Gravedad:* Los nodos relacionados tienden a agruparse visualmente (Layout de Fuerza Dirigida opcional).

### 2.2. La Esfera Soberana (The Command Sphere)
Ubicación: Flotante, anclable magnéticamente.
*   **Anillo Exterior (Navegación Fractal):**
    *   `PORTAL`: Salir al Login.
    *   `EXPLORAR`: Cambiar de Cosmos (Galaxia).
    *   `LAB`: Acceder a herramientas de bajo nivel.
*   **Anillo Interior (Contexto Local):**
    *   `MODO`: Switch Ejecución/Edición (El botón más importante).
    *   `GUARDAR`: Snapshot de la realidad actual.
    *   `AUTO-LAYOUT`: Ordenar el caos entrópico del grafo.

### 2.3. The Archivist & Catalog (Panel Izquierdo)
Origen de la Materia.
*   **Pestaña 1: Archivos (Bault):**
    *   Árbol de directorios clásico de Drive.
    *   *Acción:* Arrastrar un archivo al lienzo crea un **Nodo File**.
*   **Pestaña 2: Schemas (Catalog):**
    *   Lista de definiciones de datos ("Clientes", "Facturas").
    *   *Acción:* Arrastrar un Schema al lienzo crea un **Nodo DB (DataGrid)** listo para recibir datos.
*   **Pestaña 3: Lógica (Tools):**
    *   Adaptadores ("Email", "Slack", "PDF Generator").
    *   *Acción:* Arrastrar crea un **Nodo Funcional** con puertos de acción.

### 2.4. The Inspector (Panel Derecho)
El Microscopio.
*   **Comportamiento Reactivo:** Vacío por defecto. Se activa al seleccionar un Nodo.
*   **Contenidos:**
    *   *Propiedades:* Nombre, Color, Etiquetas.
    *   *Data:* Vista previa del JSON crudo que vive dentro del nodo.
    *   *Conexiones:* Lista textual de qué cables entran y salen (útil para depurar marañas).

---

## 3. Dinámicas de Flujo (User Journey)

### Escenario: Creación de un Sistema de Ventas
1.  **Inicio:** Usuario entra al Cosmos Viewer (Lienzo vacío).
2.  **Materia Prima:** Abre Panel Izquierdo -> Schemas -> Arrastra "Ventas".
    *   *Resultado:* Aparece una Tabla (DataGrid) flotando en el espacio (Modo Bridge encapsulado).
3.  **Lógica:** Abre Panel Izquierdo -> Tools -> Arrastra "Email".
    *   *Resultado:* Aparece un pequeño nodo de Gmail.
4.  **Cableado:**
    *   Activa "Modo Edición" (si no lo estaba). La Tabla revela un puerto `onNewSale`.
    *   Arrastra un cable desde `onNewSale` hasta el puerto `input` del nodo Gmail.
5.  **Ejecución:**
    *   Cambia a "Modo Ejecución".
    *   Los cables desaparecen. El nodo Gmail se oculta (porque es lógica de fondo).
    *   La Tabla de Ventas se expande u organiza en el Dashboard.
    *   Usuario crea una venta -> El sistema envía el mail silenciosamente.

---

## 4. Validación de Viabilidad Técnica

1.  **¿Comparten Motor?**
    *   **SÍ.** Ambos modos consumen el mismo `CosmosState` (artifacts + relationships).
    *   El `DynamicLayoutEngine` solo decide *qué componente pintar*:
        *   Modo Ejecución: Pinta `<SlotRenderer schema={dashboardLayout} />`
        *   Modo Edición: Pinta `<GraphEngine nodes={artifacts} edges={relationships} />`

2.  **¿Soporta la Tabla-Nodo?**
    *   **SÍ.** El `ComponentProjector` recibe `perspective="NODE"`.
    *   Dentro de `NodeEngine`, podemos renderizar una versión *mini* de la Tabla, o simplemente un bloque rectangular que *representa* la tabla.
    *   *Recomendación:* En el Grafo, no intentes renderizar la tabla completa con 100 filas (muy pesado). Renderiza un **"Header Card"** que diga "Tabla Clientes (145 registros)" y muestre los puertos. Si quieres ver la tabla, doble clic (Zoom In) o pasas a Modo Ejecución.

3.  **¿Compartir Dashboards?**
    *   **SÍ.** Un Dashboard es solo una configuración de vista (`layout.json`) sobre los mismos datos. Puedes enviar un link que fuerce `viewMode=EXECUTION` y oculte el botón de "Modo Edición".

---

## 5. Axiomas Finales

*   **Axioma de Transparencia:** El Modo Edición no es una herramienta separada; es quitarle la piel a la realidad para ver sus músculos.
*   **Axioma de Permanencia:** Si conectas un cable en el Grafo, la lógica persiste en el Dashboard. Son dos caras de la misma moneda.
*   **Axioma de Soberanía:** El usuario es Arquitecto (Edición) y Habitante (Ejecución) simultáneamente.

---

## 6. Cableado Modular (Core & Front Mapping)

Esta sección detalla cómo cada elemento visual se conecta con la maquinaria subyacente.

### 6.1. El Lienzo (GraphEngine)
*   **Componente React:** `GraphEngine.jsx`
*   **State Consumer:** `state.phenotype.artifacts` (Nodos), `state.phenotype.relationships` (Aristas).
*   **Store Actions:** 
    *   `UPDATE_NODE_POSITION`: Al soltar un nodo tras arrastrar.
    *   `SELECT_ARTIFACT`: Al hacer click (activa Inspector).
*   **Core Method:** Ninguno directo. El movimiento es local. Solo `SAVE_COSMOS` persiste las coordenadas.

### 6.2. La Esfera (SovereignSphere)
*   **Componente React:** `SovereignSphere.jsx`
*   **State Consumer:** `state.phenotype.cosmosIdentity` (Para saber si mostrar anillo interior).
*   **Store Actions:**
    *   `TOGGLE_VISUALIZATION_MODE`: Cambia `layoutSchema.VIEW_MODE` ('GRAPH' <-> 'DASHBOARD').
    *   `APPLY_AUTO_LAYOUT`: Ejecuta algoritmo Sugiyama/Force-Atlas localmente y dispara `UPDATE_NODE_POSITION` masivo.
    *   `SAVE_COSMOS_SNAPSHOT`: Dispara `CosmosStatePersister.forceSave()`.

### 6.3. The Archivist (Panel Izquierdo)
*   **Componente React:** `VaultEngine.jsx` (Modo Sidebar)
*   **State Consumer:** `state.phenotype.flow_state.drive` (Árbol de Archivos).
*   **Store Actions:**
    *   `ADD_ARTIFACT_REQUEST`: Al soltar un archivo en el lienzo. Payload: `{ type: 'FILE', driveId: '...' }`.
*   **Core Method (GAS):** 
    *   `DriveAdapter.listContents(folderId)`: Solo si se expande una carpeta no cacheada.

### 6.4. The Catalog (Panel Izquierdo - Schemas)
*   **Componente React:** `SchemaLibrary.jsx` (Nuevo componente necesario)
*   **State Consumer:** `state.genotype.availableSchemas` (Lista de definiciones).
*   **Store Actions:**
    *   `INSTANTIATE_SCHEMA`: Al soltar en lienzo. Payload: `{ schemaId: 'CLIENTS_DB' }`. Crea un artefacto tipo `DATA_GRID`.

### 6.5. The Inspector (Panel Derecho)
*   **Componente React:** `CosmosInspector.jsx` (o `SlotRenderer` en slot SIDEBAR_SECONDARY)
*   **State Consumer:** `state.phenotype.selection` (ID del nodo seleccionado).
*   **Store Actions:**
    *   `UPDATE_ARTIFACT_PROPS`: Al editar nombre/color.
*   **Core Method (GAS):** 
    *   `SchemaRegistry.validate(props)`: Si se editan propiedades críticas.

---

## 7. Orden de Implementación (Plan de Batalla)

Para levantar esta UI modular sin romper el sistema, seguiremos este orden estricto:

### Fase 1: El Sustrato (GraphEngine Basic)
*   **Objetivo:** Que el lienzo renderice nodos reales del `state`.
*   **Acciones:**
    1.  Conectar `GraphEngine` a `state.phenotype.artifacts`.
    2.  Implementar renderizado de `ComponentProjector` con `perspective="NODE"`.
    3.  Asegurar Pan & Zoom fluido.

### Fase 2: La Soberanía (Switch de Modos)
*   **Objetivo:** Poder alternar entre ver el Grafo y ver el Dashboard.
*   **Acciones:**
    1.  Implementar acción `TOGGLE_VISUALIZATION_MODE` en `AxiomaticStore`.
    2.  Conectar botón "MODO" en `SovereignSphere`.
    3.  Asegurar que `DynamicLayoutEngine` respete el switch.

### Fase 3: La Materia (Drag & Drop)
*   **Objetivo:** Poblar el lienzo desde el panel izquierdo.
*   **Acciones:**
    1.  Habilitar `Draggable` en los items de `VaultEngine`.
    2.  Habilitar `Droppable` en `GraphEngine`.
    3.  Manejar evento `onDrop` -> Crear nuevo artefacto en `state`.

### Fase 4: La Inspección (Editor de Propiedades)
*   **Objetivo:** Modificar los nodos creados.
*   **Acciones:**
    1.  Crear `CosmosInspector.jsx`.
    2.  Conectar selección del Grafo al Inspector.
    3.  Implementar edición básica de JSON properties.

### Fase 5: La Sinapsis (Cableado Real)
*   **Objetivo:** Crear lógica conexionando nodos.
*   **Acciones:**
    1.  Implementar dibujo de aristas (SVG Lines) en `GraphEngine`.
    2.  Definir puertos en `ComponentProjector` (Inputs/Outputs visuales).
    3.  Actualizar `state.phenotype.relationships` al conectar.





