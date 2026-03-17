# ADR_002 — UI MANIFEST: Arquitectura y Árbol de Artefactos del Frontend

> **Versión:** 2.0
> **Estado:** VIGENTE — Actualizado 2026-03-11 para reflejar la arquitectura real desplegada
> **Principio rector:** Modularidad absoluta. Cero monolitos. Agnosticismo total.

---

## 1. PRINCIPIOS ARQUITECTÓNICOS DEL FRONTEND

### P1 — Agnosticismo de Motor
Ningún motor (SchemaDesigner, LogicBridge, DocumentDesigner, AEE) conoce la implementación interna de otro. Solo se comunican a través de contratos de props y callbacks.

### P2 — Micro-Engines Desacoplados (MCA)
Las utilidades de UI (selectores de artefactos, paneles de propiedades, mapeadores) son componentes autónomos y reutilizables. Son invocados por cualquier motor que los necesite. No pertenecen a ningún motor específico.

### P3 — Cero Lógica de Negocio en el Frontend
El frontend es una capa de proyección y captura. Toda computación, transformación y resolución de datos vive en el Backend (Logic Bridge → `logic_engine.gs`).

### P4 — Patrón "Hollow Component" (Soberanía Industrial)
Los componentes visuales de INDRA son cáscaras agnósticas. No gestionan estados de carga ni lógicas de persistencia. Reciben un átomo, invocan al `DataProjector` y reaccionan ciegamente al **Campo de Resonancia** (ver [ADR-005](./ADR_005_UI_RESONANCE.md)).

### P5 — Soberanía del CSS e Invarianza de Diseño
Queda prohibido el uso de estilos inline para estados lógicos. La interactividad y el estado visual (resonancia, highlight, focus) se gestionan exclusivamente mediante atributos de datos (`data-*`) y reglas globales de CSS. Se debe cumplir estrictamente con el esquema [ui_contracts.json](../ui_contracts.json).

---

## 2. ÁRBOL DE ARTEFACTOS

