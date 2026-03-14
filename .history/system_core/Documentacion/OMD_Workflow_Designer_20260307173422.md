# OMD — Workflow Designer (El Sistema Nervioso de Indra)

> **Estado:** Plan Maestro de Operatividad (Fase de Diseño Axiomático - Refinado v1.1)
> **Objetivo:** Orquestar la ejecución de Átomos y Proveedores mediante el **Protocolo Universal de Indra**, eliminando cualquier lógica de negocio o función hardcodeada.

---

## 1. PRINCIPIOS Y AXIOMAS DE DISEÑO (PROTOCOL-DRIVEN)

### A1 — Axioma de Pura Orquestación (UQO-Only)
El Workflow no "hace" cosas; el Workflow **emite UQOs** (Universal Query Objects). Cada paso es una instrucción empaquetada que se entrega al `ProtocolRouter`. Si un paso dice "Notificar", el Workflow solo sabe que debe enviar `protocol: 'MESSAGE_SEND'` al proveedor que el usuario eligió.

### A2 — Axioma de Descubrimiento de Capacidades
No existen "Nodos de Email" o "Nodos de Drive" internos. El Workflow Designer consulta el `SYSTEM_MANIFEST` de Indra para listar qué proveedores están registrados y qué protocolos soportan. 
*   **Agnosticidad:** Si mañana instalas un proveedor de WhatsApp que implementa `MESSAGE_SEND`, aparecerá automáticamente en el Workflow sin tocar una línea de código del diseñador.

### A3 — Inmutabilidad del Contexto de Pipeline
El `flowContext` es un objeto acumulativo inmutable. Cada estación añade su respuesta al contexto bajo su propio ID de estación (`step_1`, `step_2`). Esto permite que pasos futuros referencien datos pasados mediante el protocolo de interpolación `{{step_id.path.to.data}}`.

---

## 2. REQUERIMIENTOS FUNCIONALES (RFs)

*   **RF-1 (Selector de Capacidades):** La UI debe agrupar los pasos por **Protocolo** (ej: "Persistencia", "Comunicación", "Transformación"), no por marca comercial.
*   **RF-2 (Mapeador Universal de UQO):** Interfaz para mapear datos del contexto global a los parámetros requeridos por el protocolo del proveedor seleccionado.
*   **RF-3 (Control de Flujo Axiomático):** Soporte para nodos lógicos que operan sobre el estado del contexto (IF data exists, FOR EACH item in array).
*   **RF-4 (Tracing de Identidad):** Cada ejecución de workflow genera un log de trazabilidad donde se registra el UQO enviado y el Atomo devuelto por cada estación.

---

## 3. ARQUITECTURA DE LA INTERFAZ (UI & LAYOUT PROFUNDO)

### 3.1 Columna Izquierda: Trigger & Context (Micro-Agnostic)
*   **Sección TRIGGER:** Define el "Evento de Ignición".
    *   **SOURCE SELECTOR:** El usuario elige un Átomo (ej: un `DATA_SCHEMA`).
    *   **EVENT SELECTOR:** El usuario elige el protocolo que dispara el flujo (ej: `SCHEMA_SUBMIT`).
*   **CONTEXT EXPLORER:** Un árbol vivo que muestra la estructura de datos que el Trigger inyectará en el flujo (basado en el manifiesto del Schema seleccionado).

### 3.2 Columna Central: Estaciones de Protocolo (The Pipeline)
*   **Station Card (Bloque de Protocolo):**
    *   **Cabecera:** Icono del `PROVIDER` + Nombre del `PROTOCOL`.
    *   **Body:** Resumen visual del mapeo (ej: "Enviando `cliente.email` a `Recipient`").
    *   **Status Signifier:** Indicador de si el paso es Crítico (Falla el flujo) o Opcional (Continúa).
*   **Acción [+ ADICIONAR]:** Despliega un menú dinámico basado en las `capabilities` de los proveedores activos en el `provider_system.js`.

### 3.3 Columna Derecha: El Protocol Configurator (Expert View)
Aquí se configura el "Cuerpo" del UQO que se enviará:
*   **Provider Binding:** Selección de la instancia del proveedor (ej: "Cuenta de Gmail de Ventas").
*   **Parameter Mapping:** Una tabla donde la izquierda es el `Field` requerido por el protocolo (ej: `to`, `body`) y la derecha es un `SlotSelector` que apunta al Contexto Global.

---

## 4. DETALLE DE UI: EL "CABLEADOR" (SLOT SELECTOR)

