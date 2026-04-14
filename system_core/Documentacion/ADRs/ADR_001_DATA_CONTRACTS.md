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
| `id` | `string` | **Inmutable.** Es el ID nativo del proveedor (Drive ID, Notion Page ID, etc.). |
| `core_id` | `string` | **Identidad del Propietario.** Hidratada dinámicamente en runtime (v4.1). |
| `class` | `string` | Archetype canónico en MAYÚSCULAS. Ej: `WORKSPACE`, `DATA_SCHEMA`. |
| `handle` | `Object` | Siempre presente. Contiene `ns`, `alias` y `label`. |
| `provider` | `string` | El silo de origen (ej: `drive`, `notion`, `system`). |

### 2.3 Sinceridad de Identidad (AXIOMA §2.3)

> **El ID de un Átomo es SIEMPRE el ID nativo de infraestructura asignado por el proveedor externo.**

- El sistema **nunca genera IDs sintéticos**. Si un ID no es reconocido por el proveedor nativo, es un dato corrupto (`IDENTITY_VIOLATION`).

---

## 3. LA ADUANA DE SEGURIDAD (The Gatekeeper)

Toda petición al Core (Gateway) debe estar firmada. Se han unificado los métodos de acceso:

### 3.1 El sobre de transporte (Request Envelope)

```json
{
  "satellite_token": "indra_mi_satelite_123",
  "password":        "....", 
  "uqo":             { ... }
}
```

- **`satellite_token` (ADR-041)**: Es el campo oficial para integraciones de Satélites. Reemplaza a `admin_token` o `api_key` en contextos modernos.
- **`share_ticket` (ADR-019)**: Permite acceso público limitado a un solo átomo.

---

## 4. EL UQO — UNIVERSAL QUERY OBJECT

El **UQO** es el objeto de entrada universal. El Gateway lo recibe, valida, y lo pasa al Provider.

### 4.1 Estructura Canónica

```json
{
  "provider":     "notion",
  "protocol":     "ATOM_READ",
  "context_id":   "abc123-id",
  "workspace_id": "...",
  "resonance_mode": "SOVEREIGN" | "MIRROR",
  "data":         {},
  "query":        {}
}
```

### 4.2 Axioma de Resonancia (ADR-008)

- **`SOVEREIGN` (Por defecto)**: Capacidad total de lectura y escritura.
- **`MIRROR` (Modo Espejo)**: Toda operación de escritura (`ATOM_CREATE`, `UPDATE`, `DELETE`) está bloqueada en la frontera. Garantiza que la "Materia" sea solo de lectura.

---

## 5. LA LEY DE RETORNO (The Return Law)

**Todo handler de provider DEBE retornar exactamente este contrato:**

```json
{
  "items":    [],
  "metadata": { "status": "OK" | "ERROR", ... }
}
```

### 5.1 Prohibición de Materia Legada
- Queda terminantemente prohibido el uso de la clave `columns`. 
- Toda estructura tabular debe viajar en `payload.fields` como un Array de objetos. El incumplimiento lanza `CONTRACT_VIOLATION`.

---

## 6. AXIOMAS FUNDAMENTALES (Resumen v4.1)

1.  **A1 — Ley de Retorno:** Siempre `items` (Array) y `metadata` (Object).
2.  **A2 — Sinceridad de Identidad:** El ID es nativo del proveedor.
3.  **A3 — Tubo Opaco:** El campo `query` se pasa sin modificar.
4.  **A11 — Hidratación de Identidad:** El `core_id` se inyecta en tiempo de vuelo basándose en el propietario del Core. No se almacena físicamente para garantizar portabilidad.
5.  **A12 — Soberanía del Token:** El `satellite_token` es la identidad del satélite ante el Llaver Master.

---

*Documento fundacional. Actualizado para reflejar la implementación real del Core v4.1.*