```
system_core/client/src/
│
├── state/
│   └── app_state.js                    # Estado global (Zustand). Fuente única de verdad.
│
├── services/
│   ├── directive_executor.js           # Capa de transporte. Único punto de salida al Backend.
│   ├── EngineRegistry.js              # Registro dinámico: atom.class → componente React.
│   ├── EngineBoot.js                  # Importa todos los init.js para inicializar el registro.
│   ├── DataProjector.js               # Transforma Átomos crudos en proyecciones UI.
│   └── CapabilityBridge.js            # Inyecta capacidades del core a los motores.
│
├── context/
│   ├── ProtocolContext.jsx            # Conectividad y bootstrapping.
│   ├── WorkspaceContext.jsx           # Estado del workspace activo y sus pins.
│   └── ShellContext.jsx               # Shell global: activeArtifact, lang.
│
├── components/
│   │
│   ├── ── SHELL (Nivel 0 y 1) ────────────────────────────────────────────────
│   │
│   ├── shell/
│   │   ├── CoreConnectionView.jsx     # Nivel 0: Acceso al Núcleo (HUD)
│   │   ├── NexusView.jsx              # Nivel 1: Centro de Navegación y Servicios
│   │   ├── NexusView.css
│   │   └── ServiceManager/            # Panel de admin de Keys (sub-artefactos propios)
│   │
│   ├── ── DASHBOARD (Nivel 2) ─────────────────────────────────────────────────
│   │
│   ├── dashboard/
│   │   ├── WorkspaceDashboard.jsx     # Orquestador del Nivel 2.
│   │   │                              # Layout: [MacroHeader | ActionRail | ArtifactGrid]
│   │   ├── ActionRail.jsx             # Banda de creación de artefactos.
│   │   ├── ArtifactGrid.jsx           # Grid de tarjetas organizadas por class.
│   │   ├── ArtifactCard.jsx           # Tarjeta de un átomo pinneado.
│   │   └── ArtifactCard.css
│   │
│   ├── ── MACRO ENGINES (Nivel 3) ─────────────────────────────────────────────
│   │
│   ├── macro_engines/
│   │   │
│   │   ├── ── 1. SCHEMA DESIGNER ─────────────────────────────────────────────
│   │   ├── SchemaDesigner/
│   │   │   ├── index.jsx              # Orquestador. Gestiona historial y estado de edición.
│   │   │   ├── LayersPanel.jsx        # Panel de navegación jerárquica de campos.
│   │   │   ├── BlueprintCanvas.jsx    # Previsualización viva del schema.
│   │   │   └── DNAInspector.jsx       # Inspector de propiedades del campo seleccionado.
│   │   │
│   │   ├── ── 2. BRIDGE DESIGNER ─────────────────────────────────────────────
│   │   ├── BridgeDesigner/
│   │   │   ├── index.jsx              # Orquestador. Gestiona pipeline de operadores.
│   │   │   ├── OperatorCard.jsx       # Tarjeta genérica de operador (MATH, TEXT, RESOLVER, EXPRESSION)
│   │   │   ├── OperatorTypes/         # Configuraciones específicas por tipo:
│   │   │   │   ├── ExtractorConfig.jsx
│   │   │   │   ├── MathConfig.jsx
│   │   │   │   ├── TextConfig.jsx
│   │   │   │   └── ExpressionConfig.jsx
│   │   │   ├── PortManager.jsx        # SourcePanel + TargetPanel
│   │   │   ├── SandboxPanel.jsx       # Panel de prueba en vivo
│   │   │   ├── FieldMapper.jsx        # Mapeador de variables → campos del silo destino
│   │   │   ├── MicroSlot.jsx          # Slot visual de variable
│   │   │   ├── useBridgeHydration.js  # Hook de hidratación de fuentes y destinos
│   │   │   └── init.js               # Registro: registry.register('BRIDGE', BridgeDesigner)
│   │   │
│   │   ├── ── 3. DOCUMENT DESIGNER ───────────────────────────────────────────
│   │   ├── DocumentDesigner/
│   │   │   ├── index.jsx              # Orquestador. Editor de plantillas.
│   │   │   └── [sub-artefactos]      # BlockRenderer, DesignPanel, etc.
│   │   │
│   │   ├── ── 4. WORKFLOW DESIGNER ───────────────────────────────────────────
│   │   ├── WorkflowDesigner/
│   │   │   ├── index.jsx              # Orquestador. Layout: [Header | 3 cols]
│   │   │   ├── StationCard.jsx        # Tarjeta de una estación del workflow
│   │   │   ├── WorkflowInspector.jsx  # Inspector de propiedades de la estación activa
│   │   │   ├── WorkflowSandbox.jsx    # Panel de prueba del workflow completo
│   │   │   ├── WorkflowTrigger.jsx    # Configuración del trigger de inicio
│   │   │   ├── context/              # Contexto local del motor (estado del pipeline)
│   │   │   ├── useWorkflowExecution.js
│   │   │   └── init.js               # Registro: registry.register('WORKFLOW', WorkflowDesigner)
│   │   │
│   │   └── ── 5. AEE FORM RUNNER ─────────────────────────────────────────────
│   │       └── AEEFormRunner/
│   │           ├── AEE_Dashboard.jsx  # Orquestador: runner de Schema + Bridge
│   │           ├── FormRunner.jsx     # Proyecta un DATA_SCHEMA como formulario
│   │           ├── ResultPanel.jsx    # Muestra resultado del LOGIC_EXECUTE
│   │           ├── useAEESession.js   # Hook: ciclo de vida de sesión de ejecución
│   │           └── init.js           # Registro: registry.register('AEE_RUNNER', AEEDashboard)
│   │
│   └── ── UTILITIES / MICRO-ENGINES ───────────────────────────────────────────
│
│       ├── utilities/
│       │   ├── ArtifactSelector.jsx   # Selector universal de átomos del workspace
│       │   ├── SlotSelector.jsx       # Dropdown de variables disponibles en un contexto
│       │   ├── IndraIcons.jsx         # Librería de iconos canónicos (27+ íconos)
│       │   ├── IndraMacroHeader.jsx   # Cabecera canónica para Macro-Engines y Dashboard
│       │   ├── IndraMicroHeader.jsx   # Cabecera canónica para Micro-Engines y Paneles
│       │   ├── IndraActionTrigger.jsx # Gatillo universal de acción (con hold para destructivas)
│       │   ├── GraphicDesignUtils/    # Controles de diseño visual desacoplados
│       │   │   ├── ColorPicker.jsx
│       │   │   ├── SpacingControl.jsx
│       │   │   ├── TypographyControl.jsx
│       │   │   └── BorderControl.jsx
│       │   └── primitives/            # ── ÁTOMOS DE UI (Piezas de Lego) ──────────────
│       │       ├── index.js           # Barrel de exportación canónico
│       │       ├── Spinner.jsx        # Indicador de carga universal
│       │       ├── EmptyState.jsx     # Pantalla de estado vacío universal
│       │       ├── Badge.jsx          # Etiqueta de estado/tipo (variantes: default, outline, dot)
│       │       ├── EditableLabel.jsx  # Texto inline editable con un clic
│       │       ├── DragHandle.jsx     # Handle de arrastre canonizado
│       │       └── ToastNotification.jsx # Sistema de notificaciones flotantes (+ ToastProvider, useToast)
│       │
│       └── App.jsx                   # Orquestador raíz. ToastProvider envuelve todo.
```

---

## 3. MÓDULOS DE SUPERFICIE (Lo que ve el usuario)

### 3.1 Core Connection
**Artefacto:** `shell/CoreConnectionView.jsx`

