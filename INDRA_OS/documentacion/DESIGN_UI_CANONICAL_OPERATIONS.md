# 🛰️ BLUEPRINT: CANONICAL UI FOR CORE OPERATIONS (v1.0)

## 1. FILOSOFÍA: LA INTERFAZ COMO CAPA DE INSTRUMENTACIÓN
En el ecosistema **INDRACore/INDRA**, la interfaz de usuario no es una aplicación de consumo, sino una **Capa de Instrumentación de Realidad**. Su propósito es reducir el "Gap Cognitivo" entre las complejas Leyes Axiomáticas del Core y la intención operativa del usuario.

### Axiomas de Diseño UI:
1.  **Agnosticismo de Datos**: La UI debe ser capaz de renderizar controles basados exclusivamente en el `schema` del nodo (descubrimiento dinámico).
2.  **Visibilidad de la Causalidad**: Cada acción debe mostrar el flujo de datos que desencadena (Tracing visual).
3.  **Gracia Degradada**: La UI debe funcionar incluso si un adaptador está offline, indicando el estado del "circuito".

---

## 2. PANELES OPERATIVOS CANÓNICOS

### A. Explorador de Ontología (Ontology Explorer)
*   **Propósito**: Navegar por la infraestructura externa conectada (Notion, Drive, Sheets).
*   **Mecanismo**: Utiliza el método `search` o `list` de los adaptadores para generar un árbol de navegación en tiempo real.
*   **Funcionalidad Proyectada**:
    *   **Lazy Loading**: Solo carga sub-directorios o tablas bajo demanda.
    *   **Schema Peeking**: Al pasar el ratón sobre una base de datos de Notion, se proyecta un "fantasma" de sus columnas y tipos de datos.

### B. Constructor Semántico de Payloads (The Smart Pipe)
*   **Propósito**: Puetear datos entre nodos de forma segura y visual.
*   **Interacción (The Tunnel Workflow)**:
    1.  **Handshake**: Al conectar dos nodos, el cable se convierte en un **túnel translúcido**.
    2.  **Mapping Hub**: Un panel flotante permite arrastrar propiedades de salida (Output) a campos de entrada (Input).
    3.  **Cableado Magnético**: El sistema resalta los campos compatibles (ej. String a String) para evitar errores de tipo.
    4.  **Flujo Causal**: El túnel muestra **partículas en movimiento** que indican el flujo activo de información.

### C. Previsualizador de Datos Vivo (Static & Live Forecaster)
*   **Propósito**: Transparentar el contenido de la "tubería" antes y durante la ejecución.
*   **Mecanismo**: Módulo de "Ojo de Buey" o lupa sobre los cables.
*   **Interacción**:
    *   **Static Forecasting (Fase de Diseño)**: Al pasar el cursor sobre un cable, la UI muestra **datos de ejemplo técnicos** basados en el esquema, actuando como un diseñador de "qué pasaría si...".
    *   **Live Preview (Fase de Ejecución)**: En tiempo real, la lupa muestra el payload real que está atravesando el sistema.

### D. Sugerencias de Afinidad Semántica (Contextual Helpers)
*   **Propósito**: Ofrecer patrones comunes sin forzar la lógica ni perder agnosticismo.
*   **Interacción**:
    *   **Affinity Tooltip**: Si conectas dos nodos con intenciones afines (ej. `SCAN` -> `NOTIFY`), aparece un icono sutil de sugerencia.
    *   **Cero Invasividad**: La sugerencia es puramente informativa. Si el usuario no la acciona, el sistema se mantiene en "Grafo Manual" puro.

### E. Simulación de Alta Fidelidad (The PLAY Button)
*   **Propósito**: Ejecutar el flujo en un entorno de pruebas ("Dry-Run") certificado.
*   **Mecanismo**: Activación de la **Shadow Stack**.
*   **Interacción**:
    *   **Shadow Mode**: El Core intercepta las llamadas externas y simula las respuestas sin "escribir" en el mundo real.
    *   **Ghost Notifications**: Los nodos de salida muestran previsualizaciones de lo que se enviaría o guardaría.
    *   **Recorrido Causal**: Una pulsación de luz recorre el grafo permitiendo validar cada paso antes del despliegue final.

---

## 3. CASO DE ESTUDIO: NOTION ADAPTER UI
*¿Cómo operaría un usuario el módulo de Notion en una UI funcional?*

| Módulo UI | Acción del Core | Experiencia de Usuario |
| :--- | :--- | :--- |
| **Workspace Tree** | `search` | El usuario encuentra la base de datos de "Proyectos" visualmente. |
| **Field Mapper** | `retrieveDatabase` | El usuario ve que la columna "Estado" es un `select` y la UI le ofrece las opciones válidas. |
| **Particle Tunnel** | Mapping | El usuario conecta datos viendo cómo el flujo fluye visualmente entre piezas. |
| **Data Forecaster** | Previsualización | El usuario ve el resultado técnico en una burbuja antes de que ocurra. |

---

## 4. GRAMÁTICA VISUAL (FENOTIPO)

