# ADR_001 — DATA_CONTRACTS: El Contrato Universal de Datos de Indra

> **Versión:** 4.1 (Evolución ADR-019 — Identidad Hidratada)
> **Estado:** VIGENTE — Documento Base Fundacional
> **Alcance:** Toda interacción de datos entre Capa 0 (Gateway), Capa 1 (Logic), Capa 2 (Providers) y el Cliente (Frontend).

---

## 1. PROPÓSITO

Este ADR define el **contrato universal y determinista** que rige cómo fluyen los datos en Indra. Toda función, componente o módulo que produzca, consuma o transforme datos DEBE adherirse a este contrato. No hay excepciones.

El objetivo es garantizar que cualquier módulo (frontend, backend, provider) pueda ser reemplazado, actualizado o extendido **sin romper el sistema**, porque hablan el mismo idioma estructural.

---

## 2. EL ÁTOMO UNIVERSAL (IUH v3.0)

La unidad mínima de dato en Indra es el **Átomo Universal**. Todo `item` que viaje por el sistema — sea un workspace, un registro de Notion, un campo de formulario, o un error — es un Átomo.

### 2.1 Estructura Canónica Mínima

```json
{
  "id":       "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
  "core_id":  "owner@indra-os.com",
  "class":    "WORKSPACE",
  "handle": {
    "ns":     "com.indra.system.workspace",
    "alias":  "mi_proyecto",
    "label":  "Mi Proyecto"
  },
  "provider": "system",
  "protocols": ["ATOM_READ", "ATOM_UPDATE", "ATOM_DELETE"],
  "payload":  {}
}
```

### 2.2 Campos Obligatorios

| Campo | Tipo | Restricción |
|-------|------|-------------|
| `id` | `string` | **Inmutable. Nunca inventado.** Es el ID nativo del proveedor (Drive ID, Notion Page ID, etc.). |
| `core_id` | `string` | **Identidad del Propietario.** Email del dueño del Core. Hidratado en runtime. |
| `class` | `string` | Archetype canónico en MAYÚSCULAS. Ej: `WORKSPACE`, `DATA_SCHEMA`, `WORKFLOW`. |
| `handle` | `Object` | Siempre presente. Ver §2.3. |
| `handle.ns` | `string` | Namespace de dominio. Ej: `com.indra.system.workspace`. |
| `handle.alias` | `string` | Slug funcional. Único dentro del contexto. |
| `handle.label` | `string` | Nombre legible para el usuario. Proyectado por el frontend. |

### 2.3 Sinceridad de Identidad (AXIOMA §2.3)

> **El ID de un Átomo es SIEMPRE el ID nativo de infraestructura asignado por el proveedor externo.**

- Para recursos gestionados por Drive: el ID es el **Drive File ID** (Google lo asigna, nosotros lo leemos).
- Para recursos de Notion: el ID es el **Notion Page ID** o **Database ID**.
- El sistema **nunca genera IDs sintéticos** como `ws_abc123` o `frm_xyz`. Si un ID de este formato llega al backend, es un dato corrupto y se lanza `IDENTITY_VIOLATION`.

---

## 3. LA LEY DE RETORNO (The Return Law)

**Todo handler de provider DEBE retornar exactamente este contrato:**

```json
{
  "items":    [],
  "metadata": {}
}
```

### 3.1 Reglas

- `items` es **siempre un Array**, aunque esté vacío. Nunca `null`, nunca `undefined`.
- `metadata` es **siempre un Object** con al menos `{ "status": "OK" | "ERROR" }`.
- Si ocurre un error, `items` es `[]` y `metadata` contiene `{ "status": "ERROR", "error": "mensaje", "code": "CODIGO" }`.
- El protocolo `LOGIC_EXECUTE` es la única excepción axiomática donde `items: []` y el resultado útil viaja en `metadata.result`. (Ver `api_gateway.gs` §7.1).

### 3.2 Violaciones del Contrato (CONTRACT_VIOLATION)

El `protocol_router.gs` valida toda respuesta antes de devolverla al gateway. Si un provider viola la Return Law o el contrato de átomo, se lanza `CONTRACT_VIOLATION` con evidencia explícita. **No hay silencio.** Los errores son visibles.

---

## 4. EL UQO — UNIVERSAL QUERY OBJECT

El **UQO** es el objeto de entrada universal que el Frontend envía al Backend para solicitar cualquier operación. El Gateway lo recibe, valida, y lo pasa opaco al Provider.

