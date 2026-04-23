# DATA CONTRACTS : LA GRAMÁTICA DE LA MATERIA (v15.0-INDUSTRIAL)

Este documento define la estructura atómica de Indra v15.0. Cualquier desviación será rechazada por el **Protocol Router** del Core como "Materia Oscura".

---

## 1. EL ÁTOMO UNIVERSAL
Todo dato que viaja por la malla debe ser un objeto con los siguientes campos obligatorios:

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `String` | ID físico inmutable (ej: Drive ID, Notion ID). |
| `handle` | `Object` | El "DNI" del átomo (Label, Alias, Namespace). |
| `class` | `String` | La "clase" o tipo de materia (ej: `DATA_SCHEMA`, `WORKSPACE`). |
| `payload` | `Object` | El contenido o "valor" del átomo. |
| `relations` | `Array` | **[NEW v4.0]** Array de flechas relacionales (ver sección 5). |
| `protocols` | `Array` | Lista de acciones que este átomo sabe ejecutar. |

---

## 2. EL TEJIDO RELACIONAL (FLECHAS)
Una relación es un ciudadano de primera clase que describe un vínculo entre dos átomos.

### Estructura de una Flecha:
```json
{
  "source_gid": "ID_ORIGEN",
  "target_gid": "ID_DESTINO",
  "type": "MEMBER_OF | LINKED_TO | EXECUTES_ON",
  "meta": { "label": "Nombre del vínculo", "strength": 0.8 },
  "timestamp": "ISO-8601"
}
```

### Protocolo `RELATION_SYNC`:
Sincroniza un vínculo en el Ledger Relacional del contexto actual.
*   **Input (UQO)**: Un objeto con el par `source` / `target` y el tipo de relación.
*   **Efecto**: Inmortaliza la flecha en la tabla `RELATIONS` del sistema.

---

## 3. IDENTIDAD Y SOBERANÍA (HANDLE)
El `handle` permite que el sistema sea resiliente al cambio humano.
*   **LABEL**: Nombre humano (mutable).
*   **ALIAS**: Nombre de máquina (**CANÓNICO**).
*   **NS (Namespace)**: Dominio de jurisdicción.

---

## 4. CONTRATO DE ACCESO JIT (JUST-IN-TIME)
Indra v6.1 opera bajo el principio de **Privilegio Mínimo**.
*   **Handshake JIT**: Los satélites solicitan acceso mediante un `context_id`.
*   **Apertura de Puerto**: El Core abre una montura efímera hacia el Ledger de la célula solicitada si el token tiene los `scopes` necesarios.

---

## 5. INVARIANTES DE CLASE
*   **DATA_SCHEMA**: Requiere `payload.fields` (Array).
*   **BRIDGE**: Requiere `payload.operators` (Array).
*   **WORKFLOW**: Requiere `payload.stations` (Array).

---

## 6. CONTRATO DE MEDIOS (ADR-024)
Todos los ítems de media deben incluir el objeto `INDRA_MEDIA`:
*   `type`: "INDRA_MEDIA"
*   `canonical_url`: URL de renderizado.
*   `storage`: drive | notion | url | opfs.

---

## 7. CONTRATO DE IDENTIDAD (KEYCHAIN - ADR-041)
Las llaves en el `keychain_service.gs` definen la jurisdicción.
*   `MASTER`: Acceso total al Núcleo.
*   `SCOPED`: Acceso restringido a `context_id` específicos.

---

## 8. SINCERIDAD DOCUMENTAL
Cualquier actualización en la lógica de contratos **json** rompe la Soberanía del Satélite si no se refleja inmediatamente en este manual.

---
⚡🌞 **Indra OS: La Malla es el Mensaje.** 🌞⚡
