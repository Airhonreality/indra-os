# 🏗️ SYSTEM STRUCTURE: INDRA SPATIAL KERNEL (ISK)
## Arquitectura de Capas y Pipeline de Reificación

> **VERSIÓN**: 3.0.0
> **TIPO**: Estructura de Proyección de Alta Fidelidad

---

## 1. LAS CAPAS DEL KERNEL (Deep Stack)

El ISK opera como un sistema de tres capas desacopladas que separan la intención lógica de la manifestación de píxeles.

### L1: La Capa de Intención (Logic Layer)
*   **Módulo Law & DNA**: Carga el `.layout.json` y construye el grafo de dependencias. Aquí se decide *qué* debe existir y bajo qué reglas sistémicas.
*   **Expression Engine (Hybrid JIT)**: El motor que permite la soberanía. Evalúa las expresiones `{{ ... }}`.
    *   *Soberanía*: Utiliza un **Hybrid JIT**. Las expresiones matemáticas se compilan para la GPU, mientras que la lógica compleja se delega a **WebWorkers** para mantener la UI a 60fps sin bloquear el hilo principal.

### L2: La Capa de Cálculo Espacial (Capa de Proyección)
*   **Projection Kernel**: El puente entre L1 y GPU. Utiliza **Data Textures** y **Instanced Rendering** para inyectar el estado de miles de elementos en un solo paso de textura, superando los límites de los UBOs.
*   **Spatial Index (R-Tree)**: Gestiona la visibilidad. Realiza el culling espacial para que, aunque existan 10,000 elementos, solo se procesen los que impactan el viewport.

### L3: La Capa de Manifestación (Anatomy Layer)
*   **Módulos de Anatomía (Tools)**: Herramientas modulares (AutoLayout, FX, Streams).
*   **Shader Factory**: Inyecta código GLSL personalizado para que la estética no sea una imagen, sino un post-procesamiento matemático del dato vivo.

---

## 2. EL PIPELINE DE REIFICACIÓN (Flujo del Fotón)

Para lograr el "Stark Factor", el dato debe viajar desde el Core hasta el monitor sin fricción:

1.  **Ingesta (Core -> ISK)**: El Core inyecta un stream de datos a través del `CoreBridge`.
2.  **Evaluación (L1 - Expression Engine)**: El motor resuelve la expresión reactiva.
    *   *Input*: `core.sensor.temperature` = 25.
    *   *Fórmula*: `fill: "hsla({{ value | map(20, 30, 200, 0) }}, 70%, 50%, 1)"`.
    *   *Output*: `hsla(100, 70%, 50%, 1)`.
3.  **Sincronización de Atributos (L2)**: El valor resultante se inyecta directamente en el **Uniform Buffer** de la GPU.
4.  **Renderizado (L3 - Shaders)**: La GPU dibuja el elemento usando el shader correspondiente, aplicando el color basado en el dato original.

---

## 3. PROTOCOLO DE EXTENSIÓN (Extending Tools)

El ISK es extensible mediante el siguiente protocolo de ensamblaje:

1.  **Sub-Contrato**: La herramienta define sus parámetros en un esquema compatible con el Expression Engine.
2.  **Aislamiento de Estado**: Los módulos no escriben en el `.layout.json` global; emiten **Propuestas de Cambio** que el Kernel de L2 valida antes de aplicar.
3.  **GLSL Injection**: Si es una herramienta visual, debe proveer un fragmento de shader para integrarse en el pipeline de un solo paso de la GPU.

---

---

## 4. ESCALABILIDAD Y RENDIMIENTO

*   **LOD (Level of Detail)**: El Kernel monitoriza el Frame Rate. Si cae por debajo de 55fps, se simplifican las geometrías de L3 automáticamente.
*   **Persistence Agnosticism**: El `.layout.json` contiene la geometría y el vínculo al contrato, pero no el dato vivo, manteniendo el archivo ligero incluso con miles de elementos.

---

## 5. CAPA DE MEMORIA (Object Pool & GC)

Para evitar picos de **Garbage Collection** al manejar 10,000 elementos reactivos:

*   **Object Pooling**: El ISK no destruye nodos. Cuando un elemento sale del viewport o del contrato, se marca como `INACTIVE` y se guarda en un pool.
*   **Reciclaje de Buffers**: Los TypedArrays usados para las Data Textures se pre-asignan. El motor escribe sobre la misma memoria frame tras frame en lugar de crear arrays nuevos.
*   **Worker State Isolation**: El WebWorker mantiene un buffer circular de estados para permitir el **Shadow State** sin replicar objetos pesados de JS.

---

## 6. CAPA DE INTEGRIDAD (The Integrity Boundary)

Para garantizar la **Coherencia Absoluta** y blindar el sistema ante refactorizaciones:

*   **Structural Validator (Core-Sync Control)**: Actúa como un firewall en el Handshake. Verifica que la firma del contrato IO del Core (`.flow.json`) sea compatible con el protocolo de reificación del ISK (`.layout.json`). Si el Core cambia su estructura de datos, el ISK lo detecta antes de renderizar un solo píxel erróneo.
*   **Exploitation Auditor**: Un proceso de auditoría en tiempo de compilación (JIT) que asegura el "provecho" de los datos. Si el Core ofrece 10 campos de telemetría y el ISK solo usa 2, el auditor emite una advertencia de sub-explotación para el desarrollador.
*   **Deterministic Snapshotting**: El `VectorAdapter` guarda un hash del esquema del Core junto con el layout visual, asegurando que el diseño siempre corresponda a la lógica correcta.
