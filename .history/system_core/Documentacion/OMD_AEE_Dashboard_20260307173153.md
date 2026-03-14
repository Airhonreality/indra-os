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

---

## 5. RESTRICCIONES ABSOLUTAS

*   ❌ **PROHIBIDO** que el AEE conozca términos como "Factura", "Producto" o "Cliente". Todo es `ITEM`, `CLASS` o `ID`.
*   ❌ **PROHIBIDO** el bypass del Core. Todo evento debe pasar por el `protocol_router.js`.
*   ❌ **PROHIBIDO** estilos locales fuera de `design_tokens.css`. La consistencia visual es una ley del sistema operativo.