### 4.1 Estructura Canónica

```json
{
  "provider":    "notion",
  "protocol":    "ATOM_READ",
  "context_id":  "abc123-notion-database-id",
  "workspace_id": "1BxiMVs...",
  "data":        {},
  "query":       {}
}
```

### 4.2 Campos del UQO

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `provider` | ✅ | ID del silo destino. Ej: `"notion"`, `"system"`, `"drive"`. Para cuentas múltiples: `"notion:HG"`. |
| `protocol` | ✅ | Protocolo a ejecutar. Ver §5. |
| `context_id` | Condicional | El ID del recurso sobre el que opera el protocolo. Requerido para `ATOM_READ`, `ATOM_UPDATE`, `ATOM_DELETE`. |
| `workspace_id` | Condicional | ID del workspace activo. Requerido para `SYSTEM_PIN`, `SYSTEM_UNPIN`, `SYSTEM_PINS_READ`. |
| `data` | Condicional | Payload de escritura. Requerido para `ATOM_CREATE`, `ATOM_UPDATE`, `SYSTEM_PIN`. |
| `query` | Opcional | Parámetros de filtro/paginación. Usado por `TABULAR_STREAM`. Pasado opaco al provider. |

### 4.3 AXIOMA DEL TUBO OPACO

> **El `query` del UQO es un tubo opaco: se pasa sin modificar al provider.**

El `protocol_router` NO lee ni modifica el campo `query`. Solo el provider que lo declara sabe cómo interpretarlo.

---

## 5. PROTOCOLO CANÓNICO DE OPERACIONES

Los protocolos son las operaciones atómicas que un silo puede declarar. Cada provider declara qué protocolos implementa en su `CONF_*()`.

### 5.1 Protocolos de CRUD (Átomo Individual)

| Protocolo | Semántica |
|-----------|-----------|
| `ATOM_READ` | Lee uno o varios átomos. `context_id` puede ser el ID del átomo o una colección (`'workspaces'`, `'schemas'`). |
| `ATOM_CREATE` | Crea un nuevo átomo. El ID lo asigna el proveedor externo, nunca el cliente. |
| `ATOM_UPDATE` | Actualiza un átomo existente. `id` y `class` son inmutables. |
| `ATOM_DELETE` | Elimina permanentemente un átomo. No hay papelera lógica en el sistema. |

### 5.2 Protocolos de Colección

| Protocolo | Semántica |
|-----------|-----------|
| `TABULAR_STREAM` | Lista un conjunto de registros de un silo tabular (base de datos Notion, Drive folder). Retorna `metadata.schema.columns` para introspección de estructura. |

### 5.3 Protocolos del Sistema

| Protocolo | Semántica |
|-----------|-----------|
| `SYSTEM_PIN` | Ancla un átomo al workspace activo. Guarda solo el puntero mínimo IUH. |
| `SYSTEM_UNPIN` | Desancla un átomo del workspace. |
| `SYSTEM_PINS_READ` | Lee todos los pines anclados + bridges del workspace activo. |
| `SYSTEM_WORKSPACE_REPAIR` | Saneamiento: detecta y elimina Ghost Pins (pines cuyo recurso ya no existe). |
| `ATOM_ALIAS_RENAME` | Renombra canónicamente `handle.alias` (y opcionalmente `handle.label`) de un átomo con soporte `dry_run` y propagación a pines. |
| `SCHEMA_FIELD_ALIAS_RENAME` | Renombra alias de campo en `DATA_SCHEMA` con análisis de impacto y cascada tipada hacia artefactos dependientes. |
| `ALIAS_COLLISION_SCAN` | Sensor canónico de colisiones de alias (intra-schema, cross-schema, sistema) con clasificación de severidad. |

> Detalle operacional completo del sistema de alias y renombrado: ver `ADR_025_ALIAS_RENAME_CANONICAL_ORCHESTRATION.md`.

### 5.4 Protocolos de Lógica (Despacho Especial)

| Protocolo | Semántica |
|-----------|-----------|
| `LOGIC_EXECUTE` | Ejecuta una cadena de transformaciones del Logic Bridge. No pasa por el `provider_registry`. Resultado en `metadata.result`. |
| `WORKFLOW_EXECUTE` | Ejecuta un flujo de pasos secuenciales. No pasa por el `provider_registry`. Resultado en `metadata.execution`. |

---

## 6. PROTOCOLOS DE CAPACIDAD (Provider Capability Contract)

