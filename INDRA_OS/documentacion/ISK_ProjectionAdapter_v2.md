# 📘 ISK_ProjectionAdapter - Documentación Técnica

## Identificación
- **Archivo**: `INDRACore_Codex_v1/3_Adapters/ISK_ProjectionAdapter.gs`
- **Versión**: 2.0.0 (Snapshot Management)
- **Dharma**: Gestor de Realidad y Proyección Multidimensional
- **Archetype**: `SYSTEM_INFRA`
- **Semantic Intent**: `SENSOR`

---

## 🎯 Propósito

Adaptador especializado para la persistencia y gestión de estados espaciales del **ISK Designer**. Actúa como el receptor final del canal **ASP (Asynchronous Persistence)** del protocolo USSP.

### Separación de Responsabilidades

| Componente | Responsabilidad |
|------------|----------------|
| `ProjectionKernel.gs` | Proyecta **capacidades** del Core (qué puede hacer) |
| `ISK_ProjectionAdapter.gs` | Proyecta **realidad espacial** (dónde están las cosas) |

---

## 📋 Métodos Públicos

### 1. `getProjectedScene(input)`

**Propósito**: Genera el grafo de escena espacial para un contexto.

**Input**:
```javascript
{
  context_id: "folder_id_in_drive",
  dimension_mode: "2D" | "3D",  // Opcional, default: "2D"
  accountId: "user_session_id"
}
```

**Output**:
```javascript
{
  dimension: "2D",
  nodes: [
    {
      id: "file_id",
      label: "Nombre del archivo",
      canonicalCategory: "project" | "asset",
      canonicalType: "application/vnd.google-apps.folder",
      position: { x: 100, y: 200, z: 0 },
      isPersisted: true,
      anchors: {
        input_x: 100,
        output_x: 320,
        y_base: 240
      },
      visual_modeling: {
        dimension: "2D",
        semantic_gravity: 0.5,
        influence_radius: 100,
        render_priority: "high"
      }
    }
  ],
  edges: [],
  physics: { /* Leyes de Spatial_Physics.gs */ },
  timestamp: "2026-01-30T11:40:00Z",
  spatialStateLoaded: true
}
```

**Flujo Interno**:
1. Escanea artefactos del contexto vía `CognitiveSensingAdapter`
2. Recupera `system_layout.json` (si existe)
3. Fusiona posiciones guardadas con layout automático
4. Inyecta leyes físicas de `Spatial_Physics.gs`

---

### 2. `commitSpatialChanges(input)` ⭐ **USSP Protocol**

**Propósito**: Merge atómico de propiedades espaciales (canal ASP).

**Input**:
```javascript
{
  context_id: "folder_id",
  changes: [
    {
      target_id: "node_id",
      property: "u_pos",
      value: [150, 300]
    },
    {
      target_id: "node_id",
      property: "u_radius",
      value: 50
    },
    {
      target_id: "node_id",
      property: "u_visibility",
      value: 1.0
    }
  ]
}
```

**Output**:
```javascript
{
  status: "success",
  summary: "3 properties synchronized"
}
```

**Características**:
- ✅ **Atomic Merge**: No sobrescribe el archivo completo, solo actualiza propiedades
- ✅ **Concurrency Safe**: Usa `LockService.getScriptLock()`
- ✅ **Semantic Mapping**: Traduce `u_pos` → `{x, y}`, `u_radius` → `radius`

**Mapeo de Propiedades USSP**:
```javascript
u_pos → { x: value[0], y: value[1] }
u_radius → { radius: value }
u_visibility → { visibility: value }
u_* → { *: value }  // Genérico para otras propiedades
```

---

### 3. `reconcileSpatialState(input)` [LEGACY]

**Propósito**: Persiste movimientos de nodos (pre-USSP).

**Input**:
```javascript
{
  context_id: "folder_id",
  move_events: [
    { id: "node_id", x: 100, y: 200 }
  ]
}
```

**Output**:
```javascript
{
  success: true,
  applied_at: "2026-01-30T11:40:00Z"
}
```

**Nota**: Este método está en proceso de deprecación. Usar `commitSpatialChanges` para nuevas implementaciones.

---

### 4. `createSnapshot(input)` 🆕

**Propósito**: Crea un snapshot (copia oculta) del estado espacial actual.

**Input**:
```javascript
{
  context_id: "folder_id",
  snapshot_label: "before_major_refactor"  // Opcional
}
```

**Output**:
```javascript
{
  snapshot_id: "2026-01-30T16-40-00-000Z",
  snapshot_name: ".snapshot_2026-01-30T16-40-00-000Z_before_major_refactor.json",
  created_at: "2026-01-30T11:40:00Z"
}
```

**Características**:
- Crea archivos ocultos (prefijo `.snapshot_`)
- Incluye timestamp para ordenamiento cronológico
- Permite experimentación sin miedo a perder el estado

---

### 5. `restoreSnapshot(input)` 🆕

**Propósito**: Restaura un snapshot previo sobrescribiendo el layout actual.

**Input**:
```javascript
{
  context_id: "folder_id",
  snapshot_id: "2026-01-30T16-40-00-000Z"
}
```

**Output**:
```javascript
{
  status: "success",
  restored_from: "2026-01-30T16-40-00-000Z",
  restored_at: "2026-01-30T11:45:00Z"
}
```

**Características**:
- ✅ **Atomic Restore**: Usa `LockService` para evitar conflictos
- ✅ **Validation**: Verifica que el snapshot exista antes de restaurar

---

