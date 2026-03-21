# ADR_025 — Sistema Canónico de Alias y Renombrado Orquestado

> **Versión:** 1.0
> **Estado:** VIGENTE
> **Alcance:** Core (`provider_system`, `protocol_router`) + Cliente (Macro Engines y primitivas UI)

---

## 1. Contexto

INDRA ya definía identidad por `handle.ns`, `handle.alias`, `handle.label` (ADR_001), pero no tenía un contrato operativo único y transversal para:

1. Renombrar alias de átomo con seguridad sistémica.
2. Renombrar alias de campo de `DATA_SCHEMA` con cascada tipada.
3. Previsualizar impactos antes del commit.
4. Detectar colisiones intra-schema/cross-schema/sistema.
5. Evitar fallback local que rompa la Verdad Canónica.

El resultado era riesgo de deriva entre UI, pines y artefactos dependientes.

---

## 2. Decisión

Se adopta un **sistema canónico de renombrado en dos fases**:

1. **Fase `dry_run` obligatoria**: el cliente no puede confirmar renombre sin previsualización.
2. **Fase `commit`**: persistencia canónica por protocolo, sin fallback local.

Además, se formaliza un sensor de colisiones como protocolo independiente y reutilizable.

---

## 3. Protocolos Canónicos

### 3.1 `ATOM_ALIAS_RENAME`

- **Objetivo:** Renombrar `handle.alias` (y opcionalmente `handle.label`) de un átomo.
- **Entrada:**
  - `context_id` (átomo objetivo)
  - `data.old_alias?`, `data.new_alias`, `data.new_label?`, `data.dry_run?`
- **Salida `DRY_RUN`:**
  - `old_alias`, `new_alias`
  - `impacted_pins`, `impacted_workspaces`
  - `collisions[]`, `has_blockers`
- **Salida `OK/NOOP`:** átomo actualizado + metadata de impacto.

### 3.2 `SCHEMA_FIELD_ALIAS_RENAME`

- **Objetivo:** Renombrar alias de campo en `DATA_SCHEMA` y actualizar referencias tipadas.
- **Entrada:**
  - `context_id` (`DATA_SCHEMA`)
  - `data.field_id?`, `data.old_alias?`, `data.new_alias`, `data.dry_run?`
- **Salida `DRY_RUN`:**
  - `schema_id`, `field_id`, `old_alias`, `new_alias`
  - `impacts.impacted_artifacts`, `impacts.impacted_refs`
  - `collisions[]`, `has_blockers`
- **Salida `OK/NOOP`:** schema actualizado + métricas de cascada.

### 3.3 `ALIAS_COLLISION_SCAN`

- **Objetivo:** Sensado explícito de colisiones de alias con severidad.
- **Entrada:**
  - `data.target`: `ATOM_ALIAS | FIELD_ALIAS`
  - `data.alias`
  - `context_id`/`data.schema_id`/`data.field_id`/`data.atom_id` según caso
- **Salida:**
  - `collisions[]` con `scope` y `severity`
  - `has_blockers`

---

## 4. Política de Severidad

- `BLOCKER`: impide commit.
  - Ejemplo: colisión intra-schema del alias de campo.
  - Ejemplo: colisión global de alias de átomo.
- `WARNING`: permite commit con visibilidad.
  - Ejemplo: alias de campo repetido en otro schema (cross-schema).

Regla operativa: **si `has_blockers=true`, el botón de confirmar queda bloqueado**.

---

## 5. Implementación Backend (Core)

### 5.1 Registro de capacidades

En `provider_system` se declararon:

- `ATOM_ALIAS_RENAME`
- `SCHEMA_FIELD_ALIAS_RENAME`
- `ALIAS_COLLISION_SCAN`

Con `sync: BLOCKING` y purga acorde al tipo de operación.

### 5.2 Router de escritura

`protocol_router` clasifica los protocolos de rename como escritura para respetar guardas de `MIRROR` y las leyes de aduana.

### 5.3 Infraestructura de rename

`provider_system_infrastructure` implementa:

- validación de alias
- lock (`LockService`) y `LOCK_TIMEOUT`
- `dry_run` de impacto
- cascada tipada de alias de campo
- sensor de colisiones con severidad

---

## 6. Implementación Frontend (Agnóstica)

### 6.1 Runtime global

`src/services/rename_protocol_runtime.js` define:

- `prepareCanonicalRename(...)` → ejecuta `dry_run` y retorna estado `PENDING` o `NOOP`
- `commitCanonicalRename(...)` → ejecuta commit real, valida `OK/NOOP`

Este runtime es **agnóstico del motor** (no depende de Schema/Bridge/Video/Calendar).

### 6.2 Primitiva visual global

`src/components/utilities/primitives/RenameDryRunModal.jsx` implementa el gate visual único:

- resumen de alias origen/destino
- impactos
- colisiones con severidad
- bloqueo de confirmación por `has_blockers`

### 6.3 Motores integrados

- `SchemaDesigner`:
  - rename de átomo vía runtime
  - rename de campo (`SCHEMA_FIELD_ALIAS_RENAME`) vía runtime
- `BridgeDesigner`:
  - rename de identidad de átomo vía runtime
- `VideoDesigner`:
  - rename de identidad de átomo vía runtime
- `CalendarEngine`:
  - rename de identidad de átomo vía runtime

---

## 7. Invariantes Operativas

1. No se persiste rename sin `dry_run` previo.
2. No existe fallback local para commits fallidos de rename canónico.
3. Toda instancia de edición de identidad debe pasar por runtime global.
4. El modal de previsualización es único y reusable.
5. `handle.alias` mantiene formato validado por backend.

---

## 8. Compatibilidad y Migración

- Flujos anteriores que guardaban alias con `bridge.save` directo quedan deprecados para renombrado de alias.
- Cambios de `label` sin cambio de alias pueden mantener guardado local estándar (`ATOM_UPDATE`) cuando aplique.
- Renames de alias deben pasar por `ATOM_ALIAS_RENAME`.

---

## 9. Observabilidad y Trazabilidad

- El backend emite `trace_id` en operaciones críticas de rename.
- `dry_run` y `commit` son fases explícitas auditablemente distinguibles.
- Los impactos (`impacted_*`) quedan serializados en metadata para UI y diagnóstico.

---

## 10. Riesgos y Deuda Técnica Residual

1. Cobertura de cascada tipada depende de patrones de referencia explícitos; nuevas estructuras deben incorporarse al rewriter.
2. Operaciones concurrentes en alta contención pueden devolver `LOCK_TIMEOUT`; se recomienda retry con backoff en capa UI/orquestación.
3. Se sugiere extender el mismo patrón de gate a cualquier futuro editor de alias fuera de Macro Engines.

---

## 11. Relación con ADRs existentes

- **ADR_001_DATA_CONTRACTS**: identidad canónica (`handle`) y protocolos de sistema.
- **ADR_003_APP_STATE**: persistencia por tipo de operación (Identity como operación crítica).
- **ADR_008_LEY_DE_ADUANA**: cero tolerancia a materia no canónica; validación en frontera.

Este ADR no reemplaza los anteriores: **los operacionaliza específicamente para alias/rename**.

---

## 12. Estado Final Esperado

Con esta decisión, INDRA consolida un renombrado:

- **Axiomático** (verdad contractual, sin excepciones silenciosas)
- **Agnóstico** (runtime y modal reusables por cualquier motor)
- **Minimalista** (una sola implementación de flujo, múltiples consumidores)
- **Sistémico** (impacto, colisiones, bloqueo y commit canónico end-to-end)
