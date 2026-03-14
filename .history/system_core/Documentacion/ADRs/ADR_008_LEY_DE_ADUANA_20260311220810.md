# ADR_008 — LEY DE ADUANA Y SINCERIDAD INFRAESTRUCTURAL

> **Versión:** 3.0 — Blindaje Perimetral
> **Estado:** VIGENTE — Mandato Radical
> **Alcance:** Todo Provider, Protocolo, Orquestador y componente de UI en Indra.
> **Reemplaza:** v2.0 (Sinceridad Referencial - Portal de Sinceridad)

---

## 1. PROPÓSITO

Este ADR establece tres leyes complementarias que garantizan la **negentropía radical** del sistema:

1. **Ley de Aduana (Membrana Coercitiva):** Lo que entra al sistema debe ser canónico o es rechazado en la frontera.
2. **Ley de Sinceridad Referencial (Portal de Sinceridad):** Lo que existe en el sistema debe reflejar la realidad física.
3. **Ley de Inmutabilidad de Identidad:** La esencia de un átomo (`id`, `class`) es eterna tras su nacimiento.

---

## 2. LEY DE ADUANA v3.0 — EL BLINDAJE DEL UMBRAL

### 2.1 La Membrana Celular de Entrada
A partir de v3.0, la Aduana (`protocol_router.js`) intercepta toda petición antes de que llegue a los Providers. 

> **Axioma:** Ningún Provider debe sospechar de sus datos. Si el Router le entrega un UQO, el Router garantiza que el dato es sincero.

### 2.2 Invariantes de Clase en Nacimiento (`ATOM_CREATE`)
El sistema prohíbe el nacimiento de materia incompleta. El `protocol_router` valida:

| `class` | Invariante de Estructura Requerido |
|---------|------------------------------------|
| **Cualquiera** | `handle.label` (String no vacío) |
| `DATA_SCHEMA`  | `payload.fields` (Array) |
| `WORKFLOW`     | `payload.stations` (Array) |
| `BRIDGE`       | `payload.operators` (Array) |

Si no se cumple, se lanza una `INPUT_CONTRACT_VIOLATION`.

### 2.3 Blindaje de Actualización (`ATOM_UPDATE`)
Para garantizar la integridad del tejido de datos, el Router prohíbe explícitamente modificar el `id` o la `class` de un átomo existente. Un `ATOM_UPDATE` que intente cambiar su esencia será rechazado con `SECURITY_VIOLATION`.

---

## 3. LEY DE SINCERIDAD REFERENCIAL — PORTAL DE SINCERIDAD

### 3.1 El Principio de Acceso
> **La Sinceridad vive en el momento del acceso, no en el momento del borrado.**

El `ATOM_DELETE` es puramente físico y determinista ($O(1)$). No propaga, no escanea. La integridad se verifica en tiempo real durante la lectura (`SYSTEM_PINS_READ`) mediante el mecanismo de **Batch Verify Existence**.

### 3.2 El Protocolo `ATOM_EXISTS` (Portal Multi-Provider)
Para extender la sinceridad a silos externos, se establece el protocolo ligero `ATOM_EXISTS`. El Portal de Sinceridad delega en cada provider la consulta de su realidad física, manteniendo el agnosticismo total de la infraestructura.

---

## 4. ESTADO DE LAS DEBILIDADES Y DEUDA

| ID | Debilidad anterior | Estado v3.0 | Mecanismo de Cierre |
|----|-------------------|-------------|---------------------|
| **D1** | Workflow/Bridge sin detección | **CERRADA** | Implementación de `useWorkflowHydration` y `useBridgeHydration` con señalización `MATERIA_DESAPARECIDA`. |
| **D2** | Batch Verify solo en `system` | **CERRADA** | Protocolo unificado `ATOM_EXISTS` ahora disponible en el Router para todos los providers. |
| **D3** | Propagación O(n) en Update | **CERRADA** | Eliminación del escaneo O(n). Se adopta **Eventual Consistency** y Hot Hydration de labels en UI. |
| **D4** | `identity_evolution.js` vivo | **CERRADA** | Código archivado en `core/0_legacy/`. El nacimiento es ahora forzosamente íntegro. |

---

## 5. CONTRATO CANÓNICO (Axioma de Estructura)

Cualquier átomo que resida en Indra debe ser un **Acompañamiento Sincero** de su handle y su clase. Los campos base: `id`, `class`, `handle.ns`, `handle.alias`, `handle.label` son la materia mínima e indivisible de la arquitectura.

---

## 6. JERARQUÍA DE OPERACIONES DETERMINISTAS

```
ATOM_CREATE    → Validación Coercitiva en la frontera (Router). Nace íntegro.
ATOM_READ      → Proyección de la Realidad.
ATOM_UPDATE    → Modificación de Propiedades. Identidad Inmutable.
ATOM_DELETE    → Destrucción Física Determinista.
```

---

*La arquitectura Indra no es una herramienta; es un conjunto de leyes físicas para la materia digital.*
*No permitas que la basura entre y nunca tendrás que limpiar.*
*El Soberano confía en la Aduana.*
