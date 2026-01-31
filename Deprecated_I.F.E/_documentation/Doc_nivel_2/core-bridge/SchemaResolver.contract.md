# Resolver.js - Atomic Contract

> **Ubicación:** `core-bridge/Resolver.js`  
> **Versión:** 10.0.0  
> **Última Actualización:** 2026-01-08

---

## Dharma (Propósito)
Traductor UUID ↔ Drive ID. Implementa el agnosticismo físico del sistema.

---

## Axiomas (Invariantes)

1. **UUID como Sustancia**: La identidad es el UUID, no la ruta física.
2. **System Context como Mapa**: Usa `System_Context.json` como fuente de verdad.
3. **Bidireccionalidad**: Puede resolver UUID → Drive ID y Drive ID → UUID.
4. **Cache en Memoria**: Mantiene cache para acceso rápido.

---

## Interfaz Pública

### Funciones

#### `loadSystemContext()`
Carga el System_Context.json desde Drive.

**Retorna:** `Promise<SystemContext>`

```typescript
{
  [uuid: string]: string  // uuid → drive_id
}
```

#### `resolveUUID(uuid)`
Obtiene el Drive ID de un UUID.

**Parámetros:**
- `uuid` (string): UUID a resolver

**Retorna:** `string | null` (Drive ID o null si no existe)

#### `resolveFileId(driveId)`
Obtiene el UUID de un Drive ID (resolución inversa).

**Parámetros:**
- `driveId` (string): Drive ID a resolver

**Retorna:** `string | null` (UUID o null si no existe)

#### `registerUUID(uuid, driveId)`
Registra un nuevo mapeo UUID → Drive ID.

---

## Protocolo de Uso

```javascript
import { loadSystemContext, resolveUUID } from './core-bridge/Resolver';

// Al iniciar
await loadSystemContext();

// Resolver UUID
const driveId = resolveUUID('project_abc123');
// driveId = '1a2b3c4d5e6f'

// Cargar archivo desde Drive
const file = await DriveAPI.getFile(driveId);
```

---

## Formato de System_Context.json

```json
{
  "project_abc123": "1a2b3c4d5e6f7g8h",
  "flow_xyz789": "9z8y7x6w5v4u3t2s",
  "layout_def456": "3t4r5e6w7q8a9s0d"
}
```

---

## Relacionado
- [PersistenceAgent.contract.md](PersistenceAgent.contract.md)
- [Discovery.contract.md](Discovery.contract.md)