Todo provider DEBE declarar capacidades por protocolo en su `CONF_*()`:

```javascript
capabilities: {
  ATOM_READ:   { sync: 'BLOCKING', purge: 'NONE' },
  ATOM_CREATE: { sync: 'BLOCKING', purge: 'ALL'  },
  ATOM_UPDATE: { sync: 'BLOCKING', purge: 'ID'   },
  ATOM_DELETE: { sync: 'BLOCKING', purge: 'ALL'  },
}
```

| Campo | Valores | Significado |
|-------|---------|-------------|
| `sync` | `BLOCKING` | La operación es síncrona: el cliente espera la respuesta antes de continuar. |
| `purge` | `NONE` \| `ID` \| `ALL` | Qué caché debe invalidar el frontend al recibir la respuesta. `NONE` = no tocar caché. `ID` = invalidar solo el átomo afectado. `ALL` = limpiar toda la caché del provider. |

Si un provider no declara `capabilities` para un protocolo dado, el `protocol_router` rechaza la operación con `PROTOCOL_NOT_SUPPORTED` antes de ejecutarla.

---

## 7. CLASES CANÓNICAS DE ÁTOMOS

| `class` | Descripción | Provider Habitual |
|---------|-------------|-------------------|
| `WORKSPACE` | Workspace raíz del sistema | `system` |
| `DATA_SCHEMA` | Esquema de formulario/captura | `system` |
| `WORKFLOW` | Definición de flujo automatizado | `system` |
| `FORMULA` | Regla de negocio reutilizable | `system` |
| `DOCUMENT` | Plantilla de documento con placeholders | `system` |
| `FOLDER` | Carpeta / contenedor de recursos | `drive`, `notion`, `system` |
| `DATA_ROW` | Registro individual de una tabla/base | `notion`, `pipeline` |
| `TABULAR` | Base de datos / colección de filas | `notion` |
| `LOGIC_ENGINE` | Motor de transformaciones internas | `pipeline` |
| `ACCOUNT_IDENTITY` | Identidad de la cuenta conectada | `system`, `notion` |
| `ERROR_REPORT` | Átomo de error proyectable (Error-as-Data) | Cualquiera |

---

## 8. AXIOMAS FUNDAMENTALES

### A1 — Ley de Retorno (The Return Law §3.1)
Todo provider retorna `{ items: Array, metadata: Object }`. Sin excepción.

### A2 — Sinceridad de Identidad (§2.3)
El ID de un átomo es siempre el ID nativo del proveedor externo. El sistema no inventa IDs.

### A3 — Tubo Opaco del Query (§4.3)
El campo `query` se pasa sin modificar al provider. El router es ciego a su contenido.

### A4 — Inmutabilidad de Clase e ID (§5.1)
`id` y `class` de un átomo nunca cambian después de su creación (`ATOM_CREATE`).

### A5 — Eventual Consistency de Identidad Propagada
Cuando cambia el `handle.label` de un átomo, el backend intenta propagar el cambio a los pines de los workspaces (`_system_propagateNameChange`). Esta propagación es **best-effort**: si falla parcialmente, los pines mostrarán el label anterior hasta que el workspace sea recargado. No es un axioma de garantía atómica. (Ver ADR_008 §4.D3).

### A6 — Error-as-Data (Visibilidad Forzada)
Los errores de ejecución de providers se convierten en un Átomo de clase `ERROR_REPORT` proyectable por el frontend. El sistema nunca silencia fallos.

### A7 — Agnosticismo de Provider
El frontend nunca contiene lógica específica de un provider. Solo conoce `class`, `protocols`, y la estructura del Átomo Universal. Cualquier provider que cumpla el contrato es intercambiable.

### A8 — Borrado Físico Determinista (ADR_008 §3.3)
`ATOM_DELETE` elimina solo la materia física. No propaga ni escanea referencias. La integridad referencial se resuelve en tiempo de lectura mediante el **Portal de Sinceridad** (`SYSTEM_PINS_READ`). Las referencias huérfanas son un estado transitorio visible, no un estado de error.

### A9 — Determinismo de Paridad (Auto-Mapping)
En procesos de inducción automática, el sistema asume una **Relación de Identidad** entre el Alias del Campo y el ID de la Columna externa si sus nombres normalizados coinciden. El usuario solo interviene en casos de ambigüedad.

