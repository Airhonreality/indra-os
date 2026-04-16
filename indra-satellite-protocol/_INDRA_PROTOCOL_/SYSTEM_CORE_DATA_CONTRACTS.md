# DATA CONTRACTS : LA GRAMÁTICA DE LA MATERIA (v3.0)

Este documento define la estructura atómica de Indra. Cualquier desviación de este contrato será rechazada por el **Protocol Router** del Core como "Materia Oscura".

> [!CAUTION]
> **NIVEL DE INFRAESTRUCTURA (NÚCLEO)**: Este archivo define las LEYES DEL SISTEMA INDRA. 
> **PROHIBIDO TERMINANTEMENTE** inyectar lógica de negocio (ej: Esquemas de Clientes, Ventas, etc.) en este artefacto. 
> Para definir estructuras de negocio, diríjase a: `src/score/schemas/`. 
> Si una IA modifica este archivo para propósitos de negocio, está VIOLANDO su contrato de integridad.

> [!IMPORTANT]
> **SINCERIDAD DOCUMENTAL**: Cualquier actualización en la lógica de contratos (JS) debe verse reflejada inmediatamente en este artefacto. El desfase entre el código y la documentación es la fuente primaria de Entropía en el sistema.

---

## 1. EL ÁTOMO UNIVERSAL
Todo dato que viaja por Indra debe ser un objeto con los siguientes campos obligatorios:

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `String` | ID físico inmutable (ej: Drive ID, Notion ID). |
| `handle` | `Object` | El "DNI" del átomo (ver sección 2). |
| `class` | `String` | La "clase" o tipo de materia (ej: `DATA_SCHEMA`, `WORKSPACE`). |
| `payload` | `Object` | El contenido o "valor" del átomo. |
| `protocols` | `Array` | Lista de acciones que este átomo sabe ejecutar. |

### Excepción: Señales del Sistema (PROBE)
Los ítems con `class: "PROBE"` (señales de estado, indicadores de existencia) están **exentos** de la validación de identidad. Son respuestas efímeras y no requieren `handle.ns`, `handle.alias` o `handle.label`.

---

## 2. EL CONCEPTO DE IDENTITY (HANDLE)
El `handle` permite que el sistema sea resiliente al cambio humano.

### Partes del Handle:
*   **LABEL**: El nombre humano (ej: "Inventario VIP"). Es mutable y estético.
*   **ALIAS**: El nombre de máquina (ej: `inventario_vip`). Es **CANÓNICO**. Se genera procesando el Label inicial. Nunca debe cambiar una vez que hay flujos vinculados.
*   **NS (Namespace)**: El dominio de soberanía (ej: `com.indra.pottery`). Evita colisiones entre diferentes satélites.

---

## 3. INVARIANTES DE CLASE (REGLAS DE ORO)

### DATA_SCHEMA & TABULAR
*   **Payload Obligatorio**: Debe contener una propiedad `fields` que sea un `Array`.
*   **Axioma**: Un esquema sin campos es un vacío existencial y será rechazado.

### BRIDGE
*   **Payload Obligatorio**: Debe contener una propiedad `operators` que sea un `Array`.
*   **Axioma**: Un Bridge sin operadores es una cáscara vacía sin capacidad de procesamiento.

### WORKFLOW
*   **Payload Obligatorio**: Debe contener una propiedad `stations` que sea un `Array`.
*   **Axioma**: Cada estación debe tener un `id`, un `type` y una `config`.

---

## 4. CONTRATO DE MEDIOS (ADR-024)
Para el protocolo `MEDIA_RESOLVE`, todos los ítems deben tener un objeto `INDRA_MEDIA` en su payload:

| Propiedad | Valor / Tipo |
| :--- | :--- |
| `type` | `"INDRA_MEDIA"` |
| `canonical_url` | `String` (URL de renderizado directo) |
| `storage` | `"drive"` \| `"notion"` \| `"url"` \| `"opfs"` |

---

## 5. RESONANCIA RELACIONAL
Las actualizaciones de contratos son **Transaccionales**:
1.  **Cambio en JS**: Se modifica el código de validación o el `indra_contract.json`.
2.  **Cambio en DOC**: Se actualiza este archivo `SYSTEM_CORE_DATA_CONTRACTS.md`.
3.  **Reflejo en AI**: Antigravity lee el cambio y ajusta su escritura de partituras.

**Falla en cualquiera de los 3 puntos de contrato json rompe la Soberanía del Satélite.**
