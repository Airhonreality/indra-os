# Protocolo de Arquitectura V9.0: Matriz de Proyección Soberana

**Status:** VIGENTE  
**Versión:** 9.0 (The Great Decoupling)  
**Fecha:** 2026-02-05  

## 1. Visión General: El Fin del Monolito
La arquitectura V9.0 marca la transición de un sistema monolítico reactivo (donde el Store y los Componentes sabían "demasiado") a una **Arquitectura Polimórfica Pura**. En este modelo, ningún componente del frontend discrimina lógica basada en la identidad del proveedor de datos (Drive, Notion, Email, etc.). El sistema opera mediante contratos abstractos.

## 2. La Matriz de Responsabilidades (TGS Layering)

Esta matriz define estrictamente dónde vive cada decisión del sistema. Violar esta matriz conlleva deuda técnica inmediata.

| Capa | Artefacto Responsable | Lógica de Decisión (Responsabilidad Única) | Nivel Axiomático |
| :--- | :--- | :--- | :--- |
| **IDENTIDAD** | `SystemAssembler.gs` (Backend) | **¿QUIÉN ERES?** Inyecta el `CANON` (Arquetipos, Dominios, Capacidades) y decora el nodo antes de que llegue al Front. | L0 (Ley) |
| **TRANSPORTE** | `Sovereign_Adapter.js` | **¿CÓMO LLEGA?** Puente agnóstico que mueve bits entre el Backend (L2) y el Frontend (L1) usando `executeAction`. No mira el contenido. | L1 (Enlace) |
| **MEMORIA** | `AxiomaticStore.jsx` | **¿DÓNDE SE GUARDA?** Almacén pasivo. Guarda los bits en un slot `[nodeId]`. **No entiende los bits.** Es un espejo ciego del backend. | L2 (Estado) |
| **INTELIGENCIA** | `PersistenceManager.jsx` | **¿CUÁNDO ACTUALIZAR?** El Sistema Nervioso. Decide si el dato es viejo (TTL) y cómo ejecutar el fetch universal si hace falta. | L3 (Gestión) |
| **FORMA** | `Archetype_Registry.js` | **¿CÓMO SE VE?** El Sastre. Decide qué motor (UI) asignar al dato basándose *únicamente* en su `ARCHETYPE` (ej: 'VAULT' -> `VaultEngine`). | L4 (Forma) |
| **REALIDAD** | `Projector` / `Engines` | **¿QUÉ HACE?** La Manifestación. Renderiza la interfaz y las interacciones basándose en las `CAPABILITIES` declaradas en el `CANON`. | L5 (Acción) |

---

## 3. Flujo de Activación Polimórfica

1.  **Ignición (Backend):** El `SystemAssembler` crea el nodo `notion` y le inyecta `ARCHETYPE: "VAULT"` y `CAPABILITIES: { search: ... }`.
2.  **Transporte (Bridge):** El Frontend recibe el nodo. El `AxiomaticStore` no sabe qué es, pero ve que tiene ID `notion`. Crea un slot `silos['notion']`.
3.  **Proyección (UI):** El usuario selecciona el nodo.
    *   `ComponentProjector` lee `ARCHETYPE: "VAULT"`.
    *   Consulta `Archetype_Registry`.
    *   Instancia `VaultEngine`.
4.  **Hidratación (Data):**
    *   `VaultEngine` se monta. Pide datos para `nodeId: 'notion'`.
    *   `PersistenceManager` verifica caché. Si está vacío -> Llama a `Sovereign_Adapter.executeAction('notion:listContents')`.
    *   Backend responde.
    *   Store guarda en `silos['notion']`.
    *   UI se actualiza.

---

## 4. Componentes Deprecados y Purga
Con la implementación de la V9.0, los siguientes artefactos han quedado obsoletos por duplicidad funcional o violación de axiomas:

*   **`LevelLoader.js`**:
    *   *Razón:* Su lógica de carga por niveles ha sido absorbida por la granularidad del `PersistenceManager`. Mantenía un caché paralelo innecesario.
    *   *Acción:* **ELIMINAR**.
*   **`LayoutHydrator.js`**:
    *   *Razón:* Lógica de hidratación legacy. El `AxiomaticStore` ahora hidrata el layout directamente desde el payload del Cosmos.
    *   *Acción:* **ELIMINAR**.
*   **Lógica `if (id === 'drive')` en `VaultEngine`**:
    *   *Razón:* Violación del principio polimórfico.
    *   *Acción:* **PURGADA** (Ya ejecutado en refactor Steps 2061-2067).

---

## 5. Guía de Extensión (Cómo añadir un nuevo Adapter)

Para añadir un nuevo servicio (ej. **Dropbox**) en V9.0, **NO SE TOCA CÓDIGO DEL FRONTEND**.

1.  **Backend:** Crear `DropboxAdapter.gs`. Definir `CANON` con `ARCHETYPE: "VAULT"` y `CAPABILITIES`.
2.  **Backend:** Registrar en `SystemAssembler.gs`.
3.  **Frontend:** **NADA**. El sistema lo descubrirá, le asignará el `VaultEngine` y funcionará automáticamente.





