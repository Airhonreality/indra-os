# INDRA UI AXIOMS: SATELLITE DESIGN SYSTEM (v17.5)
> **Sovereign Directive**: These rules govern the materialization of any visual interface within the Indra ecosystem. Non-compliance results in structural entropy.

## 1. THE MOBILE-FIRST DOCTRINE
The satellite must be designed starting from the smallest screen (Atomic Level) and expanded through media queries towards larger screens (Molecular/Ecosystem Level).
- **Correct**: Base styles for mobile, `@media (min-width: 768px)` for tablets/desktop.
- **Forbidden**: Writing desktop styles and then using `max-width` to "fix" it for mobile.

## 2. AXIOM OF RELATIVITY (UNITS)
Hardcoded pixels (`px`) are static and dead. The satellite lives in a liquid state.
- **Layout**: Use percentage (`%`), Viewport Width (`vw`), and Viewport Height (`vh`).
- **Typography & Spacing**: Use `rem` for accessibility and `clamp(min, preferred, max)` for fluid scaling.
- **Exceptions**: `1px` or `2px` for subtle borders are allowed.

## 3. SOVEREIGN AUTO-LAYOUT
No element shall orbit the DOM without a governing structure.
- **Principal Systems**: CSS Grid (for 2D grids) and Flexbox (for 1D alignments).
- **Prohibited**: `position: absolute` or `float` for general layout. Absolute positioning is only for ephemeral overlaps (Modals, Tooltips) or specific decorative icons.

## 4. CANONICAL HTML ANATOMY (HEADER INJECTION)
The `<head>` is the ingestion portal. Scripts must be cited in this exact order to ensure resonance:

1. **Identity**: `indra_config.js` and `satellite.manifest.json`.
2. **Infrastructure**: `_INDRA_PROTOCOL_/indra_hub.js`.
3. **Materia (Schemas)**: All domain-specific schema files.
4. **Resonance (Logic)**: `app_state.js` and `app.js`.
5. **Aesthetics**: Global and Local CSS.

```html
<head>
    <script type="module" src="./indra_config.js"></script>
    <script type="module" src="./_INDRA_PROTOCOL_/indra_hub.js"></script>
    <!-- Explicit Schema Imports -->
    <script type="module" src="./src/score/schemas/OrderSchema.js"></script>
    <!-- Logic & State -->
    <script type="module" src="./src/score/app_state.js"></script>
    <script type="module" src="./src/app.js"></script>
    <script type="module" src="./src/app.js"></script>
</head>
```

### 4.2. ANATOMÍA DE PRODUCCIÓN (Portal Silencioso)
Para el `app.html`, los scripts se reducen a lo esencial para minimizar la latencia:
1. **Identidad**: `indra_identity.js`.
2. **Puente**: `_INDRA_PROTOCOL_/core/IndraBridge.js`.
3. **Núcleo**: `_INDRA_PROTOCOL_/core/IndraKernel.js`.
4. **App**: `src/app.js`.

**Prohibición**: En producción, está prohibido cargar `indra_hub.js`, ya que esto forzaría la inyección del HUD de desarrollo.

## 5. DESIGN SYSTEM & CSS VARIABLES
Values like colors, border-radii, and shadows must not be hardcoded in local files.
- Use the variables provided by `IndraBridgeHUD.css`.
- If custom variables are needed, define them in a `:root` block in `src/styles/index.css`.
- Aim for **Glassmorphism** and **Dynamic Depth** using `backdrop-filter: blur()`.

## 6. REACTIVE MATERIALIZATION
The UI does not "ask" for data; it "reacts" to the state.
- Components must subscribe to the `appState`.
- Use `data-resonance` attributes to provide visual feedback during network pulses.
- Avoid manual DOM manipulation outside the Kernel's component lifecycle.

---
*Axioma Indra: "La belleza es la ausencia de tensión entre el dato y su reflejo".* 🛰️🏛️💎🔥
