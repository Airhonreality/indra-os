# 🛰️ INDRA OS: Technical Blueprint (Estrategia Maestra V1.0)

> **Versión:** 1.5 (Elevación HCI V5.3 - Capacidad Auto-Discovery)
> **Estatus:** Engineering Spec
> **Paradigma:** Transducción de 8 Capas

---

## 1. System Architecture (The Stack)
INDRA OS es un **Orquestador de Datos Soberanos**.

- **Frontend (Satellite):** React/Vite + Zustand. Renderizador Kinestésico y Motor de Cálculo Volátil (0ms). Puede haber **N Satélites** orbitando un mismo Core.
- **Backend (Orbital Core):** Google Apps Script. Única Fuente de Verdad y Persistencia. Arquitectura **Headless por Diseño**.

### 1.1 Matriz de Responsabilidad Estanca

| Responsabilidad | Satélite (Frontend) | Orbital Core (Backend) |
|-----------------|---------------------|------------------------|
| **Cálculo de Visualización** | ✅ **SÍ** (0ms) | ❌ NO |
| **Validación de Negocio** | ❌ NO | ✅ **SÍ** (Source of Truth) |
| **Persistencia (Drive)** | ❌ NO | ✅ **SÍ** |
| **Gobernanza de Tipos** | ❌ NO (Solo consume) | ✅ **SÍ** (Define el Átomo) |

**Regla de Sincronía Crítica:** Cualquier discrepancia entre el `port_schema` local del nodo (en el `.flow`) y la definición maestra en el `.sys` resulta en una **Invalidación de Ejecución Automática**. El Core impedirá la operación hasta la resolución del conflicto.

### 1.1 El Motor Espacial (Estándar Milimétrico Thorne - ADR-004)
A diferencia de las apps web tradicionales, INDRA opera nativamente en **milímetros (mm)**.
- **Soberanía del Formato:** Coordenadas (`x, y`) y dimensiones (`w, h`) se almacenan en `mm`.
- **Proyección Thorne:** El Satélite convierte `mm` a `px` en tiempo de ejecución (96 DPI base), permitiendo precisión de grado industrial y CAD.

### 1.2 El Motor de Renderizado (Arquitectura Borehole - ADR-008)
Para manejar miles de entidades sin degradar el rendimiento:
- **Capa de Stage (Canvas):** Renderizado masivo de geometría y texto estático.
- **Capa de Interacción (Borehole):** "Perforación" dinámica de React sobre la entidad activa para permitir inputs complejos.

### 1.3 Ecosistema de Federación (Satélites Externos)
INDRA no es una isla; es un Cosmos extensible.
- **Satélites Federados:** Interfaces externas (Mobile, Scripts, CLI) que pueden orbitar el Core siempre que respeten los contratos de Nivel 2.
- **Interoperabilidad:** El lenguaje de la federación es la **Materia JSON**.

---

## 2. Estructuras de Datos Universales (El Contrato Átomo-Eidos)

### 2.1 UniversalItem (El Átomo)
Representación canónica de cualquier dato. El Front **NO** cuestiona el tipo, solo lo renderiza según la etiqueta `t`.

```typescript
interface UniversalItem {
  u_id: string;
  data: Record<string, {
    v: ConfigValue;                               // Valor crudo (Tipado Estricto)
    t: 'text'|'num'|'date'|'bool'|'select'|'img'; // Etiqueta de Renderizado
    l?: string;                                  // Label
    o?: 'ellipsis' | 'expand' | 'wrap';           // [V5.1] Overflow Strategy
    lineage?: string[];                          // [V5.4] UUID Lineage para Atom Zoom
  }>;
}

/**
 * [V5.1] Smart Frame & Geometría de Repetición
 */
}

/**
 * [V5.3] Core Manifest (Handshake de Capacidades)
 */
interface CoreManifest {
  [adapterName: string]: {
    methods: string[]; // Lista de acciones invocables via callCore
    hoverDoc?: string; // Documentación técnica para el Aether Ribbon
  };
}
```

---

## 3. Jerarquía de Persistencia (Los 7 Artefactos de la Estrategia Maestra)

| Extensión | Nivel | Propósito Técnico |
|-----------|-------|-------------------|
| `*.workspace.json` | 0 | Contexto global y tokens de sesión. |
| `*.session.json` | 0 | Estado volátil (Cámara, Zoom). LocalStorage. |
| `*.sys.json` | 1 | Catálogo de métodos y BIOS del sistema. |
| `*.layout.json` | 2 | Definición de Slots y Geometría (Eidos). |
| `*.flow.json` | 2 | Grafo de Nodos (Nervio). |
| `*.logic.json` | 3 | Librería de predicados puros (Cerebro). |
| `*.recipe.json` | 3 | Plantillas de materia estructurada (ADN/BOM). |
| `*.cache.json` | - | Hidratación rápida de identidades. |

---

## 3. Ontología del Grafo (Simetría Total V3.1)

### 3.1 Primitivos de Configuración (Recursiva + Tokens)
```typescript
// GAS Constraint: Max Depth 3. PROHIBIDOS Objetos Literales fuera de esquema.
type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };
```

### 3.2 Nodo de Adaptador (Impacto en Realidad)
```typescript
interface AdapterNode {
  id: string;
  kind: 'ADAPTER';
  
  // Unificado: "sys.adapter.notion.query_database"
  target: CanonicalPath; 

  // 1. LA FIRMA (Inmutable en sesión)
  port_schema: {
    inputs: Record<string, PortDefinition>;  
    outputs: Record<string, PortDefinition>; 
  };

  // 2. EL CABLEADO (Wiring State)
  connections: Record<string, ConnectionPointer | ConnectionPointer[]>; 

  // 3. CONFIGURACIÓN
  config: Record<string, ConfigValue>; 
}
```

