# ProjectionSurface (UI) - Design Blueprint (V3)

> **Estado:** 🚧 PENDIENTE DE IMPLEMENTACIÓN (Post-Purge)
> **Propósito Técnico:** Proveer el contenedor espacial y los límites lógicos para la visualización de la topología.

## 1. Alcance Técnico
- **Responsabilidad:** Orquestar las capas de proyección (`NodeLayer`, `CableLayer`) y gestionar eventos globales del lienzo.
- **Fronteras:**
  - **Controla:** Instanciación de capas, Eventos de interacción global (Pan, Zoom, Drop).
  - **Ignora:** Geometría interna de los cables, rendering individual de nodos.

## 2. Invariantes Espaciales
- **Propagación de Contexto:** `zoom` y `pan` se inyectan a todas las capas hijas desde el `SessionStore`.
- **Estática Estructural:** El contenedor no tiene ciclo de renderizado propio; es una superficie pasiva para sus hijos.

## 3. Comportamiento Esperado
- **Input Transformation:** 
  - `Wheel/Pinch` → `Session.zoom`
  - `Drag Background` → `Session.pan`
- **Orquestación:** Carga diferida de capas basada en la disponibilidad del `TopologyStore`.

## 4. Anti-Patrones
- **Iteración Directa en el Padre:** El contenedor no debe mapear los nodos directamente; cada capa gestiona su suscripción al store para evitar cuellos de botella.
- **Manipulación Manual del DOM:** Prohibido el uso de `refs` para alterar nodos individuales.
