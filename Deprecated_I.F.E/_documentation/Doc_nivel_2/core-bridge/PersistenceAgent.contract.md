# PersistenceAgent.js - Atomic Contract

> **Ubicación:** `core-bridge/PersistenceAgent.js`  
> **Versión:** 10.0.0  
> **Última Actualización:** 2026-01-08

---

## Dharma (Propósito)
Agente de persistencia dual. Genera y guarda archivos `.project.json` (visual) y `.flow.json` (lógico) en Google Drive.

---

## Axiomas (Invariantes)

1. **Dual Persistence**: Siempre genera ambos archivos (.project + .flow).
2. **Agnosticismo de Ruta**: Usa UUID para identificar archivos, no rutas.
3. **Inmutabilidad de Origen**: No modifica el estado de Amnesia, solo lo lee.
4. **Validación Pre-Guardado**: Valida estructura antes de persistir.

---

## Interfaz Pública

### Funciones Exportadas

#### `saveSystemState()`
Guarda el estado actual del sistema en Drive.

**Retorna:** `Promise<{ projectId, flowId }>`

**Ejemplo:**
```javascript
const { projectId, flowId } = await saveSystemState();
console.log('Guardado:', projectId, flowId);
```

---

#### `hydrateFromProject(projectId)`
Carga un proyecto desde Drive e hidrata Amnesia.

**Parámetros:**
- `projectId` (string): UUID del proyecto

**Retorna:** `Promise<void>`

**Ejemplo:**
```javascript
await hydrateFromProject('project_abc123');
// Amnesia ahora contiene los nodos del proyecto
```

---

#### `compileToFlow(cosmosData, topologyData)`
Compila el estado visual a formato ejecutable.

**Parámetros:**
- `cosmosData` (Record<string, UniversalItem>): Nodos
- `topologyData` (Connection[]): Conexiones

**Retorna:** `FlowJSON`

**Ejemplo:**
```javascript
const flow = compileToFlow(cosmos, connections);
// flow = { nodes: [...], connections: [...] }
```

---

## Dependencias

### Internas
- `store/Amnesia.js` - Lectura de estado
- `core-bridge/Resolver.js` - Resolución UUID → Drive ID
- `utils/Sanitizer.js` - Validación de datos

### Externas
- Google Drive API (v3)

---

## Estado Interno

Ninguno (funciones puras).

---

## Protocolo de Uso

### Guardar Proyecto
```javascript
import { saveSystemState } from './core-bridge/PersistenceAgent';

async function handleSave() {
  try {
    const { projectId, flowId } = await saveSystemState();
    console.log('✅ Guardado:', projectId, flowId);
  } catch (error) {
    console.error('❌ Error al guardar:', error);
  }
}
```

### Cargar Proyecto
```javascript
import { hydrateFromProject } from './core-bridge/PersistenceAgent';

async function handleLoad(projectId) {
  await hydrateFromProject(projectId);
  // Amnesia ahora tiene los nodos cargados
}
```

---

## Formato de Archivos

### .project.json (Visual)
```json
{
  "uuid": "project_abc123",
  "name": "Mi Proyecto",
  "cosmos": {
    "node_1": { "uuid": "node_1", "x": 100, "y": 200, ... }
  },
  "session": {
    "zoom": 1.0,
    "panNormalized": { "x": 0.5, "y": 0.5 }
  }
}
```

### .flow.json (Lógico)
```json
{
  "uuid": "flow_abc123",
  "nodes": [
    { "id": "node_1", "type": "gmail.send", "config": {...} }
  ],
  "connections": [
    { "from": "node_1", "to": "node_2", ... }
  ]
}
```

---

## Cambios V10

**Antes (V9):**
- `ProjectManager.js` monolítico
- Solo guardaba `.project.json`

**Después (V10):**
- `PersistenceAgent.js` atómico
- Dual persistence (.project + .flow)

---

## Relacionado

- [SyncOrchestrator.contract.md](../store/orchestrators/SyncOrchestrator.contract.md)
- [Resolver.contract.md](Resolver.contract.md)
