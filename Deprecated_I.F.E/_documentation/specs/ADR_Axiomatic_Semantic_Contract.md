# ADR: Axiomatic & Semantic Contract Standard (v4 Singularity)

## Status: ACCEPTED / CANONICAL
## Date: 2026-01-16

## 1. Context
The INDRA Front (Skeleton Console) requires a high-fidelity interaction model with the Orbital Core. To achieve a "Tony Stark UI" (highly dynamic, self-describing, and visually intelligent), the UI must not only know *what* data it is receiving, but *how* that data behaves and how it should be projected in the user's workspace.

## 2. Decision
Establish the **v4 I/O Contract Enrichment Spec** as the unique truth for UI projection. This standard mandates that every module in the Core exposes a semantic "Passport" that the Front interprets to auto-generate the interface.

### Key Pillars:
- **Semantic Roles:** Each data field has a `role` (fingerprint, status, collection, etc.), allowing the Front to choose the correct widget (Radar vs. Grid).
- **Kinetic Hints:** `motion` and `visual_intent` tokens guide animations and thematic styling (e.g., `pulse` for critical sensors).
- **Local Reactivity (`triggers`):** The Front executes field-level logic (refresh, invalidate) based on Contract rules without server round-trips.
- **Persistence Strategy:** The Front manages field memory (`session` vs `volatile`) based on the module's declaration.
- **Thresholds:** The Front applies visual alerts (warning/critical) based on defined data ranges.

## 3. Architecture for "Hybrid Adapters" (The Future)
This contract enables **Hybrid Modules** (like RenderVector.Pro) where:
- The **Core** provides the data and high-level logic.
- The **Front** takes responsibility for the high-performance execution (e.g., 3D Canvas, Vector Diagramming).
- The **Contract** acts as the bridge that synchronizes inputs, outputs, and the "Logic Fragments" that the Front must execute.

## 4. Consequences
- **Zero-Code UI:** New Core modules appear in the Skeleton Console automatically with full functionality.
- **Axiomatic Integrity:** The `ContractGatekeeper` in the Core ensures the Front always receives valid, projected data.
- **Simplified Front-end:** The Front no longer contains hardcoded business logic; it becomes a pure interpretation engine of the Core's semantic intent.

## 5. Axiomatic Lesson
> "The interface is not a separate application; it is the visual skin of the system's logic. By unifying them through a semantic contract, we eliminate the gap between the brain and the senses."
