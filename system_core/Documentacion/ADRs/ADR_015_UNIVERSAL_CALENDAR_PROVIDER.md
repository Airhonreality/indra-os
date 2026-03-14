# ADR_015 — UNIVERSAL_CALENDAR_PROVIDER: Gestión Multidimensional de Eventos

> **Versión:** 1.0 (Borrador de Arquitectura)
> **Estado:** PROPUESTO
> **Alcance:** Integración de silos de calendarios externos y gestión unificada en el Core de Indra.

---

## 1. CONTEXTO Y PROPÓSITO

El usuario moderno opera en múltiples dimensiones temporales y silos de datos (Google, Outlook, Trello, DBs externas). La fragmentación de estas interfaces genera un "Cognitive Load" prohibitivo, obligando al usuario a saltar entre aplicaciones y paradigmas visuales.

Este ADR define el **Universal Calendar Provider (UCP)**, un motor capaz de aterrizar APIs de múltiples calendarios en un único punto de administración. El objetivo es permitir la gestión masiva, la ruptura de silos ("Multi-reality") y el mantenimiento de una identidad clara sin sacrificar la eficiencia operativa.

---

## 2. AXIOMAS DE DISEÑO OPERATIVO

1.  **Agnosticismo Estético (No Magic Shell):** El sistema **no** adopta los colores ni la estética del proveedor. El usuario interactúa con un **Átomo de Calendario Canónico**, diseñado para ser cognitivamente superior y funcionalmente simple.
2.  **Identidad de Cabecera:** La procedencia del dato se comunica de forma sincera mediante el header del componente (Sensing Identity) y metadatos explícitos.
3.  **Sinceridad de Identidad (§ADR-001):** El ID del átomo es el ID nativo del proveedor. En modo unificado, se utiliza el prefijo de cuenta para evitar colisiones: `provider:account_id|native_id`.
4.  **Independencia de Silo:** La gestión (crear, editar, mover, eliminar) es idéntica para todos los recursos una vez que son transformados en átomos de Indra.

---

## 3. DEFINICIÓN DEL ÁTOMO CANÓNICO (`CALENDAR_EVENT`)

Todo evento que entra al sistema, sea de un CSV o de la API de Outlook, debe ser normalizado a este contrato JSON:

```json
{
  "id": "google:personal|event_id_123",
  "class": "CALENDAR_EVENT",
  "handle": {
    "ns": "com.indra.calendar.event",
    "alias": "reunion_de_arquitectura",
    "label": "Reunión de Arquitectura"
  },
  "provider": "calendar_universal",
  "protocols": ["ATOM_READ", "ATOM_UPDATE", "ATOM_DELETE", "CALENDAR_BATCH"],
  "payload": {
    "fields": {
      "summary": "Reunión de Arquitectura",
      "description": "Detalle técnico de ADR-015",
      "start": "2026-03-14T10:00:00Z",
      "end": "2026-03-14T11:00:00Z",
      "location": "Virtual / Indra Office",
      "is_all_day": false,
      "attendees": ["ana@indra.ai", "javi@indra.ai"],
      "source_identity": {
        "silo": "google",
        "account": "javi@personal.com",
        "color": null 
      }
    }
  }
}
```

---

## 4. ARQUITECTURA GAS CORE (BACKEND)

El provider se modulariza en la Capa 2 siguiendo el patrón de Indra:

### 4.1. Sub-módulos del Provider
-   **`adapter_google.gs`**: Maneja la autenticación y mapeo nativo de Google Calendar.
-   **`adapter_outlook.gs`**: Maneja la MS Graph API y normalización a Átomo Canónico.
-   **`adapter_tabular.gs`**: Transforma filas de Notion o Google Sheets que contengan fechas en eventos proyectables.

### 4.2. Registro de Capacidades (`CONF_CALENDAR_UNIVERSAL`)
```javascript
function CONF_CALENDAR_UNIVERSAL() {
  return {
    id: 'calendar_universal',
    protocols: ['TABULAR_STREAM', 'ATOM_READ', 'ATOM_CREATE', 'CALENDAR_BATCH'],
    capabilities: {
      ATOM_READ: { sync: 'BLOCKING', purge: 'NONE' },
      CALENDAR_BATCH: { sync: 'ASYNC', purge: 'ALL' }
    }
  };
}
```

---

## 5. ARQUITECTURA FRONTEND (REACT MODULARIZATION)

La UI se ensambla mediante componentes especializados para una experiencia "Semioticamente Cogno-Agentiva":

### 5.1. Jerarquía de Componentes
1.  **`CalendarEngine (Container)`**:
    -   Orquesta la hidratación de datos desde múltiples `context_ids`.
    -   Gestiona el estado de transición entre Modo Átomo y Multi-Reality.
2.  **`ProvisionalView (Projection)`**:
    -   Sub-módulo: **`TimelineGrid`** (Visualización cronológica pura).
    -   Sub-módulo: **`BatchActionsBar`** (Herramientas de gestión masiva sincronizada).
3.  **`EventAtomUI (Leaf)`**:
    -   **Header**: Identidad del Silo (Logo discreto + Nombre de Cuenta).
    -   **Body**: Datos canónicos (Summary, Time, Location).
    -   **Interaction**: Handles de arrastre para reprogramación masiva.

### 5.2. Arquitectura de Ensamblaje
El frontend no conoce la lógica de Google o Outlook. Consume un `TABULAR_STREAM` global. El router de Indra se encarga de que, al mover un evento de la "vía láctea" a la "vía personal", se ejecute un protocolo de `MIGRATION` o simultáneamente un `ATOM_DELETE` en origen y `ATOM_CREATE` en destino.

---

## 6. LA LEY DE ADUANA EN EL CALENDARIO

Para garantizar la integridad, el UCP aplica la **Ley de Aduana (ADR-008)**:
-   **Validación de Identidad:** No se permite la entrada de eventos que no tengan un `iCalUID` o equivalente verificable.
-   **Sinceridad Semántica:** Si un evento se marca como "Completado" en Indra y el silo origen no soporta ese estado, Indra persiste el estado en un **Metadata Shadow** vinculado al ID nativo hasta la próxima sincronización.

---

> **Diseño Final:** Una herramienta de gestión multidimensional que rompe las barreras de los entornos cerrados, permitiendo que el usuario "saque eventos, combine con esquemas y organice en múltiples vistas" sin perder la propiedad del dato ni la claridad de la cuenta.
