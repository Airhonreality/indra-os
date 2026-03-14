# OMD — AEE / Dashboard Engine (El Cockpit Operativo)

> **Estado:** Plan Maestro de Operatividad (Fase de Diseño Axiomático - Refinado v1.1)
> **Objetivo:** Proyectar la inteligencia de los Átomos mediante el **Protocolo de Proyección Universal**, eliminando cualquier botón o acción hardcodeada en la UI.

---

## 1. PRINCIPIOS Y AXIOMAS DE DISEÑO (PROJECTION-ONLY)

### A1 — Axioma de la Fachada Impoluta (Blind UI)
El usuario del AEE nunca interactúa con "propiedades de código". Interactúa con **Proyectores**. Un proyector es un componente que sabe interpretar una `CLASS` de átomo. El AEE no decide cómo se ve un formulario; pregunta al `SCHEMA_RENDERER` cómo proyectar el Átomo `DATA_SCHEMA`.

### A2 — Axioma de Botones como Triggers de Workflow
No existe un botón "Generar PDF" o "Cobrar" quemado en el código.
*   Los botones de acción en el AEE son **Instancias de Activación de Workflow**.
*   Configuración: El diseñador vincula un botón a un `WORKFLOW_ID`.
*   Ejecución: Al pulsar, el AEE emite un `uqo.protocol = 'WORKFLOW_EXECUTE'`.

### A3 — Axioma de Agregación de Vistas (The Grid)
Un Dashboard es un lienzo agnóstico de **Slots de Visualización**. Cada slot se conecta a un `Logic Bridge` que devuelve un `TABULAR_STREAM` o un `KPI_VALUE`. El AEE es solo el motor de orquestación de estos sub-renderers.

---

## 2. REQUERIMIENTOS FUNCIONALES (RFs)

*   **RF-1 (Universal Projector Hub):** Capacidad de renderizar cualquier Átomo basándose solo en su `class` y `handle`.
*   **RF-2 (Contexto Compartido):** Si en un dashboard hay un Formulario y un Visor de Documento, el cambio en el formulario debe actualizar el visor mediante un `EventBus` local (Dharma de Indra).
*   **RF-3 (Firma de Transacción):** Cada acción crítica requiere que el AEE capture la identidad del usuario (`ACCOUNT_RESOLVE`) para adjuntarla al UQO de ejecución.
*   **RF-4 (Projector de AST Activo):** Capacidad de inyectar interactividad en el `DocumentDesigner`. El AST puede contener bloques tipo `TRIGGER` que el AEE convierte en botones vivos.

---

## 3. ARQUITECTURA DE LA INTERFAZ (DISEÑO DEL COCKPIT)

### 3.1 El Main Stage (Lienzo Operativo)
*   **Modo Enfoque (Single Atom):** Ideal para toma de datos. Maximiza el componente de captura (ej: formulario largo).
*   **Modo Mosaico (Multi-Silo):** Layout tipo rejilla (CSS Grid) donde cada celda es un `Widget` independiente:
    *   **Widget A:** Filtro de búsqueda (vía `ATOM_READ`).
    *   **Widget B:** Contador de ventas (vía `BRIDGE_EXECUTE`).
    *   **Widget C:** Lista de tareas (vía `TABULAR_STREAM`).

### 3.2 La HUD de Comando (Agnostic Action Bar)
*   **Botones Dinámicos:** La barra se puebla basándose en los `actions` definidos en el manifiesto del Dashboard.
*   **Signifier de Estado:** Uso de colores axiomáticos (`--color-accent` para progreso, `--color-success` para completado).
*   **Feedback de Protocolo:** Pequeño console log colapsable en la base para ver el "latido" del sistema (UQOs entrando y saliendo).

---

## 4. LÓGICA DE INTERACCIÓN: EL "BOTÓN COSMOS"