#### 3.2.1 Nodo de Adaptador Inteligente (Smart Terminal)
Evolución del adaptador genérico hacia un terminal de control contextual.

```typescript
interface SmartTerminalNode extends AdapterNode {
  // Configuración de UI Especializada
  customRenderer: string; // Ej: 'GmailTerminal', 'DriveTerminal'
  
  // Lógica de Resolución Híbrida Robustecida
  hybridData: Record<string, {
    nativeValue: ConfigValue;    // Lo que el usuario escribe/selecciona
    wiredValue: ConfigValue;     // Lo que viene por Flux
    activeSource: 'NATIVE' | 'FLUX';
    bypass: boolean;             // [V1.6] Ignorar cable y forzar nativo
  }>;

  // Inteligencia de Contexto
  shadowSchema?: Record<string, PortDefinition>; // [V1.6] Propagación de esquema
}
```

#### Ejemplo: Gmail Terminal Spec
- **Puertos:** `in_to`, `in_subject`, `in_body`, `in_attachments`, `out_sent_id`.
- **UI Terminal:**
  - `RecipientManager`: Resolutor de contactos (Contacts API).
  - `SmartComposer`: Editor con soporte para `{{data_binding}}`.
  - `WiredShadow`: Feedback visual que atenúa inputs nativos si hay cable conectado.

#### Ejemplo: Drive Terminal Spec
- **Puertos:** `in_path`, `in_file`, `out_file_id`, `out_url`.
- **UI Terminal:**
  - `PathExplorer`: Buscador nativo de carpetas (Drive Picker API).
  - `FileStatus`: Indicador de existencia física del archivo.
  - `WatchMode`: Pulso cinético si detecta cambios externos reales.

### 3.3 Nodo de Lógica (Compuerta Pura)
```typescript
interface LogicGateNode {
  id: string;
  kind: 'GATE';
  
  logic_ref: CanonicalPath; 

  // 1. LA FIRMA
  port_schema: {
    inputs: Record<string, PortDefinition>;  
    outputs: Record<string, PortDefinition>; 
  };

  // 2. EL CABLEADO
  connections: Record<string, ConnectionPointer | ConnectionPointer[]>; 

  // 3. CONFIGURACIÓN
  config: Record<string, ConfigValue>;
}
```

### 3.4 Auxiliares de Conexión
**Protocolo de Verificación de Existencia:** El Satélite tiene prohibido abrir un archivo `.flow` que contenga `target` o `logic_ref` que no existan en el Registro del sistema (`.sys`). Se requiere una verificación de integridad referencial previa a la carga del Canvas.

```typescript
type CanonicalPath = string; // Format: "domain.module.entity"

interface ConnectionPointer {
  source_node_id: string;
  source_port_id: string;
}

type CanonicalType = 'text' | 'num' | 'date' | 'bool' | 'universal';

interface PortDefinition {
  type_constraint: CanonicalType;
  is_optional?: boolean;          // UX: Evita error rojo si no hay cable.
  default_value?: ConfigValue;    // CORE: Evita 'undefined' en ejecución.
  allow_multiple?: boolean;       // Cardinalidad: Permite array de cables.
  label?: string;                 // UI: Título corto para el puerto.
  description?: string;           // UI: Texto para el Hover Documentativo.
}
```

---

## 4. Protocolo de Sincronía (El Enchufado)
Para evitar la deriva estética, el renderizado sigue la **Ley del Slot**:

1.  El Satélite carga el `*.layout.json`.
2.  Identifica un componente visual (ej. `StatCard`) con un `SlotID`.
3.  El Satélite busca en el `UniversalPackage` el dato vinculado a ese `SlotID`.
4.  **Validación Pasiva:** Si el `StatCard` requiere `t: 'num'` y el dato es `t: 'text'`, el componente entra en estado de **ERROR VISUAL**.
    *   *El Front no intenta arreglarlo; el error es evidencia de una mala configuración en el `.flow`.*

---

### 3.5 Action Ledger (Registro de Operaciones en Realidad)
Para garantizar la transaccionalidad, toda acción que altere la realidad externa (Write/Delete) debe registrarse:
1.  **Pre-flight:** El nodo solicita confirmación (Visual LED Amarillo).
2.  **Commit:** La acción se envía al Core.
3.  **Ack:** El Core responde con el resultado y el ledger se actualiza con el `action_id`.

### 3.6 Heartbeat Monitor (Fisiología de Conexión)
Mecanismo de validación en segundo plano cada 60s. Permite que el nodo emita un "Pulso Cinético" de salud sin interrumpir el flujo del usuario.

---

## 5. Transmission Protocol (Neutrón V5.5 - Invarianza Total)

### 5.1 The Atomic Payload Wrapper
Para evitar colisiones de tipos y garantizar que el Orquestador del Core pueda realizar el destructuring de argumentos posicionales, todas las peticiones `callCore` se encapsulan en un sobre atómico:

```json
{
  "executor": "string",
  "method": "string",
  "payload": {
    "arg1": "value",
    "arg2": "value"
  },
  "context": {
    "folderId": "string",
    "sessionToken": "string",
    "retryCount": number
  }
}
```

### 5.2 Atomic Auditing (Aether V2.0)
La transparencia técnica es un derecho del operador. El Satélite permite la inspección profunda de cada transacción:
1. **Pestaña Neutrón:** Muestra el objeto de transmisión completo (JSON).
2. **Crash Interceptor:** Si el Core emite un `success: false`, Neutrón intercepta el error y lo inyecta en la pestaña **ERRORS** con metadatos completos.
3. **Resilience Logs:** Trazabilidad de los reintentos automáticos disparados por fallo de red.

---

*INDRA OS - Technical Blueprint Finalizado V1.6*