Para evitar el hardcoding, el Workflow usa un **Visual Mapper**:
1.  Al hacer clic en un campo (ej: "Destinatario"), se abre una lista de variables disponibles del Trigger y de pasos anteriores.
2.  El sistema genera automáticamente la cadena de interpolación: `{{trigger.data.email}}`.
3.  Esto asegura que el Workflow sea puramente descriptivo.

## 6. ARQUITECTURA TÉCNICA Y MODULARIZACIÓN

El `WorkflowDesigner` se implementa como una Macro-Engine autónoma bajo el estándar de Indra. Su lógica está desacoplada del renderizado para permitir la portabilidad del motor de ejecución.

### 6.1 Estructura de Archivos
```text
/WorkflowDesigner
├── init.js                  # Registro en el EngineRegistry
├── index.jsx                # Punto de entrada / Main Layout
├── context/
│   └── WorkflowContext.jsx  # Store de Zustand para el AST del flujo
├── hooks/
│   ├── useWorkflowEditor.js # Mutadores del pipeline (add, remove, reorder)
│   └── useProtocolCatalog.js# Carga dinámica del SYSTEM_MANIFEST
├── stations/
│   ├── StationCard.jsx      # Componente visual axiomático de cada paso
│   ├── StationLogic.jsx     # Selector de condicionales y bucles
│   └── ProtocolMapper.jsx   # UI del SlotSelector para conexión de UQOs
└── layout/
    ├── SidebarTrigger.jsx   # Panel de configuración del disparador
    ├── PipelineCanvas.jsx   # El lienzo vertical de ejecución
    └── InspectorPanel.jsx   # Panel derecho de configuración experta
```

### 6.2 Integración con el Sistema (The Wiring)
*   **Discovery:** Al montarse, el motor invoca `ProtocolRouter.execute({ protocol: 'SYSTEM_MANIFEST' })`. El resultado puebla el catálogo de estaciones disponibles. Cada proveedor registrado en el core "enseña" sus protocolos al diseñador.
*   **Persistence:** El resultado de este diseñador es un Átomo de clase `WORKFLOW`. Su `payload` contiene el array ordenado de estaciones con sus respectivos mapeos de UQO internos.
*   **Agnosticidad de Datos:** Durante el diseño, el motor usa el `ContextExplorer` para inferir qué datos estarán disponibles en cada paso basándose en el output esperado de los protocolos de los pasos anteriores.

---

## 7. DISEÑO AXIOMÁTICO DE UI (DETALLE DE COMPONENTES)

### 7.1 El "SlotSelector" (The Cableator)
Es el componente más crítico. Aparece al hacer clic en cualquier parámetro de entrada de un protocolo.
*   **Lógica UI:** Despliega un menú flotante con efecto *Glassmorphism* (`background: var(--color-glass)`).
*   **Distribución:** Agrupa variables por origen: `{{trigger}}`, `{{step_0}}`, `{{step_1}}_...`.
*   **Acción:** Al seleccionar, inyecta la cadena de texto de interpolación. Esto asegura que el cableado sea **descriptivo**, no funcional.

### 7.2 Estación de Protocolo (Visual)
*   **Estética:** Una tarjeta con `border-radius: var(--radius-md)`, borde sutil `1px solid var(--color-border)`.
*   **Micro-animación:** Al pasar el ratón, el borde brilla con `var(--color-accent-glow)`.
*   **Botón "Expert Mode":** En la esquina superior derecha, abre un inspector lateral con el JSON crudo del UQO que se está construyendo para depuración avanzada.

---

## 4. LÓGICA DE BOTONES Y ACCIONES

1.  **Botón "DEBUG STEP" (En cada tarjeta):** Permite ejecutar solo ese paso con datos de prueba para verificar que el pipeline es sólido.
2.  **Botón "CABLEADO NEURAL" (Mapeador):** Un modal que abre el `SlotSelector` para conectar el output de una estación con el input de otra.
3.  **Botón "FORK ON ERROR":** Un toggle en la base de cada tarjeta que permite añadir una "estación de emergencia" si la principal falla.

---

## 5. RESTRICCIONES ABSOLUTAS (Vetoes)

*   ❌ **PROHIBIDO** escribir código JS o scripts dentro del Workflow. Todo debe ser configuración de átomos o llamadas a parámetros de adapters.
*   ❌ **PROHIBIDO** el disparo circular infinito. El `directive_executor` debe limitar la profundidad de ejecución a 10 niveles.
*   ❌ **PROHIBIDO** el almacenamiento persistente de datos intermedios dentro del Workflow. El estado es volátil y solo vive durante la ejecución.