Permite al usuario vincular uno o múltiples Cores (instancias de Google Apps Script deployadas). Gestiona:
- URL del Core (endpoint del Web App GAS)
- Contraseña / token de acceso
- Soporte Multi-Core: el usuario puede conectar múltiples instancias nombradas (Ej: "Producción", "Staging", "Cliente Acme")
- Indicador de estado de conexión en tiempo real

**Contrato:** Al conectar, el sistema popula el `app_state.js` con el `activeWorkspaceId` y el manifiesto de capacidades del Core.

---

### 3.2 Nexus (Navigation Control Center)
**Artefacto:** `shell/NexusView.jsx`
**Nivel de Hidratación:** 1 (Core conectado, sin Workspace activo)

El **Nexus** es el pasillo técnico donde el usuario decide su contexto de trabajo. Utiliza un **layout asimétrico de dos columnas** para separar el estado sistémico de la navegación operativa.

#### Estructura del Nexus:
- **Columna A (Status Lateral - 240px)**: 
    - Monitoreo de **Core Health**.
    - Estado de **Service Providers** (Notion, Drive, etc.).
    - Acceso táctico al `ServiceManager.jsx` para rotar keys o añadir cuentas.
- **Columna B (Navegación Central - Main Canvas)**:
    - Grid de **Workspace Cards** (Slots inteligentes).
    - Cada tarjeta muestra: Label, ID técnico, nº de entidades ancladas y timestamp de acceso.
    - Acción: `INITIATE_WORKSPACE_LINK` (avanza a Nivel 2).

#### Principios Visuales:
- **Asimetría HUD**: La información sistémica fluye por la izquierda; la operativa por la derecha.
- **Líneas de Dirección**: Elementos `.hud-line` que conectan el estado de los servicios con los workspaces que dependen de ellos.
- **Zero-Latency**: Las tarjetas de workspace cargan mediante `SYSTEM_WORKSPACES_LIST` antes de que el usuario haga scroll.

---

### 3.3 Workspace Dashboard (Operational View)
**Vista principal de trabajo (Nivel 2).** Proyecta los **pines del workspace activo** como tarjetas organizadas por `class`.

#### Grupos de tarjetas operativas:

| Grupo | Class | Acción Primaria | Origen |
|-------|-------|-----------------|--------|
| **A — Schemas** | `DATA_SCHEMA` | Abrir `SchemaDesigner` | Motor |
| **B — Logic Bridges** | `BRIDGE` | Abrir `BridgeDesigner` | Motor |
| **C — Documentos** | `DOCUMENT` | Abrir `DocumentDesigner` | Motor |
| **D — Infraestructura** | `FOLDER`, `ACCOUNT` | Exploración / Identidad | Sistema |

#### Axiomas del Dashboard:
1. **Agnosticismo de Cards**: La tarjeta no sabe qué es el átomo. Se hidrata automáticamente consultando sus `protocols[]` y mapeándolos a `IndraActionTrigger`.
2. **Hood Dinámico (ActionRail)**: La barra inferior de creación solo se muestra si el manifiesto de motores expone clases con `canCreate: true`. Si no hay motores instalados, el Hood se desvanece.
3. **Protección de Infraestructura**: Los átomos marcados como `isInfrastructure` inhiben protocolos destructivos (`ATOM_DELETE`) para evitar la eliminación accidental de hubs críticos (Silos de Drive, Cuentas de Notion).
4. **Diagramación HUD**: Basado en `grid-auto` con estética Stark-Punk (glassmorphism nítido, bordes de 1px, cero desenfoques innecesarios).

---

### 3.3 Apps — AEE (Agnostic Execution Engine)
**Artefacto:** `macro_engines/AEE_Dashboard.jsx`

Corre un formulario (`DATA_SCHEMA`) en tiempo real, captura los valores ingresados por el usuario, los envía al Logic Bridge asignado (`LOGIC_EXECUTE`), y proyecta el resultado.

**No contiene lógica de negocio.** Es un proyector reactivo de contratos.

Modos:
- **Form Mode:** Proyecta el schema como formulario interactivo (`FormRunner.jsx`)
- **Dashboard Mode:** Proyecta el resultado del Bridge en widgets configurables (`ResultPanel.jsx`)

---

### 3.5 Service Manager
**Artefacto:** `shell/ServiceManager.jsx`

Centro de control de integraciones externas. Permite al usuario gestionar la conexión del Core con servicios de terceros.

**Responsabilidades:**
- **Listado de Providers:** Muestra los servicios soportados (Notion, Google Drive, Calendar, etc.) consultando el manifiesto del Core.
- **Gestión de Cuentas:** Permite añadir nuevas cuentas por provider (ej: conectar una segunda cuenta de Notion).
- **Almacenamiento de Keys:** Interfaz para introducir API Keys o Tokens. Los datos se envían al Core para su almacenamiento seguro.
- **Estado de Salud:** Indica si la conexión con el servicio externo está activa o requiere re-autenticación.

