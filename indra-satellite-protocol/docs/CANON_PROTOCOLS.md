# INDRA CANON: UNIVERSAL PROTOCOL MANIFEST (v17.5 OMEGA)
> **Sovereign Directive**: 100% Extraction from `protocol_router.gs`.
> **Ley Axial**: El UQO siempre lleva `protocol` + `context_id`. La respuesta siempre es `{ items: [...], metadata: { status: 'OK' } }`.

## 0. CONTRATOS DE USO (Sintaxis Canónica)

Esta sección define el **cómo** — la sintaxis exacta verificada en sesión de depuración.

### `ATOM_READ` — Leer un átomo por ID
**Caso de uso**: Traer los campos de un esquema, los datos de un workspace, o cualquier átomo conocido.

```javascript
// UQO de entrada
const res = await bridge.execute({
    protocol: 'ATOM_READ',
    context_id: 'ID_DEL_ATOMO'   // ⚠️ SIEMPRE context_id, NUNCA atom_id ni id
});

// Extracción de materia (Contrato de Respuesta)
const atomo       = res.items[0];           // El átomo real
const nombre      = atomo.handle.label;     // Nombre humano legible
const alias       = atomo.handle.alias;     // Nombre para lógica de programación
const campos      = atomo.payload.fields;   // Array de campos del esquema
const siloFisico  = atomo.payload.target_silo_id; // ID de la tabla vinculada
```

**Blueprint Puro (Destilación de Materia)**: Al persistir localmente, solo conservar:
```javascript
{
    id:      atomo.id,
    handle:  { label: atomo.handle.label, alias: atomo.handle.alias },
    class:   atomo.class,
    payload: { fields: atomo.payload.fields, target_silo_id: ..., target_provider: ... }
}
// ❌ NUNCA persistir: core_id, created_at, updated_at, protocols, raw
```

---

### `ATOM_CREATE` — Crear un nuevo átomo
**Caso de uso**: Exportar un esquema nuevo desde el satélite al Core.

```javascript
const res = await bridge.execute({
    protocol: 'ATOM_CREATE',
    context_id: workspaceId,   // ID del workspace destino
    data: {
        class: 'DATA_SCHEMA',
        handle: { label: 'Nombre Humano', alias: 'nombre_alias' },
        payload: { fields: [...] }
    }
});
const atomoCreado = res.items[0]; // El átomo materializado con su nuevo ID
```

---

### `ATOM_UPDATE` — Actualizar un átomo existente
**Caso de uso**: Sincronizar cambios locales de un esquema de vuelta al Core.

```javascript
const res = await bridge.execute({
    protocol: 'ATOM_UPDATE',
    context_id: atomo.id,      // ID del átomo a actualizar (NO workspace)
    data: {
        handle: { label: 'Nombre Actualizado', alias: 'alias_actualizado' },
        payload: { fields: [...campos actualizados...] }
    }
});
```

---

### `SYSTEM_PINS_READ` — Listar esquemas de un workspace
**Caso de uso**: Poblar el árbol fractal remoto con los átomos disponibles.

```javascript
const res = await bridge.execute({
    protocol: 'SYSTEM_PINS_READ',
    workspace_id: 'ID_DEL_WORKSPACE'
});
const listaDeEsquemas = res.items; // Array de átomos (sin payload profundo)
// ⚠️ PINS_READ devuelve metadata superficial. Para obtener fields, se requiere ATOM_READ por cada ID.
```

---

### `TABULAR_STREAM` — Leer datos de una tabla física
**Caso de uso**: Traer registros de una Spreadsheet o tabla de Notion.

```javascript
const res = await bridge.execute({
    provider: 'sheets',          // 'sheets' | 'notion' | 'drive'
    protocol: 'TABULAR_STREAM',
    context_id: 'ID_DEL_SILO',  // ID físico de la tabla (target_silo_id del schema)
    data: { limit: 50 }         // Opcional: número de filas
});
const filas   = res.items;
const columnas = res.metadata.schema.fields; // Estructura de la tabla
```

---


## 1. INFRASTRUCTURE & STATE
- `SYSTEM_MANIFEST`
- `SYSTEM_INSTALL_HANDSHAKE`
- `HEALTH_CHECK`

