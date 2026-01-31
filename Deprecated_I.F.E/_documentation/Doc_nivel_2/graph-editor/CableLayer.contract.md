# CableLayer (Projection) - Design Blueprint (V3)

> **Estado:** 🚧 PENDIENTE DE IMPLEMENTACIÓN (Post-Purge)
> **Propósito Técnico:** Renderizar conexiones vectoriales (Bézier) a 60fps dentro del `ProjectionKernel`.

## 1. Alcance Técnico
- **Responsabilidad:** Dibujar trayectorias de datos entre puertos en el Canvas de Interacción.
- **Fronteras:**
  - **Controla:** Ciclo de redibujado via `requestAnimationFrame` (Dirty Flag).
  - **Ignora:** Lógica de conexión (delegada al `ConnectionHandler`).
- **Restricciones de Performance:**
  - 🚫 Prohibido el uso de elementos DOM para cables.
  - 🚫 Cálculos geométricos optimizados `O(N)` mediante culling del viewport.

## 2. Especificación General
- **Geometría:** Curvas Bézier Cúbicas. Puntos de control automáticos.
- **Feedback:** Implementación de `PreviewWire` para el estado de arrastre.
- **Sincronización:** Transformaciones espaciales dictadas por el `SessionStore`.

## 3. Invariantes
- **AXIOMA #1:** `CONNECTOR_START ≡ PORT_POS`.
- **AXIOMA #2:** El renderizado debe estar desacoplado del ciclo de reconciliación de React.

## 4. Anti-Patrones
- **Estado por Cable:** Prohibido. El dibujo se basa en el stream del `TopologyStore`.
- **Lógica en el Render:** Los cables son mudos; no validan tipos ni estados.