**Contrato:** Utiliza los protocolos `SYSTEM_SERVICES_READ` y `SYSTEM_SERVICES_UPDATE` para sincronizar las credenciales con el almacén seguro del Backend.

---

## 4. MICRO-ENGINES — UTILIDADES UNIVERSALES

Estas utilidades son **componentes de propósito general** sin dependencia de ningún motor específico. Son los bloques de construcción compartidos.

### 4.1 ArtifactSelector
**Archivo:** `utilities/ArtifactSelector.jsx`
**Responsabilidad:** Permite al usuario explorar y seleccionar cualquier átomo del workspace (silos de Notion, schemas del sistema, documentos, etc.).
**Invocado por:**
- `BridgeDesigner` → para agregar un silo de Notion como source o target
- `LogicCanvas` → para vincular un silo al nodo Extractor (RESOLVER)
- `SchemaDesigner` → para asociar un campo `RELATION_SELECT` a una base de datos externa

**Contrato de Props:**
```jsx
<ArtifactSelector
  title="Seleccionar Silo"
  filter={{ protocols: ['ATOM_READ', 'TABULAR_STREAM'] }}
  onSelect={(atom) => { /* atom: Átomo Universal */ }}
  onCancel={() => {}}
/>
```

---

### 4.2 PropertyInspector
**Archivo:** `utilities/PropertyInspector.jsx`
**Responsabilidad:** Panel universal de edición de propiedades clave-valor. Renderiza campos según su tipo (texto, toggle, select, custom).
**Invocado por:**
- `SchemaDesigner` → inspector de propiedades del campo seleccionado
- `DocumentDesigner` → inspector de propiedades del bloque activo en el canvas

---

### 4.3 FieldMapper
**Archivo:** `utilities/FieldMapper.jsx`
**Responsabilidad:** UI para mapear las propiedades de un schema a los campos de un silo destino (Notion DB, Google Sheet, etc.).
**Invocado por:**
- `BridgeDesigner` → `TargetPanel` para configurar el mapeo de salida
- Futuros: `WorkflowDesigner` para mapeo de slots entre pasos

---

### 4.4 SlotSelector
**Archivo:** `utilities/SlotSelector.jsx`
**Responsabilidad:** Dropdown enriquecido que lista las variables disponibles en un contexto de ejecución (campos de source, outputs de operadores).
**Invocado por:**
- `LogicCanvas` → `OperatorNode`: seleccionar Entrada A y Entrada B de cada nodo

---

### 4.5 GraphicDesignUtils
**Carpeta:** `utilities/GraphicDesignUtils/`
**Responsabilidad:** Controles de diseño visual desacoplados, sin opinión sobre el motor que los consume.

| Artefacto | Responsabilidad |
|-----------|-----------------|
| `ColorPicker.jsx` | Selector HSL de color con presets del sistema |
| `SpacingControl.jsx` | Control de padding, margin y gap con sliders y valores px/rem |
| `TypographyControl.jsx` | Selector de fuente, tamaño, peso, alineación |
| `BorderControl.jsx` | Control de estilo, grosor y radio de bordes |

**Invocado por:**
- `DocumentDesigner` → `DesignPanel` para editar las propiedades visuales de cada bloque

---

### 4.6 Primitivas (utilities/primitives/) — El Modelo Lego

> **Axioma:** La UI de Indra es una construcción de piezas de Lego. Ninguna pieza conoce el tablero donde será puesta.

Estas primitivas son los **átomos indivisibles del sistema de diseño**. No hacen nada por sí solas, pero todo lo demás se construye combinándolas. No tienen imports de lógica de negocio ni de estado global.

| Primitiva | Props canónicas | Comportamiento |
|-----------|-----------------|----------------|
| `Spinner` | `size`, `color`, `label` | Anillo giratorio animado. Aparece en cualquier estado async. |
| `IndraActionTrigger` | `icon`, `label`, `requiresHold`, `holdTime` | Gatillo universal de acción. Si `requiresHold=true` (ej. DELETE), requiere 1.5s de pulsación con feedback de progreso visual. |
| `EditableLabel` | `value`, `onCommit`, `placeholder` | Texto estático con doble-click para editar. Al perder foco o presionar Enter, dispara `onCommit`. |
| `Badge` | `label`, `color`, `icon`, `size` | Etiqueta visual de estado o tipo (ej: "BLOCKING", "OK", "ERROR"). |
| `EmptyState` | `icon`, `title`, `description`, `action` | Pantalla de estado vacío con ícono grande, mensaje y botón CTA opcional. |
| `ConfirmModal` | `title`, `message`, `onConfirm`, `onCancel`, `danger=false` | Modal bloqueante de confirmación. `danger=true` pinta el botón de confirmación en rojo. |
| `ToastNotification` | `message`, `type` ('success'\|'error'\|'info'), `duration=3000` | Notificación flotante que se auto-destruye. |
| `ProgressBar` | `value` (0-100), `mode` ('linear'\|'radial'), `color` | Indicador de progreso. Modo radial usado por `HoldToDeleteButton`. |
| `ToggleSwitch` | `value`, `onChange`, `label`, `disabled` | Interruptor binario con animación de deslizamiento. |
| `TabBar` | `tabs: [{id, label, icon}]`, `activeTab`, `onChange` | Barra de pestañas genérica sin opinión de contenido. |
| `DragHandle` | `onMouseDown` | Área de agarre visual para drag-and-drop. Solo muestra el cursor y dispara el evento. |

