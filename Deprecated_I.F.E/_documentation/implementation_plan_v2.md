# INDRA Core Stabilization & Pure Engineering Console Plan

This plan follows the **Axiom of Purity**: Only the discovered contracts should define the console's behavior. specialized UIs are removed to prevent redundancy with the core's auto-morphic capabilities.

## 1. Resilience & Stability (Backend)
- [x] **TokenManager**: Prevent crashes on null token saves.
- [x] **Configurator**: Guard `getConfigurationStatus` against invalid types.
- [x] **PublicAPI**: Standardize `invoke` error handling for empty flow IDs.

## 2. Advanced Diagnostic (Health Scanner)
- [x] **Metabolic Flows**: Refactor the "Health Check" to test data continuity. [COMPLETED]
- [x] **Protocol Consistency**: Updated `flows` test to use `listFlows -> getFlow` chain. [NEW]

## 3. Pure Skeleton Console Refactor
- [x] **Tab-Based Navigation**: Moved to a pure tabbed interface (TERMINAL, REGISTRY).
- [x] **Sidebar Elimination**: Removed redundant sidebars to achieve 100% minimalist skeleton.
- [x] **System Registry**: Created a new explorer for core JSON artifacts (.flow.json, .project.json, etc.).
- [x] **Contract Consolidation**: Integrated contract exploration directly into the Terminal view.

## 4. Final Verification
- [ ] Run **"RUN FULL DIAGNOSTIC"** in the Skeleton Console.
- [ ] Verify that the `flows` test now passes using the metabolic chain.
- [ ] Explore the **REGISTRY** tab to verify visibility of system JSONs.