Para que el usuario entienda qué está operando, la UI sigue la **UIMasterLaw**:

-   **Color de Borde**: Indica el arquetipo (Azul para `VAULT`, Verde para `ADAPTER`, Púrpura para `ORCHESTRATOR`).
-   **Motion Physics**:
    *   `Static`: El nodo está listo.
    *   `Pulse`: El nodo está enviando datos (Live).
    *   `Breathing`: El nodo está procesando o simulando (Dry-Run).
    *   `Vibration`: Error detectado o incompatibilidad en el Smart Pipe.

---

---

## 5. PANELES DE GOBERNANZA E IDENTIDAD

### A. Identity Hub (Secure Bóveda)
*   **Propósito**: Gestión soberana de credenciales multi-cuenta.
*   **Interacción**:
    *   **Provider Cards**: Módulos visuales para cada proveedor (Notion, Instagram, etc.).
    *   **Identity Toggle**: Capacidad de cambiar la cuenta `default` del sistema con un clic, redirigiendo el tráfico de los flujos de "Testing" a "Producción" instantáneamente.
    *   **Health Ping**: Botón de disparo manual para verificar la validez del token contra el API real.
*   **Visualización**: El borde del card brilla en verde (saludable) o rojo (token expirado/inválido).

### B. Environment Governance (Realidad del Sistema)
*   **Propósito**: Edición de constantes de infraestructura sin tocar el código.
*   **Contenidos**: IDs de carpetas, IDs de Sheets de auditoría, límites de Rate Limit y parámetros de encriptación.
*   **Seguridad**: Requiere re-autenticación para editar parámetros de arquetipo `VAULT`.

### C. Job Queue Monitor (Tráfico y Causalidad)
*   **Propósito**: Supervisión de tareas asíncronas y recuperación de fallos.
*   **Visualización (Kanban Mode)**:
    *   *Pending*: Tareas en espera.
    *   *Running*: Muestra un pulso sobre los nodos activos en el grafo.
    *   *Failed*: Lista de errores con botón de **"Manual Retry"** (re-inyecta el payload original al Core).

### D. System Health (Auditoría de Entropía)
*   **Propósito**: Telemetría visual de la salud del Core.
*   **Métricas**: Carga de memoria, porcentajes de éxito de flujos y estado de cumplimiento de contratos industriales (Axiomatic Audit).

---

## 6. MÓDULO: ARCHITECT CHAT & FLOW GENERATOR
El punto de entrada para el diseño asistido por IA.

### A. Chat de Intención Natural
*   **Interacción**: El usuario describe el flujo deseado (ej: *"Crea un flujo que lea facturas de Notion y me avise por WhatsApp"*).
*   **Arquitectura**: Se comunica con el `IntelligenceOrchestrator` del Core.

### B. Live JSON Stream Viewer
*   **Propósito**: Desmitificar la IA y transparentar la construcción de la lógica.
*   **Visualización**: Una consola de código colapsable al lado del chat.
*   **Dinamismo**: A medida que el LLM genera el razonamiento, el visor muestra el **JSON del Flow** construyéndose en tiempo real.

### C. Canvas Auto-Sync (Real-Time Scaffolding)
*   **Interacción**: No es necesario esperar a que el chat termine.
*   **Proyección**: A medida que el JSON se estabiliza, los nodos y los *Smart Pipes* aparecen físicamente en el canvas. Si el usuario modifica el texto del chat, los nodos se "mueven" o "re-cablean" automáticamente en el canvas.

---

## 7. DETALLE FUNCIONAL DE MÓDULOS (BLUEPRINT DE ARMADO)

Este apartado define el comportamiento exacto de cada pieza de la interfaz, contrastado con los Visual Tokens de la `UIMasterLaw.gs`.

### A. Módulo: SYSTEM SIDEBAR (Navegación de Nodos)
*   **Dharma**: Reflejar la existencia y salud de los componentes registrados.
*   **Interacciones y Controles**:
    1.  **Archetype Group (Accordion - Desplegable)**: Agrupa nodos por su arquetipo (ADAPTER, VAULT, etc.).
        *   *Acción*: Colapsar/Expandir con animación `static` (CSS Transition ease-out).
    2.  **Node Card (Selectable - Acción)**: Representación de cada nodo.
        *   *Acción*: Al hacer clic, inyecta el nodo en el Workspace y abre su inspector.
        *   *Contraste Law*: Usa el `header_icon` y `border_color` definido en `ARCHETYPES`.
    3.  **Global Refresh (Ruleta - Acción)**: Botón circular en el header.
        *   *Acción*: Llama a `PublicAPI.getSystemContracts` para re-poblar la lista.
*   **Acciones de Sistema**: `fetch_nodes`, `filter_by_archetype`, `select_node`.