**Contrato de composición ejemplo (HoldToDeleteButton):**
```jsx
// ✅ Correcto: usado por BridgeDesigner/PortManager.jsx
<HoldToDeleteButton
  label="Eliminar Source"
  onConfirm={() => updateBridgeNodes(bridge.id, { sources: ... })}
/>

// ❌ Incorrecto: la primitiva NUNCA llama directamente a directiveExecutor
```

---

## 5. REGLAS DE INVOCACIÓN ENTRE MÓDULOS

| Invocador | Utilidad Invocada | Trigger |
|-----------|-------------------|---------|
| `BridgeDesigner` | `ArtifactSelector` | Usuario pulsa "+ Vincular" en SourcePanel o TargetPanel |
| `LogicCanvas` (nodo RESOLVER) | `ArtifactSelector` | Usuario pulsa "Vincular Silo..." en el nodo Extractor |
| `SchemaDesigner` | `ArtifactSelector` | Campo tipo `RELATION_SELECT`: usuario pulsa "Vincular Silo" |
| `SchemaDesigner` | `PropertyInspector` | Usuario selecciona un campo en la lista |
| `DocumentDesigner` | `PropertyInspector` | Usuario selecciona un bloque en el canvas |
| `DocumentDesigner` | `GraphicDesignUtils/*` | Panel de diseño del bloque activo |
| `BridgeDesigner/TargetPanel` | `FieldMapper` | Usuario configura el mapeo de salida de un target |
| `LogicCanvas/OperatorNode` | `SlotSelector` | Usuario configura las entradas de un nodo |
| `PortManager`, tarjetas del Dashboard, cabecera HUD | `IndraActionTrigger` | Cualquier acción protocolar (Delete, Sync, Back, Save) |
| Cualquier componente async | `Spinner` | Estado de carga de datos o guardado |
| Cualquier panel vacío | `EmptyState` | Cuando la lista de items está vacía |
| Cualquier acción irreversible sin hold | `ConfirmModal` | Confirmación de acciones destructivas de alto riesgo |

---

## 6. CONVENCIONES DE ARCHIVO

- **Orquestadores principales:** `NombreDelMotor.jsx` — estado global del motor, layout principal. Máx. 300 líneas.
- **Sub-artefactos de un motor:** en carpeta `NombreDelMotor/` — cada archivo tiene una sola responsabilidad.
- **Hooks de estado local:** `use[Nombre].js` dentro de la carpeta del motor. No acceden al `app_state` directamente salvo los orquestadores.
- **Utilidades universales:** en `utilities/` — sin import de ningún motor específico. Sin lógica de negocio.
- **Primitivas:** en `utilities/primitives/` — sin import de ningún componente fuera de `primitives/` ni de `IndraIcons.jsx`.
- **Iconos:** únicamente desde `utilities/IndraIcons.jsx`. Ningún componente importa SVGs directamente.
- **Estilos:** Vanilla CSS con variables globales en `global_system.css`. Sin Tailwind. Sin estilos inline excepto valores dinámicos computados en JS (ej: posición drag de un nodo).

---

---

## 8. TAXONOMÍA DE MÓDULOS Y CABECERAS CANÓNICAS

Para garantizar la coherencia visual, simetría y orden en toda la suite, se establece un **Contrato de Proyección Estandarizado**. La UI no se "dibuja" ad-hoc; se proyecta según el tipo de contenedor.

### 8.1 IndraMacroHeader (Nivel 2 y 3)
Utilizada por **Macro-Engines** (Engines) y el **Workspace Dashboard**.
- **Identidad Proyectada**: Icono de Clase + Label del Átomo + Clase + ID Técnico.
- **Acciones Globales**: `BACK/EXIT`, `SYNC_STATUS`, `UNDO/REDO`.
- **Dharma**: Es el punto de anclaje de la soberanía del motor. Si el átomo permite `ATOM_UPDATE`, el label es un `EditableLabel`.
- **Estética**: Glassmorphism de ancho completo (100vw), borde inferior 1px, tipografía `var(--font-mono)`.