Para evitar el hardcoding, el AEE implementa el **Action-to-Workflow Binding**:
1.  **Diseño:** El arquitecto pone un botón en el Dashboard.
2.  **Cableado:** El arquitecto elige "Enviar a Producción".
3.  **Vínculo:** El sistema asocia internamente: `OnClick -> system:WORKFLOW_EXECUTE(id: "wf_prod_001")`.
4.  **Ejecución:** El AEE envía el estado actual de los proyectores como `payload` al inicio del workflow.

## 6. ARQUITECTURA TÉCNICA Y MODULARIZACIÓN (EL RUNTIME)

El `AEEDashboard` es el **Runtime de Indra**. A diferencia de los otros, este motor no guarda estados estructurales, sino que ejecuta instancias de átomos.

### 6.1 Estructura de Archivos
```text
/AEEDashboard
├── init.js                  # Registro en el EngineRegistry como 'AEE_RUNNER'
├── index.jsx                # Punto de entrada (Cockpit Router)
├── core/
│   ├── useAEESession.js     # Hook de gestión de la "Sesión Operativa" volátil
│   └── InteractionCore.js   # Bus de eventos para comunicación entre proyectores
├── projectors/
│   ├── FormProjector.jsx    # Intérprete de DATA_SCHEMA (UI de captura)
│   ├── DashboardProjector.jsx# Intérprete de DASHBOARD (Malla de widgets)
│   └── LiveDocProjector.jsx # Intérprete de DOCUMENT (AST interactivo)
└── widgets/
    ├── KpiWidget.jsx        # Widget de valor único (Metric)
    ├── ChartWidget.jsx      # Widget de visualización (Bridge Stream)
    └── TableWidget.jsx      # Widget de rejilla de datos (Notion/Drive)
```

### 6.2 Lógica de "Proyección Ciega"
El AEE utiliza un patrón de **Componente Dinámico por Clase**:
1.  Recibe un Átomo.
2.  Consulta su `class`.
3.  Invoca al Proyector correspondiente: `BLOCK_COMPONENTS[atom.class]`.
4.  El Proyector recibe el `payload` del átomo y rinde la UI funcional. No hay "if-else" por tipo de negocio, solo por tipo de estructura de datos.

### 6.3 La Sesión Operativa (Volatile Store)
Los datos capturados en un formulario del AEE no se envían directamente a Notion. Se mantienen en el `useAEESession`.
*   **Commit:** Solo cuando el usuario pulsa un botón vinculado a un `WORKFLOW_EXECUTE`, la sesión empaqueta los datos y los envía al Core. Esto garantiza transacciones atómicas y permite la "Prueba de Vuelo" del documento antes de persistirlo.

---

## 7. DISEÑO AXIOMÁTICO DE UI (THE COCKPIT LOOK)

### 7.1 La HUD de Comando (Bottom Bar)
*   **Aesthetics:** Barra flotante con `background: rgba(10, 15, 20, 0.8)`, `backdrop-filter: blur(15px)`, y `border-top: 1px solid var(--color-glow)`.
*   **Botón Cosmos:** El botón principal de ejecución tiene un gradiente animado de `var(--color-accent)` a `var(--color-accent-strong)`.
*   **Signifier de Conconectividad:** Un pequeño led en la esquina inferior que parpadea en `cyan` cuando hay un UQO en tránsito, reforzando la sensación de "Sistema Operativo".

### 7.2 El Mosaico Operativo (Grid System)
*   Usa un sistema de **Responsive Grid** basado en el ancho del viewport. 
*   Los widgets son "contenedores puros" con `padding: var(--space-4)` y tipografía `var(--font-sans)` para etiquetas, pero `var(--font-mono)` para los valores de los datos, manteniendo el ADN técnico de Indra.

---

## 8. RESTRICCIONES ABSOLUTAS

*   ❌ **PROHIBIDO** que el AEE conozca términos como "Factura", "Producto" o "Cliente". Todo es `ITEM`, `CLASS` o `ID`.
*   ❌ **PROHIBIDO** el bypass del Core. Todo evento debe pasar por el `protocol_router.js`.
*   ❌ **PROHIBIDO** estilos locales fuera de `design_tokens.css`. La consistencia visual es una ley del sistema operativo.
