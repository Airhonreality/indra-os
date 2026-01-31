# TopologySlice.js - Atomic Contract (V3 - Pristine)

> **Ubicación:** `src/core/state/slices/TopologySlice.js`
> **Axioma:** Gestión de la colección de nodos y conexiones (Topología). Responsable de CRUD de nodos e hidratación desde proyectos.

---

## 1. Axiomas (Invariantes)

1. **UUID como Clave**: Cada elemento se indexa por su UUID inmutable.
2. **Inmutabilidad**: Las actualizaciones crean nuevos objetos, no mutan existentes.
3. **Hidratación Completa**: Al cargar un proyecto, el estado previo se reemplaza íntegramente.
4. **Sin Persistencia Directa**: El slice gestiona estado en memoria; la persistencia es responsabilidad del `PersistenceManager`.

---

## 2. Interfaz Pública

### Estado
```typescript
{
  topology: { [uuid: string]: TopologyItem }
}
```

### Acciones

#### `updateNode(uuid, data)`
Crea o actualiza un nodo en la topología.

**Parámetros:**
- `uuid` (string): Identificador único.
- `data` (TopologyItem): Datos del nodo.

**Ejemplo:**
```javascript
updateNode('node_123', {
  uuid: 'node_123',
  type: 'gmail',
  name: 'Enviar Email',
  x: 100,
  y: 200,
  data: { to: 'user@example.com' }
});
```

---

#### `removeNode(uuid)`
Elimina un nodo de la topología.

**Parámetros:**
- `uuid` (string): ID del nodo.

**Ejemplo:**
```javascript
removeNode('node_123');
```

---

#### `hydrateTopology(data)`
Reemplaza toda la topología con el dataset provisto.

**Parámetros:**
- `data` (Record<string, TopologyItem>): Nueva topología.

---

## 3. Estado Interno

```typescript
{
  topology: Record<string, TopologyItem>
}
```

**Estructura de TopologyItem:**
```typescript
{
  uuid: string;
  type: string;
  name: string;
  x: number;
  y: number;
  data: Record<string, any>;
  ports?: {
    inputs: Port[];
    outputs: Port[];
  };
}
```

---

## 4. Protocolo de Uso

### Uso desde CoreStore
```javascript
const { updateNode } = useCoreStore();

updateNode('gmail_abc123', {
  uuid: 'gmail_abc123',
  type: 'gmail',
  name: 'Enviar Reporte',
  x: 100,
  y: 200,
  data: { to: 'boss@company.com' }
});
```

### Hidratar desde Proyecto
```javascript
const { hydrateTopology } = useCoreStore();

const projectData = await loadProjectFromDrive();
hydrateTopology(projectData.topology);
```

---

## 5. Relacionado

- [PersistenceManager.contract.md](PersistenceManager.contract.md)
- [SessionSlice.contract.md](SessionSlice.contract.md)
- [VisualSystem.contract.md](../style/VisualSystem.contract.md)
