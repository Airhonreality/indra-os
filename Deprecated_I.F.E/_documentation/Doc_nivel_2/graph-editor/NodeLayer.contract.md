# NodeLayer (Presentation) - Design Blueprint (V3)

> **Estado:** 🚧 PENDIENTE DE IMPLEMENTACIÓN (Post-Purge)
> **Propósito Técnico:** Proyectar el estado abstracto de la topología en elementos interactivos optimizados.

## 1. Alcance Técnico
- **Responsabilidad:** Renderizar los contenedores de nodos y orquestar sus widgets internos.
- **Fronteras:**
  - **Controla:** Posición absoluta (x,y), Transformaciones CSS (zoom), Culling de visibilidad.
  - **Ignora:** Dibujo de cables (delegado al `CableLayer`).
- **Restricciones:**
  - 🚫 Prohibido el redibujado de nodos fuera del Viewport (+Buffer de seguridad).
  - 🚫 Prohibida la mutación directa del estado global desde este componente.

## 2. Invariantes
- **AXIOMA #1:** `POS_SCREEN(node) = OFFSET + POS_WORLD(node) * ZOOM`.
- **AXIOMA #2:** Todo nodo debe ser una instancia huérfana de lógica de negocio (solo proyecciones).

## 3. Anti-Patrones
- **CSS Dinámico en Runtime:** Prohibido inyectar estilos calculados (salvo `transform`).
- **Re-render Global:** El movimiento del ratón no debe disparar re-renders en React; debe delegarse a la capa de Proyección.