### B. Módulo: IDENTITY HUB (The Vault)
*   **Dharma**: Soberanía de credenciales y gestión de sesiones.
*   **Interacciones y Controles**:
    1.  **Provider Card (Identity Card - Fade)**: Lista de proveedores conocidos (Notion, Gemini, etc.).
    2.  **Add Account (Modal - Acción)**: Botón "+" para abrir formulario de credenciales.
    3.  **Account Toggle (Slider - Toggle)**: Switch para activar/desactivar la cuenta por defecto (`isDefault`).
        *   *Contraste Law*: Usa el icono `Lock` y color `#00d2ff` (VAULT).
    4.  **Health Check (Boton Pulso - Acción)**: Icono al lado de cada cuenta.
        *   *Acción*: Ejecuta `check_connection`. Si falla, el componente activa el movimiento `vibration`.
*   **Acciones de Sistema**: `save_credential`, `delete_credential`, `test_connection`, `set_default`.

### C. Módulo: WORKSPACE (Grafo + Inspector)
*   **Dharma**: Plano de ensamblaje y manipulación de contratos.
*   **Interacciones y Controles**:
    1.  **Inspector de Nodo (Slide-over - Desplegable)**: Panel que emerge al seleccionar un nodo.
        *   *Controles*: Inputs dinámicos (Text, Select, JSON Editor) generados por el `schema`.
    2.  **Smart Pipe Socket (Drag & Drop - Conexión)**: Puntos de anclaje en cada nodo.
        *   *Interacción*: Línea elástica que se convierte en "Túnel" al conectar satisfactoriamente.
    3.  **Magnifier Ojo de Buey (Lupa - Hover)**: Al pasar el cursor sobre un cable.
        *   *Interacción*: Burbuja flotante con fade-in (0.2s) mostrando el preview del JSON.
*   **Acciones de Sistema**: `create_connection`, `validate_types`, `preview_data`, `invoke_method`.

### D. Módulo: ARCHITECT CHAT & MANIFESTOR
*   **Dharma**: Generación asistida de lógica mediante lenguaje natural.
*   **Interacciones y Controles**:
    1.  **Command Input (Caja de Texto - Input Focus)**: Input con placeholder dinámico.
    2.  **JSON Visioner (Vertical Split - Colapsable)**: Panel lateral al chat que muestra el stream de código.
    3.  **Clear History (Trash Icon - Acción)**: Limpia el contexto del hilo actual.
    4.  **Sync Canvas (Flash - Acción Automática)**: Acción que ocurre cuando el LLM emite un `fragment` de flow.
        *   *Visual*: Pequeño destello (flash) sobre el canvas donde aparece el nuevo nodo.
*   **Acciones de Sistema**: `stream_thinking`, `parse_flow_json`, `scaffold_on_canvas`.

### E. Módulo: GOVERNANCE & TELEMETRY (Barra Inferior)
*   **Dharma**: Monitoreo de salud y estado global.
*   **Interacciones y Controles**:
    1.  **Status Indicator (Led - Pulse)**: Punto de color en la esquina izquierda.
    2.  **Telemetry Drawer (Drawer - Desplegable)**: Panel que sube desde el fondo al hacer clic.
        *   *Acción*: Lista de logs históricos con scroll infinito.
    3.  **Global Pause / INHIBIT (Boton Rojo - Acción Crítica)**:
        *   *Acción*: Aborta todos los jobs activos en el `JobQueue`.
        *   *Contraste Law*: Usa icono `XCircle`, color `#ff3366` y efecto `pulse`.
*   **Acciones de Sistema**: `stop_all_jobs`, `download_logs`, `monitor_health`.

---

## 8. ROADMAP DE EVOLUCIÓN (FASES)

### FASE 1: La Base del Grafo (Infrastructure & Visualization)
*   **FOCO**: Establecer la conexión física y semántica entre el usuario y el Core.
*   **Entregables**: Canvas de nodos, Smart Pipes, Architect Chat y Paneles de Gobernanza (Identity Hub).
*   **Valor**: Visibilidad total de la arquitectura y control manual/asistido de los adaptadores.

### FASE 2: El Sistema Híbrido (Efficiency & Scale)
*   **FOCO**: Superar la limitación visual del grafo para operaciones de alta densidad.
*   **Módulos "Hybrid Switch"**:
    1.  **Vista de Hoja de Cálculo (Functional Worksheet)**: Transformación del grafo en una tabla interactiva donde cada fila es un paso de la automatización. Ideal para mapeo masivo de campos.
    2.  **Vista de Prosa (Narrative View)**: Traducción del flujo a lenguaje natural estructurado (IFTTT/Shortcuts style). La forma más eficiente para editar condiciones rápida desde dispositivos móviles.
    3.  **Sincronización Bi-direccional**: Cualquier cambio en la Vista de Tabla se refleja instantáneamente en la posición y cables de la Vista de Grafo.

---

## 9. CONCLUSIÓN: EL "SKELETON CONSOLE"
El objetivo final es que esta documentación sirva de base para el desarrollo del **Skeleton Console**, elevando la experiencia de una simple consola de logs a un auténtico **Sistema Operativo de Nodos** intuitivo, seguro y potente, donde el usuario orquesta la realidad mediante lenguaje natural y cables inteligentes, bajo una supervisión constante de salud y contratos.