### 8.2 IndraMicroHeader (Paneles y Secciones)
Utilizada por **Micro-Engines** funcionales y paneles laterales (Layers, Inspector, Palette).
- **Identidad Proyectada**: Icono descriptivo + Nombre de la Herramienta.
- **Acción Ejecutiva**: Botón canonizado "Execute" que proyecta el label inyectado por el payload (ej: "Crear Schema", "Testear Puente").
- **Dharma**: Proporciona contexto de uso inmediato y Signifiers claros.
- **Estética**: Caja "White-Bone Glass" (blanco hueso semi-mate), optimizada para Flexbox pequeña/mediana. Bordes suaves, header angosto.

### 8.3 El "Botón Ejecutivo" (Canonical Action)
Cada sub-panel puede declarar una acción principal en su metadata. El header micro la proyectará automáticamente:
- `label`: Nombre de la acción (Humano).
- `intent`: Código de la acción (Maquinístico).
- `onExecute`: Callback vinculado.

---

## 9. JERARQUÍA DE DEPENDENCIAS (REVISADA)

```
App.jsx
  └─ CoreConnectionView (Nivel 0)
  └─ WorkspaceSelector (Nivel 1)
  └─ Macro Engines / Dashboard (Nivel 2)
       └─ Sub-artefactos del Motor
            └─ Micro-Engines / Utilities
                 └─ Primitivas
```

**Las dependencias solo pueden fluir hacia ABAJO en esta jerarquía.**
Un componente de nivel N puede importar de nivel N+1, N+2, etc. **Nunca de nivel N-1.**

> Un `Spinner` no puede importar un `BridgeDesigner`.  
> Un `ArtifactSelector` no puede importar un `LogicCanvas`.  
> Un `PortManager` no puede importar un `AEE_Dashboard`.

---

---

## 7. SERVICIOS DE INDUSTRIALIZACIÓN

### 7.1 EngineRegistry
**Archivo:** `services/EngineRegistry.js`

Registro global que mapea `atom.class → componente React`. Es la pieza central de industrialización del sistema.

- `registry.register(atomClass, Component)` — registra un motor
- `registry.get(atomClass)` — devuelve el componente registrado para esa clase

Cuando `App.jsx` detecta un `activeArtifact`, llama a `registry.get(atom.class)` para obtener el componente motor. Si no hay motor registrado, muestra el fallback de `UNKNOWN_ENGINE`.

### 7.2 Patrón `init.js` — Auto-registro de Motores

Cada motor que debe ser invocado por el `EngineRegistry` exporta un `init.js`:

```js
// Estructura canónica de init.js
import { registry } from '../../../services/EngineRegistry';
import { BridgeDesigner } from './index';

// Opcional: manifiesto de capacidades
export const BRIDGE_MANIFEST = {
    id: 'BRIDGE_DESIGNER',
    name: 'LOGIC_BRIDGE',
    icon: 'BRIDGE',
    color: 'var(--color-cold)',
    description: 'Pipeline de transformación lógica de datos.',
};

// Registro en el EngineRegistry
registry.register('BRIDGE', BridgeDesigner);
```

`EngineBoot.js` importa todos los `init.js` en un único punto para activar el auto-registro al arrancar la app.

### 7.3 DataProjector
**Archivo:** `services/DataProjector.js`

Transforma átomos crudos del backend en proyecciones UI normalizadas. Define:
- `CLASS_THEMES` — color, ícono y label por clase de átomo
- `projectArtifact(atom)` — proyección para tarjetas del Dashboard
- `projectWorkspace(ws)` — proyección para tarjetas del Nexus

---

*Este documento es el mapa arquitectónico de referencia. Toda nueva funcionalidad debe ubicarse en el árbol correspondiente antes de ser implementada.*

---

## 8. ESPECIFICACIÓN CANÓNICA — LOGIC BRIDGE (BridgeDesigner)

> **Decisión de diseño:** El Logic Bridge usa un modelo de **Pipeline Lineal de Tarjetas** (no un canvas de nodos flotantes). El orden de ejecución es el orden visual, de arriba a abajo. Cada operador puede leer cualquier variable producida por los operadores anteriores.

### 8.1 Layout General — Tres Columnas

