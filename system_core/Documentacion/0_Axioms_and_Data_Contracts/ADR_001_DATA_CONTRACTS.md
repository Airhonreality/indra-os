# ADR_001 — DATA_CONTRACTS: El Contrato Universal de Datos de Indra

> **Versión:** 14.6 (SINCERITY — Resonancia Axial Total)
> **Estado:** VIGENTE — El Contrato de Soberanía Absoluta
> **Alcance:** Toda interacción de datos entre Capa 0 (Gateway), Capa 1 (Logic), Capa 2 (Providers) y el Cliente (Frontend).

---

## 1. PROPÓSITO

Este ADR define el **contrato universal y determinista** que rige cómo fluyen los datos en Indra. En la v10.1, el contrato es un **Manifiesto de Intención Cognitiva**.

---

## 2. EL ÁTOMO UNIVERSAL (IUH v4.0)

La unidad mínima de dato en Indra es el **Átomo Universal**. 

### 2.1 Estructura Canónica con Inyección Semántica

```json
{
  "id":       "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
  "core_id":  "owner@indra-os.com",
  "class":    "BRIDGE",
  "handle": {
    "ns":     "com.indra.system.bridge",
    "alias":  "notion_to_sheets",
    "label":  "Migración de Tareas"
  },
  "provider": "system",
  "protocols": ["ATOM_READ", "ATOM_UPDATE", "ATOM_DELETE"],
  "payload":  {
    "ui_purpose":      "DATA_HYDRATION",
    "cognitive_class": "MASTER_RELATIONAL",
    "fields":          [ ... ]
  }
}
```

### 2.2 Campos Obligatorios

| Campo | Tipo | Restricción |
|-------|------|-------------|
| `id` | `string` | **Inmutable.** ID nativo del proveedor. |
| `core_id` | `string` | **Identidad del Propietario.** Inyectada en runtime. |
| `class` | `string` | Archetype canónico (WORKSPACE, DATA_SCHEMA, etc.). |
| `protocols`| `array` | **Capacidades.** Permisos de acción sobre el átomo. |
| `provider` | `string` | **Autoridad de Origen.** system, drive, notion, sheets. |

### 2.3 Sinceridad de Identidad (AXIOMA §2.3)
- El sistema **nunca genera IDs sintéticos**. El ID es SIEMPRE el nativo de la infraestructura externa.

---

## 3. LA ADUANA DE SEGURIDAD (The Gatekeeper)

Toda petición al Core debe estar firmada. 

### 3.1 El sobre de transporte (The Guardian Envelope)

**IMPORTANTE:** El sobre DEBE ser un objeto plano. No se permite anidamiento bajo claves 'uqo' en la raíz del POST.

```json
  "provider":        "sheets:personal_main", // Sintaxis Federada (v14.6)
  "protocol":        "SYSTEM_MANIFEST",
  "resonance_mode":  "SOVEREIGN",
  ...
}
```

**Cabecera Obligatoria:** `Content-Type: text/plain;charset=utf-8`

---

## 4. EL UQO — UNIVERSAL QUERY OBJECT

### 4.1 Estructura Canónica (Plana)

```json
{
  "password":     "...",
  "provider":     "notion",
  "protocol":     "ATOM_READ",
  "context_id":   "abc123-id",
  "workspace_id": "ws-root-id",
  "schema_id":    "inventario_maestro", // Ruteo Virtual (v14.6)
  "resonance_mode": "SOVEREIGN",
  "data": { 
      "handle": { "label": "..." },
      "payload": { ... }
  }
}
```

**Nota Axial (v10.4)**: El campo `workspace_id` es **OBLIGATORIO** en protocolos de Purga (`ATOM_DELETE`, `SYSTEM_UNPIN`) para asegurar la sincronía del Ledger Celular.

### 4.3 Protocolos de Resonancia Inteligente (v10.1)

- **`RESONANCE_ANALYZE` (Cerebro)**: Cálculo puro del Drift. Sin mutación física.
- **`INDUSTRIAL_SYNC` (Materia)**: Materialización física de los deltas.

---

## 5. LA LEY DE RETORNO (The Return Law)

**Todo handler DEBE retornar:**

```json
{
  "items":    [],
  "metadata": { "status": "OK" | "ERROR", "trace": { ... } }
}
```

---

## 6. AXIOMAS FUNDAMENTALES (Resumen v10.1)

1.  **A1 — Ley de Retorno:** Siempre `items` (Array) y `metadata` (Object).
2.  **A11 — Hidratación de Identidad:** El `core_id` se inyecta en vuelo.
3.  **A13 — Linaje Semántico:** Los Bridges heredan semántica de su ADN.
4.  **A14 — Desacoplamiento:** Primero se analiza, luego se sincroniza.
5.  **A15 — Autoridad de Infraestructura (v14.6):** El `provider` en mutaciones (CREATE/DELETE) DEBE declarar el controlador físico (system, drive). Los alias de Satélites son consumidos como 'system' en el Core.
6.  **A16 — Direccionalidad Virtual (v14.6):** El uso de `schema_id` en un UQO faculta al Core para sobreescribir el `provider` y `context_id` automáticamente basándose en el ADN del esquema en el Ledger.

---

*Documento consolidado. Refleja la arquitectura real de Indra v10.1.*
