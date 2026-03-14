# Arquitectura Técnica: Modularización Radiante

La implementación del `WorkflowDesigner` y el `AEEDashboard` seguirá la arquitectura de **Motores Macro-Agnósticos** de Indra. Cada módulo se comporta como un organismo autónomo que se conecta al sistema mediante el **Protocol Router** y el **Engine Registry**.

---

## 1. Estructura de Archivos (Modularización Estricta)

Para mantener la consistencia con `DocumentDesigner` y `BridgeDesigner`, los nuevos motores se organizarán así:

### 1.1 `WorkflowDesigner`
Ubicación: `system_core/client/src/components/macro_engines/WorkflowDesigner/`

*   `init.js`: Registro del motor en el `EngineRegistry`. Define los protocolos que el diseñador puede "leer" para construir la UI.
*   `context/WorkflowContext.jsx`: Store persistente (vía Zustand o Context API) que mantiene el AST del workflow activo.
*   `hooks/useWorkflowPipeline.js`: Lógica pura de orquestación. Gestiona la inyección de `step_id` en el contexto global y la validación de dependencias entre estaciones.
*   `stations/`: Componentes que representan los "Pasos" del flujo.
    *   `StationWrapper.jsx`: Marco visual axiomático con handles de drag & drop.
    *   `ProtocolConnector.jsx`: UI para mapear entradas del UQO usando el `SlotSelector`.
*   `layout/`:
    *   `EngineCanvas.jsx`: El lienzo vertical de estaciones.
    *   `TriggerPanel.jsx`: Selector de ignición (Schema Submit, Timer, etc).
*   `WorkflowDesigner.jsx`: Punto de entrada del componente React.

### 1.2 `AEEDashboard` (The Runner)
Ubicación: `system_core/client/src/components/macro_engines/AEEDashboard/`

*   `init.js`: Registro de la Macro-Engine.
*   `projectors/`: El corazón del AEE. Componentes "ciegos" que proyectan átomos.
    *   `FormProjector.jsx`: Consume un `DATA_SCHEMA` y rinde el formulario reactivo.
    *   `DataProjector.jsx`: Consume un `BRIDGE` y rinde widgets de visualización.
    *   `LiveDocProjector.jsx`: Consume un `DOCUMENT` y rinde el AST interactivo.
*   `runtime/`:
    *   `ExecutionManager.js`: Gestiona el ciclo de vida de la sesión (Captura → Validación → Disparo de Workflow).
*   `layout/`:
    *   `CockpitStage.jsx`: El área principal de operación (Mosaico o Enfoque).
    *   `CommandHUD.jsx`: La barra inferior de acciones axiomáticas.

---

## 2. Integración al Ecosistema (Conectividad)

### 2.1 El Protocolo como Interfaz
Ambos módulos se integran mediante la emisión de **UQOs**. El `AEEDashboard` no sabe cómo guardar en Notion; sabe enviar un UQO con `protocol: 'WORKFLOW_EXECUTE'`. El `WorkflowDesigner` no sabe enviar mails; sabe diseñar un UQO con `protocol: 'MESSAGE_SEND'`.

### 2.2 Registro de Capacidades (Discovery)
Al arrancar, el `WorkflowDesigner` invoca:
```javascript
const manifesto = await ProtocolRouter.execute({ protocol: 'SYSTEM_MANIFEST' });
// Resultado: Lista de proveedores, sus protocolos y sus schemas de configuración.
```
Esto asegura que la UI del diseñador sea **Autogenerada** y siempre esté sincronizada con los proveedores del backend.

---

## 3. CSS Axiomático y Diseño Premium

Ninguno de estos módulos usará estilos "ad-hoc" o clases utilitarias locales. Se basarán en el sistema de tokens existente:

*   **Fundaciones:** Uso estricto de `design_tokens.css` (variables de color, espaciado y transición).
*   **Layout:** Uso de `layout.css` para estructuras de 3 columnas y sistemas de rejilla (Grid/Flex).
*   **Aesthetics:** 
    *   **Glassmorphism:** Los paneles del AEE usarán `background: var(--color-glass)` con `backdrop-filter: blur(10px)` para ese look premium.
    *   **Micro-interacciones:** Las estaciones del Workflow tendrán estados de `:hover` con `border: 1px solid var(--color-accent-glow)` y transiciones suaves de `0.2s`.
    *   **Tipografía:** Uso exclusivo de fuentes mono para datos técnicos y variables (`var(--font-mono)`).

---

## 4. Flujo de Implementación

1.  **Skeleton:** Crear las carpetas e `init.js` para registrar las entradas en el `VaultRibbon`.
2.  **Context & Hooks:** Definir la lógica de manipulación de los átomos de tipo `WORKFLOW` y `DASHBOARD`.
3.  **Core Components:** Desarrollar los `Projectors` y `Stations`.
4.  **Wiring:** Conectar con el `ProtocolRouter` para asegurar la comunicación real con el Core.