```
┌─ FUENTES (300px) ─┐  ┌─ PIPELINE (flex: 1) ──────────────────────┐  ┌─ DESTINOS (300px) ─┐
│                   │  │                                            │  │                    │
│  Silos de         │  │  Barra de herramientas:                    │  │  Silos de         │
│  ENTRADA          │  │  [+ Extractor] [+ MATH] [+ Texto]          │  │  SALIDA           │
│                   │  │                                            │  │                    │
│  Tarjeta de       │  │  ┌─ Tarjeta Operador 1 ─────────────────┐ │  │  Tarjeta de       │
│  cada fuente      │  │  │  ⠿  Extractor                   [×]  │ │  │  cada destino     │
│  conectada.       │  │  │     Puntero: [COTIZADOR] ITEM         │ │  │  conectado.       │
│                   │  │  │     Silo inferido: Catálogo ✓         │ │  │                   │
│  Muestra sus      │  │  │     Alias: [info_producto_________]   │ │  │  Mapeo de         │
│  campos           │  │  └───────────────────────────────────────┘ │  │  variables a      │
│  disponibles      │  │                 ↓                          │  │  campos del       │
│                   │  │  ┌─ Tarjeta Operador 2 ─────────────────┐ │  │  silo destino     │
│                   │  │  │  ⠿  MATH — Multiplicar          [×]  │ │  │                   │
│                   │  │  │     A: [INFO_PRODUCTO] Precio         │ │  │                   │
│                   │  │  │     B: [COTIZADOR] Cantidad           │ │  │                   │
│                   │  │  │     Alias: [subtotal_______________]  │ │  │                   │
│                   │  │  └───────────────────────────────────────┘ │  │                   │
│                   │  │                 ↓                          │  │                   │
│                   │  │  ┌─ Sandbox de Prueba ──────────────────┐ │  │                   │
│ [+ Vincular]      │  │  │  [Ejecutar prueba ▶]  Datos: {...}   │ │  │  [+ Vincular]     │
│                   │  │  │  Resultado: { subtotal: 4500 }        │ │  │                   │
└───────────────────┘  │  └───────────────────────────────────────┘ │  └────────────────────┘
                       └────────────────────────────────────────────┘
```

### 8.2 El Contexto Acumulado (Cómo fluyen los datos)

Cada operador hereda todo lo producido por los anteriores. El motor construye un objeto `context` que crece con cada paso:

```javascript
// Después de cargar las fuentes:
context = {
  source: {
    cotizador: {
      CLIENTE: "Empresa Acme",
      ITEM: "notion-id-abc123",    // ← puntero/ID
      CANTIDAD: 3
    }
  }
}

// Después del Extractor (op_1):
context = {
  ...anterior,
  op: {
    info_producto: {
      Nombre: "Silla Ergonómica",
      Precio: 1500000,
      Peso: 8.5
    }
  }
}

// Después del MATH Multiplicar (op_2):
context = {
  ...anterior,
  op: {
    ...anterior.op,
    subtotal: 4500000
  }
}
```

El operador N puede leer cualquier variable de `source.*` o de los `op.*` de operadores anteriores. **Nunca de operadores posteriores.** El orden es la única restricción.

### 8.3 Tipos de Operador (Tarjetas)

#### Tipo EXTRACTOR (Resolver Node)

Extrae propiedades de un átomo externo usando un ID como puntero de entrada.

| Campo | Descripción |
|-------|-------------|
| **Puntero de entrada** | `SlotSelector` — cualquier variable del contexto que contenga un ID (texto, relation, etc.) |
| **Modo A — Inferido** | Si el puntero viene de un campo `RELATION_SELECT`, el silo se detecta automáticamente del `relation_context` del schema. Se muestra: "Silo inferido: [Nombre del Catálogo] ✓" |
| **Modo B — Manual** | Si el puntero es un texto libre o no tiene relación conocida, el usuario vincula un silo explícitamente con `ArtifactSelector`. Para: padrón, tasas de cambio, inventario global, comisiones de RH |
| **Pines de salida** | Se cargan dinámicamente con `TABULAR_STREAM` al silo vinculado. Aparecen como variables `[ALIAS] campo` en los operadores siguientes |
| **Alias** | Nombre del nodo. Define el prefijo de sus variables de salida en el contexto |

**Casos de uso del Modo B (Silo Aislado — Primera clase, no fallback):**
1. **Validación de identidad**: DNI/RFC textual → buscar en padrón de contribuyentes
2. **Variables sistémicas**: Tasa de cambio del día, IVA vigente, comisión mensual
3. **Enriquecimiento de perfil**: Email del asesor → buscar en tabla de RH para obtener porcentaje de comisión
4. **Inventario global**: Cantidad solicitada → validar contra stock disponible en bodega sistémica

#### Tipo MATH (Operador Aritmético)

Operaciones entre dos variables del contexto.

| Campo | Descripción |
|-------|-------------|
| **Entrada A** | `SlotSelector` — cualquier variable numérica del contexto |
| **Entrada B** | `SlotSelector` — cualquier variable numérica del contexto |
| **Operación** | `ADD` (+), `SUBTRACT` (−), `MULTIPLY` (×), `DIVIDE` (÷) |
| **Alias** | El resultado se expone con este nombre en el contexto |
| **Vectorización** | Si las entradas son Arrays (de un Repeater), la operación es par-a-par automáticamente |

#### Tipo TEXTO (Transformador Textual)

Transformaciones sobre strings del contexto.

