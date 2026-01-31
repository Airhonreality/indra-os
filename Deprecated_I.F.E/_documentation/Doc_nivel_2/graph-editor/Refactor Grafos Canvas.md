# Canvas Architecture: Technical Specification (V3)
> **Target:** `src/presentation/canvas` | **Status:** Blueprints Only

## 1. Matrix of Independence [FR] x [DP]
| FR (Requirement) | DP1 (Surface) | DP2 (NodeLayer) | DP3 (CableLayer) | DP4 (ConnectionHandler) | Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **FR1: Spatial Orchestration** | **X** | 0 | 0 | 0 | ✅ Decoupled |
| **FR2: Node Interactivity** | 0 | **X** | 0 | 0 | ✅ Decoupled |
| **FR3: Connection Rendering** | 0 | ~ | **X** | ~ | ⚠️ Unified Context |
| **FR4: Wiring Logic** | 0 | 0 | 0 | **X** | ✅ Decoupled |

> **Note:** `CableLayer` and `ConnectionHandler` share coordinate logic. Both must utilize the generic `MathUtils` as the single source of truth.

---

## 2. Axioms of Projection (UI)

### Axiom 1: Atomic Rendering
**"Render only what changes."**
- **DOM Layer (`NodeLayer`)**: Handles interactivity and semantic widgets.
  - *Optimization*: Viewport Culling based on `viewBox` bounds.
- **Canvas Layer (`CableLayer`)**: Handles high-frequency vector drawing for connections.
  - *Optimization*: Single `requestAnimationFrame` loop synced with `TopologyStore`.

### Axiom 2: Unified Coordinate System
**"One logical space: The World Space."**
- **World Space**: Logical positioning of nodes in the store.
- **Screen Space**: Physical pixels in the viewport.
- **Conversions**:
  - `WorldToScreen = Offset + WorldCoord * Zoom`
  - `ScreenToWorld = (ScreenCoord - Offset) / Zoom`

### Axiom 3: Level of Detail (LOD)
- **LOD 0 (High Zoom)**: Full widgets and semantic roles visible.
- **LOD 1 (Medium Zoom)**: Hide widgets, show labels and ports.
- **LOD 2 (Low Zoom)**: Abstract representation (geometry blocks).

---

## 3. Component Synchronization

### A. Projection Surface
Orchestrates `zoom` and `pan` and propagates to all sub-layers.

### B. Node Layer
Filters `topology` by visibility and instantiates `NodeProjection` components.

### C. Cable Layer
Draws Bézier paths between ports. Synchronized with the `ConnectionHandler` for real-time feedback.

---

## 4. Anti-Patrones
1.  **Legacy Imports**: Forbidden.
2.  **CSS Scale**: Do NOT scale the main container; use coordinate transformation for precision.
3.  **Coordinate Schizophrenia**: Always use `SessionStore` as the source for `zoom/pan`.
