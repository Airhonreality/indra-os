# ConnectionHandler (Logic) - Design Blueprint (V3)

> **Estado:** 🚧 PENDIENTE DE IMPLEMENTACIÓN (Post-Purge)
> **Propósito Técnico:** Gestionar la máquina de estados de creación de conexiones y el cálculo de proximidad (Snapping).

## 1. Alcance Técnico
- **Responsabilidad:** Detectar la intención de conexión y validar puertos compatibles.
- **Fronteras:**
  - **Controla:** Estado del cable fantasma (`previewWire`), Snapping magnético.
  - **Ignora:** El renderizado físico de las líneas (delegado al `CableLayer`).

## 2. Invariantes
- **Atracción Magnética:** `DIST(Cursor, Port) < 30px ⇒ SNAP_TO(Port)`.
- **Polaridad Estricta:** Las conexiones deben respetar el sentido del flujo de datos (Output -> Input).
- **Consistencia de Acción:** El `DROP` en un puerto válido debe persistir la conexión en el `TopologyStore`.

## 3. Anti-Patrones
- **Lógica Difusa:** El snapping es determinístico.
- **Listeners Huérfanos:** Los eventos de arrastre deben limpiarse inmediatamente al soltar el ratón.
- **Reuso Genérico:** Este handler es exclusivo para topología; no debe usarse para otros tipos de Drag & Drop.