| Campo | Descripción |
|-------|-------------|
| **Entrada A** | `SlotSelector` — cualquier variable de texto del contexto |
| **Operación** | `CONCAT`, `UPPERCASE`, `LOWERCASE`, `TRIM`, `TEMPLATE` |
| **TEMPLATE** | Expresión con placeholders: `"Cotización para {{COTIZADOR.CLIENTE}}"` |
| **Alias** | El resultado textual se expone con este nombre |

#### Tipo EXPRESIÓN (IndraParser — Modo Avanzado)

Para lógica compleja que no encaja en MATH o TEXTO simple. Usa el evaluador isomórfico `IndraParser` que funciona igual en frontend y backend.

| Campo | Descripción |
|-------|-------------|
| **Expresión** | Campo de texto libre. Ej: `subtotal * (1 + tasa_iva)` |
| **Contexto disponible** | Todas las variables del contexto acumulado son accesibles por nombre |
| **Alias** | El resultado se expone con este nombre |

### 8.4 El Sandbox de Prueba

Vive **al final de la columna de operadores**, después de todas las tarjetas. Es el último bloque visible, siempre.

```
┌─ Sandbox de Prueba ─────────────────────────────────────────────┐
│  [▶ Ejecutar]                                                    │
│                                                                  │
│  Datos de entrada (JSON):                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ {                                                         │   │
│  │   "cotizador": {                                          │   │
│  │     "CLIENTE": "Empresa Test",                            │   │
│  │     "ITEM": "notion-id-abc",                              │   │
│  │     "CANTIDAD": 3                                         │   │
│  │   }                                                       │   │
│  │ }                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Resultado:                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ { "subtotal": 4500000, "total": 5355000 }                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Los campos de entrada se autocompletan con los nombres de las fuentes del pipeline
- El resultado muestra todos los valores del contexto final (`op.*`)
- Si hay un error, muestra el operador donde falló y el mensaje exacto
- No persiste nada — es un entorno de prueba pura

### 8.5 Regras del Modelo Lineal (Axiomas del Pipeline)

**A1 — Orden es Ejecución**
El orden visual de las tarjetas ES el orden de ejecución. El operador N siempre se ejecuta después del N-1. No hay excepciones.

**A2 — Contexto Acumulativo de Solo Lectura**
Cada operador puede LEER cualquier variable producida por los anteriores. Nunca puede MODIFICAR ni SOBREESCRIBIR una variable ya producida. El contexto solo crece.

**A3 — Sin Coordenadas en el Payload**
Los operadores no tienen `position: { x, y }`. Son un array ordenado. El payload del bridge es limpio:
```json
{ "operators": [{ "id": "op_1", "type": "RESOLVER", "alias": "...", "config": {...} }, ...] }
```

**A4 — Reordenamiento por DragHandle**
El orden se cambia arrastrando por el `DragHandle` de la tarjeta. La misma implementación que usa `FieldList` en el SchemaDesigner. Un solo componente de drag-to-reorder compartido.

**A5 — Variables de Salida con Alias Obligatorio**
Todo operador DEBE tener un alias antes de poder ser referenciado por un operador posterior. Si el alias está vacío, los operadores siguientes no lo verán en su `SlotSelector`.

**A6 — Sin Dependencias Explícitas Entre Nodos**
No hay flechas, no hay conectores, no hay declaración de dependencias. El acceso al contexto es el mecanismo de dependencia. Si el operador B lee la variable producida por A, entonces B depende implícitamente de A. El orden lineal garantiza que A siempre va antes que B.

### 8.6 Estructura de los Sub-artefactos (Revisada)

```
BridgeDesigner/
├── OperatorCard.jsx       # Tarjeta única reutilizable para cualquier tipo de operador
│                          # Detecta el tipo y renderiza su UI específica internamente
│                          # Incluye: DragHandle, tipo, configuración, alias, botón eliminar
│
├── OperatorTypes/         # Configuraciones específicas por tipo (invocados por OperatorCard)
│   ├── ExtractorConfig.jsx   # UI del Extractor: SlotSelector + ArtifactSelector condicional
│   ├── MathConfig.jsx        # UI del MATH: A + Operación + B
│   ├── TextConfig.jsx        # UI del Texto: A + Operación + template
│   └── ExpressionConfig.jsx  # UI de Expresión libre: textarea + variables disponibles
│
├── PortManager.jsx        # SourcePanel + TargetPanel (sin cambios estructurales)
├── SandboxPanel.jsx       # Panel de prueba (renombrado de SimulationPanel)
├── useBridgeHydration.js  # Hook de hidratación de fuentes, destinos y resolvers
└── Utilities.jsx          # EditableAlias, slugify, helpers
```

**El `LogicCanvas.jsx` original se reemplaza por `OperatorCard.jsx`.**
No hay lienzo. No hay coordenadas. No hay drag-to-position.
Solo una columna de tarjetas en `stack` con `DragHandle` para reordenar.