## 2. PERSISTENCE (ATOM CRUD)
- `ATOM_READ` — Ver contrato §0
- `ATOM_CREATE` — Ver contrato §0
- `ATOM_UPDATE` — Ver contrato §0
- `ATOM_PATCH` — Mezcla selectiva de payload (no sobreescribe todo el átomo)
- `ATOM_DELETE` — Requiere `context_id`. Propaga purga al Ledger.
- `ATOM_EXISTS` — Verifica existencia. Responde `{ status: 'EXISTS' | 'NOT_FOUND' }`
- `ATOM_ALIAS_RENAME`
- `ATOM_ROLLBACK`
- `RELATION_SYNC`
- `SCHEMA_FIELD_ALIAS_RENAME`
- `ALIAS_COLLISION_SCAN`

## 3. JURISDICTION & WORKSPACES
- `SYSTEM_PIN`
- `SYSTEM_UNPIN`
- `SYSTEM_PINS_READ`
- `SYSTEM_WORKSPACE_REPAIR`
- `SYSTEM_WORKSPACE_DEEP_PURGE`
- `SYSTEM_SHARE_CREATE`

## 4. IDENTITY & KEYCHAIN
- `SYSTEM_KEYCHAIN_GENERATE`
- `SYSTEM_KEYCHAIN_REVOKE`
- `SYSTEM_KEYCHAIN_AUDIT`
- `SYSTEM_KEYCHAIN_SCHEMA`
- `ACCOUNT_RESOLVE`
- `SYSTEM_CONFIG_WRITE`
- `SYSTEM_CONFIG_SCHEMA`
- `SYSTEM_CONFIG_DELETE`
- `SERVICE_PAIR`
- `SERVICE_UNPAIR`

## 5. NEXUS & CROSS-IDENTITY
- `SYSTEM_NEXUS_HANDSHAKE_INIT`
- `SYSTEM_NEXUS_HANDSHAKE_ACCEPT`
- `SYSTEM_IDENTITY_CREATE`
- `SYSTEM_IDENTITY_READ`
- `SYSTEM_IDENTITY_VERIFY`

## 6. SATELLITE SOVEREIGNTY
- `SYSTEM_SATELLITE_INITIALIZE`
- `SYSTEM_SATELLITE_DISCOVER`
- `SYSTEM_SATELLITE_UPGRADE`
- `SYSTEM_CORE_DISCOVERY`
- `SYSTEM_BLUEPRINT_SYNC`
- `SYSTEM_SCHEMA_IGNITE`

## 7. ANALYTICS & COMPUTATION
- `REVISIONS_LIST`
- `RESONANCE_ANALYZE`
- `FORMULA_EVAL`
- `SYSTEM_AUDIT`

## 8. POLYMORPHIC (DRIVE/SHEETS/NOTION)
- `TABULAR_STREAM` — Ver contrato §0. Requiere `provider` explícito.
- `HIERARCHY_TREE` — Árbol de carpetas de Drive. Requiere `provider: 'drive'`.
- `MEDIA_RESOLVE` — Obtiene URL pública de un archivo de Drive.

## 9. INDUSTRIAL AUTOMATION
- `INDUSTRIAL_SYNC`
- `INDUSTRIAL_IGNITE`
- `INDUCTION_START`
- `INDUCTION_PULSE`
- `MEDIA_INGEST_START`
- `MEDIA_INGEST_PULSE`
- `MEDIA_INGEST_FINALIZE`
- `INDUCTION_STATUS`
- `INDUCTION_CANCEL`
- `INDUCTION_DRIFT_CHECK`

## 10. LOGIC & WORKFLOWS
- `WORKFLOW_EXECUTE`
- `LOGIC_EXECUTE`
- `INTELLIGENCE_CHAT`
- `INTELLIGENCE_DISCOVERY`
- `SCHEMA_FIELD_OPTIONS`
- `ATOM_LIST_QUERY`

## 11. PULSE & LEDGER
- `SYSTEM_QUEUE_READ`
- `SYSTEM_REBUILD_LEDGER`
- `SYSTEM_RESONANCE_CRYSTALLIZE`
- `SYSTEM_TRIGGER_HUB_GENERATE`
- `PULSE_WAKEUP`

## 12. LEGACY COMPATIBILITY
- `EMERGENCY_INGEST_INIT`
- `EMERGENCY_INGEST_CHUNK`
- `EMERGENCY_INGEST_FINALIZE`

## 13. OTHERS
- `SYSTEM_BATCH_EXECUTE`
- `SEARCH_DEEP`
