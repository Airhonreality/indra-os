---
title: ADR-013: State Sovereignty & Ghost Protocol
status: ACCEPTED
date: 2026-02-12
author: Antigravity Agent
context: |
  The DevLab module ("Engineering Console") exhibited inconsistent behavior when switching between "Live Mode" (Real Data) and "Mock Mode" (Simulated Data).
  
  The logic was fragmented:
  - Live Mode read from `state.phenotype.artifacts`.
  - Mock Mode ignored the state and read from static JSON files (`MOCK_GENOTYPE`).
  
  This created a "schizophrenic" architecture where data injection into the state (e.g., dynamic prototypes) was ignored by DevLab if Mock Mode was active. It also prevented the mixing of Real and Simulated artifacts in the same session.

decision: |
  We established the **Principle of State Sovereignty**:
  1. The Application State (`state.phenotype`) is the Single Source of Truth for all UI components, including DevLab.
  2. UI Components must NEVER contain logic to switch data sources based on flags like `isMockEnabled`. They simply render what is in the State.

  To support Simulation/Mocking without breaking Sovereignty, we implemented the **Ghost Protocol**:
  1. **Injection**: Mock/Prototype artifacts are injected directly into the Live State with specific flags: `_isGhost: true` or `_isMock: true`.
  2. **Rendering**: Since Ghosts exist in the State, DevLab renders them naturally without special logic.
  3. **Containment**: The Persistence Layer (`SyncOrchestrator`) explicitly filters out any artifact marked as `_isGhost` or `_isMock` before saving to the database or local storage.

consequences: |
  **Positive**:
  - **Unified Logic**: DevLab code is simplified; it only knows how to render State artifacts.
  - **Dynamic Injection**: We can now inject any kind of simulated data (Ghosts) at runtime without changing UI code.
  - **Hybrid Sessions**: Users can have Real Nodes and Ghost Nodes coexisting in the same graph for testing integrations.
  
  **Negative**:
  - **Risk of Leakage**: If the Persistence Layer filter fails, "fake" data could contaminate the production database. (Mitigated by strict filtering in `SyncOrchestrator`).

compliance: |
  - `DevLab/index.jsx` MUST only query `state.phenotype.artifacts`.
  - `AxiomaticStore` MUST handle `INJECT_PHANTOM_ARTIFACT` to create Ghosts.
  - `SyncOrchestrator` MUST filter `_isGhost` and `_isMock` before `prepareSnapshot`.
---