### 6. `listSnapshots(input)` 🆕

**Propósito**: Lista todos los snapshots disponibles para un contexto.

**Input**:
```javascript
{
  context_id: "folder_id"
}
```

**Output**:
```javascript
{
  snapshots: [
    {
      id: "file_id",
      name: ".snapshot_2026-01-30T16-40-00-000Z_manual.json",
      created_at: "2026-01-30T11:40:00Z",
      size_bytes: 2048
    }
  ],
  total: 1
}
```

---

## 🔒 Seguridad y Concurrencia

### Lock Management
Todos los métodos de escritura (`commitSpatialChanges`, `restoreSnapshot`) usan:
```javascript
const lock = LockService.getScriptLock();
try {
  if (!lock.tryLock(10000)) throw new Error("LOCK_TIMEOUT");
  // ... operación crítica
} finally {
  lock.releaseLock();
}
```

### Error Handling
Todos los errores se envuelven con `errorHandler.createError()`:
```javascript
throw errorHandler.createError("ADAPTER_ERROR", "Failed to...");
```

---

## 📁 Estructura de Persistencia

### Archivo Principal: `system_layout.json`
```json
{
  "nodes": {
    "node_id_1": {
      "x": 100,
      "y": 200,
      "radius": 50,
      "visibility": 1.0
    },
    "node_id_2": {
      "x": 300,
      "y": 150,
      "radius": 30
    }
  }
}
```

### Snapshots: `.snapshot_TIMESTAMP_LABEL.json`
```
.snapshot_2026-01-30T16-40-00-000Z_manual.json
.snapshot_2026-01-30T17-15-00-000Z_auto.json
```

---

## 🔗 Integración con USSP

### Flujo Completo (Front → Core)

```
┌─────────────────────────────────────────┐
│  ISK Designer (Front)                   │
│  ┌──────────────────────────────────┐   │
│  │  Usuario mueve círculo           │   │
│  │  → SpatialBridge valida          │   │
│  │  → USSP_PersistenceBuffer        │   │
│  │     (agrupa 10 cambios)          │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                ↓ POST /api/indra/commitSpatialChanges
┌─────────────────────────────────────────┐
│  INDRACore (Backend)                  │
│  ┌──────────────────────────────────┐   │
│  │  ISK_ProjectionAdapter.gs        │   │
│  │  → commitSpatialChanges()        │   │
│  │  → Merge atómico                 │   │
│  │  → Guarda en Drive               │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🧪 Casos de Uso

### Caso 1: Carga Inicial del Diseñador
```javascript
// Front-End
const scene = await fetch('/api/indra/getProjectedScene', {
  method: 'POST',
  body: JSON.stringify({ context_id: 'project_folder_id' })
});
```

### Caso 2: Guardar Cambios (USSP)
```javascript
// Front-End (USSP_PersistenceBuffer)
await fetch('/api/indra/commitSpatialChanges', {
  method: 'POST',
  body: JSON.stringify({
    context_id: 'project_folder_id',
    changes: [
      { target_id: 'node_1', property: 'u_pos', value: [150, 300] }
    ]
  })
});
```

### Caso 3: Snapshot antes de Experimentar
```javascript
// Front-End
const snapshot = await fetch('/api/indra/createSnapshot', {
  method: 'POST',
  body: JSON.stringify({
    context_id: 'project_folder_id',
    snapshot_label: 'before_experiment'
  })
});

// ... usuario experimenta ...

// Restaurar si no funciona
await fetch('/api/indra/restoreSnapshot', {
  method: 'POST',
  body: JSON.stringify({
    context_id: 'project_folder_id',
    snapshot_id: snapshot.snapshot_id
  })
});
```

---

## 📊 Schemas (MCP Discovery)

Todos los métodos están expuestos vía `ProjectionKernel.getProjection()` con sus schemas completos, permitiendo que el Front-End descubra automáticamente las capacidades del adaptador.

---

## 🔄 Changelog

### v2.0.0 (2026-01-30)
- ✅ Añadido `createSnapshot()`
- ✅ Añadido `restoreSnapshot()`
- ✅ Añadido `listSnapshots()`
- ✅ Schemas actualizados para MCP discovery

### v1.0.0 (Inicial)
- ✅ `getProjectedScene()`
- ✅ `commitSpatialChanges()` (USSP Protocol)
- ✅ `reconcileSpatialState()` (Legacy)

---

## 🎓 Notas de Arquitectura

### ¿Por qué NO fusionar con ProjectionKernel?

1. **Separación de Responsabilidades**:
   - `ProjectionKernel` = Espejo (refleja capacidades)
   - `ISK_ProjectionAdapter` = Persistor (guarda realidad)

2. **Especialización**:
   - INDRA UI General usa `ProjectionKernel`
   - ISK Designer usa `ISK_ProjectionAdapter`

3. **Protocolo USSP**:
   - El adaptador implementa el merge atómico específico del ISK
   - `ProjectionKernel` no tiene conocimiento de propiedades espaciales

---

## 📚 Referencias

- [Spatial_Physics.gs](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/INDRACore_Codex_v1/0_Laws/Spatial_Physics.gs) - Leyes físicas del ISK
- [ProjectionKernel.gs](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/INDRACore_Codex_v1/2_Services/ProjectionKernel.gs) - Proyector de capacidades
- [USSP Protocol](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/INDRA_FRONT_V2/IndraSpatialKernel/04%20PROTOCOLO%20DE%20MENSAJERÍA%20ESPACIAL%20(ISK-PM)) - Especificación del protocolo





