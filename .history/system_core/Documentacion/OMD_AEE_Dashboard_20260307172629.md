# OMD — AEE / Dashboard Engine (El Cockpit Operativo)

> **Estado:** Plan Maestro de Operatividad (Fase de Diseño Axiomático)
> **Objetivo:** Proyectar la inteligencia de los Átomos en una interfaz de ejecución para el usuario final, eliminando la exposición técnica de los motores de diseño.

---

## 1. PRINCIPIOS Y AXIOMAS DE DISEÑO

### A1 — Axioma de la Fachada Impoluta (The Clean Wall)
El usuario del AEE **NUNCA** ve un nodo, una línea de código o una estructura de datos cruda. El AEE es una "Cápsula de Ejecución" donde la complejidad técnica está enterrada bajo una capa de UX pura.

### A2 — Axioma de Determinismo de Proyección
Si un Átomo existe en el sistema, el AEE debe ser capaz de proyectarlo automáticamente según su clase:
*   Si es `DATA_SCHEMA` → Proyecta un **FORMULARIO**.
*   Si es `BRIDGE` → Proyecta un **PANEL DE RESULTADOS**.
*   Si es `DOCUMENT` → Proyecta un **VISOR DE PROYECTO**.

### A3 — Axioma del Cockpit Centralizado (Agregación)
Un Dashboard en Indra no es un archivo único; es una **Composición de Vistas**. Un comercial puede tener en una sola pantalla un formulario (Schema) y un gráfico de sus ventas del mes (Bridge Agregado).

---

## 2. REQUERIMIENTOS FUNCIONALES (RFs)

*   **RF-1 (Projector Runner):** Instanciar un átomo y hacerlo reactivo (`useAEESession`).
*   **RF-2 (Estado de Sesión Volátil):** Mantener los datos capturados en memoria local antes del commit al core.
*   **RF-3 (Composición Multimodal):** Permitir diseños de pantalla partida (Split View) para ver Entrada y Salida simultáneamente.
*   **RF-4 (Interactividad en el Ast):** Capturar clics en bloques del Document Designer para disparar Workflows.

---

## 3. ARQUITECTURA DE LA INTERFAZ (UI - THE RUNNER)

El AEE no tiene paneles de diseño; tiene **Áreas de Operación**.

### 3.1 El Main Viewport (Cuerpo Central)
*   **Layout Adaptativo:** Se configura según el "Plan de Vuelo" del dashboard seleccionado.
*   **Modo Formulario:** Centra el `FormRunner.jsx` con tipografía legible y controles de entrada premium.
*   **Modo Dashboard (The Cockpit):** Una rejilla de widgets (Gráficos, KPIs, Listas de Notion filtradas) orquestada por Bridges.

### 3.2 La HUD de Control (Bottom Bar)
*   **Ubicación:** Barra inferior flotante, con estética de cristal oscuro.
*   **Botones de Acción Primaria:** `[ GUARDAR ]`, `[ GENERAR PDF ]`, `[ CERRAR VENTA ]`.
*   **Signifier de Persistencia:** Indicador visual de "Syncing..." que muestra cuando el Bridge está interactuando con Notion en segundo plano.

### 3.3 El Sideloader (Panel de Referencia - Opcional)
*   **Ubicación:** Columna derecha colapsable (300px).
*   **Uso:** Mostrar información complementaria del cliente o historial de cotizaciones previas mientras se llena el formulario actual.

---

## 4. LÓGICA DE BOTONES Y ACCIONES

1.  **Botón "INITIATE WORKFLOW":** Ejecuta el disparador que conecta el Formulario con el resto del sistema.
2.  **Botón "LIVE PREVIEW":** Renderiza en tiempo real una miniatura del documento final a medida que el usuario llena los campos del esquema.
3.  **Botón "VERSION SWITCHER":** Permite al usuario cambiar entre variantes de la cotización dentro de la misma sesión de AEE.

---

## 5. RESTRICCIONES ABSOLUTAS (Vetoes)

*   ❌ **PROHIBIDO** el acceso a herramientas de edición (mover campos, cambiar fórmulas) desde el AEE. Es un modo Read/Execute puro.
*   ❌ **PROHIBIDO** el refresco de página para ver cambios. La reactividad debe ser absoluta vía `Zustand` y `AST_UPDATE`.
*   ❌ **PROHIBIDO** el bypass de validaciones del Schema. Si el Schema dice que un campo es obligatorio, el AEE bloquea el botón "Ejecutar" de forma axiomática.