### A10 — Soberanía del Manifiesto de Acceso (ADR-019)
Todo puente (`BRIDGE`) destinado a ejecución pública mediante enlace compartido DEBE estar firmado por un `ACCESS_TOKEN` generado en el momento de la inducción. La ejecución sin token válido en contexto público resulta en `SECURITY_VIOLATION`.

### A11 — Hidratación de Identidad (ADR-019 §2.3)
La identidad del propietario (`core_id`) NO se almacena físicamente en los átomos residentes en Drive. El Core inyecta este metadato en tiempo de vuelo (lectura) basándose en la variable maestra `SYS_CORE_OWNER_UID`. Esto garantiza la portabilidad de los archivos y la invarianza de la identidad frente a traslados de soporte físico.

---

## 9. RESTRICCIONES ABSOLUTAS

- ❌ **NO** generar IDs en el cliente o frontend. Los IDs los asigna el proveedor externo en el momento de `ATOM_CREATE`.
- ❌ **NO** leer ni escribir en PropertiesService desde los providers. Usar las funciones de `system_config.gs`.
- ❌ **NO** invocar APIs externas desde `provider_system`. Es un provider interno puro.
- ❌ **NO** retornar `null` o valores no-objeto desde un handler de provider.
- ❌ **NO** modificar el campo `query` del UQO en el `protocol_router`.
- ❌ **NO** usar el campo `name` (deprecado). Usar `handle.label` para proyección.

---

## 10. REGLAS DE INDUSTRIALIZACIÓN Y AUTOMATIZACIÓN (Induction Rules)

Para garantizar la robustez en la generación automática de átomos (`Schema`, `Bridge`) desde fuentes externas:

### 10.1 Detección de Deriva (Schema Drift)
Todo motor de ejecución (AEE) DEBE validar la integridad estructural del `DATA_SCHEMA` contra la fuente real (`TABULAR_STREAM`) antes de cada sesión. Si se detectan cambios en el origen, el sistema debe pausar y ofrecer una **Sincronización de Emergencia**.

### 10.2 Escopado de Alias (Namespace Scoping)
Para evitar colisiones de alias en el `LogicEngine`, los alias generados por inducción automática deben estar prefijados por el `external_id` o el `alias` de la base de datos de origen:  
`alias_final = [db_alias]_[column_name_normalized]`

### 10.3 Patrón de Tickets Asíncronos (Async Induction)
Debido a los límites de ejecución de GAS, las inducciones complejas no deben ser síncronas. El protocolo `INDUCTION_START` debe retornar un `TICKET_ID`. El frontend realizará *polling* mediante `INDUCTION_STATUS` hasta que el `InductionOrchestrator` confirme la cristalización de los átomos.

---

## 11. PROTOCOLO DE IGNICIÓN (Forward Engineering)

Como simetría a la Inducción (ADR-020), la **Ignición** permite que un `DATA_SCHEMA` (ADN) se manifieste como un recurso físico (Materia) en un proveedor externo.

### 11.1 El Contrato de Creación de Materia (ATOM_CREATE para TABULAR)

Para que la ignición sea inteligente, el protocolo `ATOM_CREATE` en la clase `TABULAR` evoluciona para recibir el ADN completo de los campos:

- **Request Payload:**
```json
{
  "class":    "TABULAR",
  "name":     "Nombre del Silo",
  "fields":   [
    { "id": "f1", "label": "Nombre", "type": "TEXT" },
    { "id": "f2", "label": "Precio", "type": "CURRENCY" },
    { "id": "f3", "label": "Fecha", "type": "DATE" }
  ],
  "context_id": "parent_folder_or_page_id"
}
```

### 11.2 Sinceridad de Tipos en Ignición
Todo provider que implemente `ATOM_CREATE` para la clase `TABULAR` DEBE realizar un esfuerzo de **Mapeo de Tipos Nativos** (ej: crear columnas de tipo Date en Notion o aplicar formatos de moneda en Sheets). Si el provider no soporta un tipo específico, debe degradar a `TEXT` de forma graciosa.

### 11.3 El Vínculo de Encarnación
Tras una ignición exitosa, el sistema actualiza el `DATA_SCHEMA` original inyectando:
- `payload.target_silo_id`: El ID nativo del recurso creado.
- `payload.target_provider`: El ID del proveedor donde reside la materia.
- `payload.status`: "LIVE" (Auto-publicación).

---

*Documento fundacional. Toda contradicción entre código y este ADR debe resolverse actualizando el código.* (Actualizado ADR-032)
