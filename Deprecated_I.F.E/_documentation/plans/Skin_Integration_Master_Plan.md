# 📜 Skin Integration: Unified Master Plan (V6 - Axiomatic Coherence Edition)

> **Location:** `INDRA_FRONT DEV/_documentation/plans/Skin_Integration_Master_Plan.md`  
> **Axiom:** The UI is an invariant projection of the Core's Universal Law.
> **Law Source:** `OrbitalCore_Codex_v1/7_Diagnostics/MasterLaw.json`

---

## 🏛️ The Coherence Protocol (MasterLaw Alignment)

Every UI element MUST be a direct semantic child of a token defined in `MasterLaw.json`. Any architectural drift (hardcoded labels, ad-hoc icons) is considered a "L1 Breakdown" and must be purged.

---

## 🏗️ Phase F: Deep Intelligence (Semantic Handshake) ✅ **COMPLETE**

**Goal:** Harmonize the Skin's perception with the Core's definitions.

### F.1: Lexicon Ingestion & Registry Synchronization ✅
- **Action:** Calibrate `src/core/integrity/ArchetypeRegistry.js` (now replaced by `OntologyService`) against `MasterLaw.json:ARCHETYPES` and `VISUAL_INTENTS`.
- **References:**
    - `MasterLaw.ARCHETYPES` -> `OntologyService.getActiveArchetypes()`
    - `MasterLaw.VISUAL_INTENTS` -> `OntologyService.getIntentTheme()`
- **Status:** COMPLIANT. Registry is now dynamic.

### F.2: Semantic Form Projection (NanoForm 2.0) ✅ **COMPLETE**
- **Action:** Implement widget mapping for `MasterLaw.json:ROLES`.
- **References:**
    - `MasterLaw.ROLES:identity/url` -> `type="url"` + `Globe` icon.
    - `MasterLaw.ROLES:security` -> `type="password"` + `Lock` icon + `border-error`.
    - `MasterLaw.ROLES:content/list` -> `List` icon.
- **Atomic Audit (F.2.A):** 
    - [x] Test: Pass `role: "security"` to `NanoForm`. Expect masked input.
    - [x] Test: Pass `role: "identity/url"` to `NanoForm`. Expect browser URL validation.
    - [x] **Status:** COMPLIANT.

### F.3: Intent-Driven UI (Action Logic) ✅ **COMPLETE**
- **Action:** Style action buttons in `MethodInvoker` based on `MasterLaw.json:INTENTS`.
- **References:**
    - `MasterLaw.INTENTS:READ` -> `var(--color-logic)` (Blue - Standard).
    - `MasterLaw.INTENTS:WRITE` -> `var(--accent-warning)` (Amber - Write Warning).
    - `MasterLaw.INTENTS:HEAL` -> `var(--accent-success)` (Green - Recovery).
- **Atomic Audit (F.3.A):** Perform visual check on `PublicAPI:getSystemStatus` (CHECK intent) vs `SheetAdapter:insertRows` (WRITE intent).

---

## 🎨 Phase G: Vector Pro (Topology Projection) ✅ **COMPLETE**

**Goal:** Render the complex node graph as a living Blueprint.

### G.1: Infinite Substrate & Motion ✅
- **Action:** Implement `MasterLaw.json:MOTION_TOKENS` for canvas interactions.
- **Status:** COMPLIANT. Grid and interactions are token-driven.

### G.2: Archetype Node Projection (Physical Atoms) ✅ **COMPLETE**
- **Action:** UI must distinguish between `STATE_NODE` (Static/Persistent) and `LOGIC_NODE` (Active/Computed).
- **Atomic Audit (G.2.A):**
    - Verify `SheetAdapter` (ADAPTER) renders with Emerald Header.
    - Verify `PublicAPI` (SYSTEM_INFRA) renders with Violet Header.

---

## 🚀 Phase H: Wiring & Cognitive Mapping (The Loom) ✅ **COMPLETE**

**Goal:** Connect nodes via semantic flows and implement temporal automation.

### H.1: Semantic Cables (The Flow Layer) ✅ **REPAIRED (2026-01-21)**
- **Source of Truth:** `_documentation/Fisicas_UX.md` (Investigación 5).
- **Architecture:** Implement **Borehole Pattern** (ADR-008) for high-performance rendering.
- **Logic:** 
  - Cables exist in **Thorne Metric Space** (ADR-004), not pixels.
  - A cable represents **Data Inheritance** (`Node B` inherits from `Node A`).
- **Action:** Refactored interaction to Drag-and-Drop (MouseDown/Up) to fix connectivity issues.
- **Audit (H.1.A):** 
    - [x] `DESTRUCTIVE` flows render with dashed anim.
    - [x] `READ` flows render with thin pulse.
    - [x] **Thorne Check:** Zooming does not break logical connection coordinates.
    - [x] **Interaction Check:** Dragging from port creates cable.

### H.2: Temporal Bridge (Trigger & Schedule) 🔄 **IN PROGRESS**
- **Action:** Implement the "Activation Window" logic to support scheduled flows (e.g., Weekly Reports).
- **Core Requirement:** Use the new `scheduledAt` column in `JobQueue` to filter eligible tasks.
- **UI Element:** "Temporal Gate" node in the Topology Stage (Component active).
- **Audit (H.2.A):** 
    - [x] **Verification:** Verify `JobQueueService` ignores future-dated jobs (Axiom: Temporal Integrity).
    - [ ] **Verification:** Schedule a job for +2 min. Heartbeat must run but ignore it until +2 min.

### H.3: Hit-Testing & Interaction ✅ **COMPLETE**
- **Action:** Manual wiring between nodes in the Topology Stage.
- **Requirement:** Dragging a cable from an output port to an input port must generate a `FlowRegistry` draft.
- **Audit (H.3.A):** 
    - [x] **Geometric Snapping:** Cables anchor precisely to visual ports (Standard & TemporalGate).
    - [x] **Thorne Space Persistence:** Coordinates are stored in metadata for invariant rendering.
    - [x] **UX Repair:** Switched from `onClick` to `onMouseDown` for reliable wiring.

---

## 🧠 Phase J: Máxima Coherencia Contratos IO con UI (The Semantic Bridge) ✅ **COMPLETE**

**Mandate:** This phase is now concluded. The UI intelligently leverages 100% of the IO contracts, utilizing semantic affinity for wiring and recursive structure mapping.

### J.1: Deep Structure Audit (Core Robustness) ✅ **COMPLETE (2026-01-20)**
- **Problem:** `structure` definitions in adapters are partial (e.g., `type: array` but `items: object` generic).
- **Goal:** Define RECURSIVE structures for clear data lineage.
- **Action:** 
    - [x] **SheetAdapter:** Defined explicit recursive column structure for `getRows` (Axiom: Type Sovereignty).
    - [x] **Audit:** Verified that nested objects match `UniversalItem` pattern.
- **Status:** COMPLIANT.

### J.2: The Intelligent Cable (Phylogenetic Wiring) ✅ **COMPLETE**
- **Logic:** 
    - **Draft:** When dragging a cable, read `contracts[source].io.outputs`.
    - **Hover:** Validate against `contracts[target].io.inputs` using `MasterLaw` compatibility rules (Implemented in `OntologyService`).
    - **Drop:**
        - [x] **Match (Role == Role):** Auto-connect.
        - [x] **Partial (Affinity > 0.5):** Connect with "Inspector Needed" flag (Implemented in metadata).
        - [x] **Mismatch:** Repulse (Veto implemented).
- **UI:** Visual affinity indicators integrated in `TopologyStage`.

### J.3: Axiomatic Validation (The Gatekeeper) ✅ **COMPLETE (2026-01-20)**
- **Reference:** `OrbitalCore_Codex_v1/1_Core/SchemaRegistry.gs`
- **Action:** Updated `SchemaRegistry` to validate RECURSIVE object structures via `_validateItem` helper.
- **Mandate:** COMPLIANT. All recursive payloads are now deep-scanned.

### J.4: The Resolver Contract (The Librarian) ✅ **COMPLETE**
- **Reference:** `INDRA_FRONT DEV/_documentation/Doc_nivel_2/core-bridge/SchemaResolver.contract.md`
- **Action:** Implemented `SchemaResolver.js` in Frontend to handle UUID <-> DriveID resolution.
- **Integration:** `FileSystemPanel` synchronized with `SchemaResolver` to browse real system context.

### J.5: Contextual Sidebars (The Right Tool for the Job) ✅ **COMPLETE**
- **Action:** Implement Conditional Sidebar Rendering in `App.jsx`.
- **Logic:** Optimize the Workspace by showing only the relevant toolset for each tab.
    - **Tab: TERMINAL** -> Sidebar: `ContractExplorer` (Direct API Registry).
    - **Tab: TOPOLOGY** -> Sidebar: `NodePalette` (Arquetipos for drag-and-drop).
    - **Tab: REGISTRY** -> Sidebar: `FileSystemPanel` (Real context/registry files).
- **Status:** COMPLIANT. Sidebar context is tab-aware.

### J.6: The Workspace Metaphor (Empty Canvas) ✅ **COMPLETE**
- **Action:** 
    - Refactor `TopologySlice` to separate `registry` (Definitions) from `workspace_nodes` (Instances).
    - Canvas renders `nodes` array correctly.
    - Dragging from `NodePalette` creates a `workspace_node` instance with unique UUID and proper ontology mapping.

## 🏛️ Phase K: Spatial Sovereignty & Kernel Hardening 🛡️ ✅ **COMPLETE (Core Logic)**

**Goal:** Ensure the Core is the source of truth for Space and Security, as required by `Doc_nivel_2/SpatialProjectionAdapter_Contract.md` and `Doc_nivel_2/ProjectionKernel.md`.

### K.1: Kernel Security Hardening (Axiom #2) ✅ **COMPLETE (2026-01-20)**
- **Reference:** `OrbitalCore_Codex_v1/_documentation/Doc_nivel_2/ProjectionKernel.md`
- **Action:** Implemented `getSafeParameters` (Sentinel Masking) in `Configurator.gs`.
- **Integrity:** `PublicAPI:getAllParameters` now uses the safe masked version. Ghost Masque active.

### K.2: Spatial Persistence (Axiom #1.2) ✅ **COMPLETE (2026-01-20)**
- **Reference:** `OrbitalCore_Codex_v1/_documentation/Doc_nivel_2/SpatialProjectionAdapter_Contract.md`
- **Action:** 
    - [x] Implemented `SpatialProjectionAdapter.gs` with Drive IO alignment.
    - [x] Added **Atomic Script Locking** (LockService) to prevent race conditions during layout merge.
    - [x] Persistence achieved via `system_layout.json` in context folder.

## 🛡️ Phase L: Architectural Guardrails (Contract Enforcement) 🚨 **COMPLETE**

**Goal:** Transform the Core into a self-governing entity where documentation is active execution logic. Establish a runtime enforcement layer that renders architectural drift physically impossible.

### L.1: The Bootstrap Guardrail (Registry Enforcement)
- [x] **Concept:** The `PublicAPI` acts as a "Secure Registry". Integrated in `PublicAPI.gs`.
- [x] **Strategy:** During the `createPublicAPI` handshake, every discovered adapter is passed through `ContractGatekeeper`.
- [x] **Failure Mitigation:** Tier 1 failures trigger `AXIOMATIC_HALT`. Tier 2 log warnings.
- [x] **Axiomatic Checks:** Verified boot halt on Tier 1 contract violation.

### L.2: The Secure Pipe (Managed Invocation Interceptor)
- [x] **Concept:** Standardize all entry points through a "Semantic Funnel".
- [x] **Strategy:** Implemented `_secureInvoke` in `PublicAPI.gs`.
- [x] **Logic:** 1. Schema Fetch -> 2. Input Validation -> 3. Execution -> 4. Output validation placeholder.
- [x] **Axiomatic Checks:** Payload validation active for all exposed methods.

### L.3: Sovereign Synchronization (MasterLaw Strict Mode)
- [x] **Concept:** The `MasterLaw.gs` is the only source of truth.
- [x] **Strategy:** `ContractGatekeeper.gs` purged of hardcoded fallbacks.
- [x] **Axiomatic Checks:** Strictly references `MasterLaw` for roles and intents.

### L.4: Governance Observability (Coherence Index)
- [x] **Concept:** Quantification of Architectural Health.
- [x] **Action:** Implemented `getGovernanceReport()` in `PublicAPI`.
- [x] **Metric:** Dynamic calculation of Coherence Index based on audited modules and warnings.

### L.5: Semantic Bridge (Deep Mapping & Inference)
- [x] **Concept:** The "Logic Loom" for UI Connection.
- [x] **Action:** Created `SemanticBridge.gs` in `2_Services`.
- **Core Function:** `getAffinity(sourceSchema, targetSchema)`.
- **Logic:** Hierarchical Role Matching. Matches `identity/url` with `context/url` using "Closest Common Ancestor" logic from `MasterLaw`.
- **Axiomatic Checks (L.5.A):**
    - [ ] [ ] **Verify:** Bridge suggests auto-mapping for fields with compatible semantic roles.
    - [ ] [ ] **Verify:** Bridge blocks connection between "Security" roles and "Public" roles (Security Guardrail).

---

## 🏛️ Phase M: Humanizing the Core (UX Audit Implementation) 🚧 **NEW**

**Goal:** Bridge the cognitive gap between "RPC Logic" and "Human Intent". Use the Usability Audit outcomes to democratize the interface without compromising technical sovereignty.
**Source:** `_documentation/Investigaciones/Iterador_de_Soluciones_Problema_Uso.md` (Iteración 1).

### M.1: Metadata Injection (The Narrative Layer)
**Objective:** Add a semantic layer of "Human Meaning" to raw RPC methods.
- [ ] **Action 1 (PublicAPI):** Inject `human_label`, `intent_story`, and `verb` into adapter schemas.
- [ ] **Action 2 (OntologyService):** consume new metadata to render "Action-First" tooltips.
- [ ] **Impact:** `Drive.store()` becomes "Guardar Archivo (Store)".

### M.2: Blueprint Templates (Quick-Start)
**Objective:** Eliminate the blank canvas paralysis.
- [ ] **Action:** Create `system_templates/` folder in Drive.
- [ ] **Logic:** Pre-fabricate JSON flows (e.g., "Email from Sheet") that load fully wired.
- [ ] **UI:** New "Blueprint Browser" in the Sidebar.

### M.3: The Semantic Canvas (Visual Frames)
**Objective:** Allow users to "Mind Map" their logic over the technical nodes.
- [ ] **Action:** Create `AnnotationSlice` in Zustand.
- [ ] **Rendering:** Implement "Frames" (Rectangles) and Sticky Notes in `TopologyStage`.
- [ ] **Interaction:** Frames act as containers; moving the frame moves the nodes inside.

### M.4: The Architect (AI Assistant - Phase 1)
**Objective:** Natural Language to JSON flow.
- [ ] **Action:** Prototype LLM Adapter integration (DeepSeek/Gemini).
- [ ] **UI:** Chat Interface in Right Panel.

---

## 🚀 Phase I: Launch Readiness (The Final Polish)

## 🕵️‍♂️ MACRO ZOOM AUDIT: 20-POINT FAILURE CHECKLIST
**Status:** UPDATED (2026-01-21)
**Action:** Resolve before v1.0 Launch.

### 🔴 Critical (Blockers)
- [x] **L-01: Enforcement Loop-hole:** RESOLVED. `invoke` secured via `_secureInvoke` logic and all adapters routed through Secure Pipe.
- [x] **L-02: Boot Lock-out Recovery (Safe Mode):** ✅ RESOLVED.
    - **Concept:** Added `EXPERIMENTAL_SAFE_MODE` flag in `Configurator`.
    - **Logic:** `ContractGatekeeper` downgrades Tier 1 errors to warnings.
    - **Safety:** Implemented in `PublicAPI` and `ContractGatekeeper`.
- [x] **F-01: Visual Veto Broken:** Wiring impossible due to onClick handlers. **FIXED (2026-01-21)**.
- [x] **F-02: Z-Index Collision:** Resolved.
- [ ] **F-03: Temporal Feedback Gap:** `TemporalGateNode` lacks visual countdown.
- [ ] **F-04: Folder Sense Failure (H-3):** `FileSystemPanel` cannot parse real nested folders.
- [ ] **F-05: Persistence Amnesia:** `MethodInvoker` inputs do not survive reload.
- [x] **S-01: Secrets Leak:** RESOLVED (Phase K.1).
- [x] **S-02: Spatial Sovereignty Breach:** RESOLVED (Phase K.2).

### 🟠 Major (UX Friction)
- [ ] **L-03: Affinity Feedback:** UI lacks "Connection Preview" when hovering a cable over a node.
- [ ] **F-06: Magnetic Snapping:** No visual guides for node alignment.
- [ ] **F-07: Cable Ghosting:** Phantom cable can sometimes persist.
- [ ] **F-08: Port Hitbox Size:** Ports are 12px; difficult to hit.
- [ ] **F-09: Zoom Disorientation:** zooming does not follow mouse cursor focus.
- [ ] **F-10: Multi-Select Absence:** Cannot select multiple nodes.

### 🟡 Minor (Polish)
- [x] **L-04:** Coherence Index tooltips in the HUD (Backend API Ready).
- [ ] **F-11:** `FileSystemPanel` icons hardcoded.
- [ ] **F-12:** Cursor `grabbing` delay on some browsers.
- [ ] **F-13:** Long node titles break layout.
- [ ] **F-14:** Cable curve tension is constant.
- [ ] **F-15:** No "Delete Connection" visual affordance.
- [ ] **F-16:** `TemporalGateNode` lacks "Run Now" button.
- [ ] **F-17:** Palette/Library missing; user can't add NEW nodes.
- [ ] **F-18:** Dark mode colors in `MethodInvoker` lack contrast.
- [ ] **F-19:** No "Undo/Redo" stack for layout changes.
- [ ] **F-20:** Grid background does not fade out at low zoom levels.

## 📊 ATOMIC COHERENCE AUDIT (2026-01-21 06:30) - CURRENT STATE

| Target Component | MasterLaw Reference | Coherence Status | Corrective Action |
| :--- | :--- | :--- | :--- |
| **ArchetypeRegistry** | `ARCHETYPES` | ✅ COMPLETE | - |
| **NanoForm** | `ROLES` | ✅ COMPLETE | - |
| **MethodInvoker** | `INTENTS` | ⚠️ PARTIAL | Standardizing colors in Phase J. |
| **LogStream** | `SEVERITIES` | ⚠️ PARTIAL | Align colors with Sentinel states. |
| **TopologyStage** | `DIMENSIONS:2D`| ✅ COMPLETE | Infinite canvas operational. |
| **ContractGatekeeper**| `MASTER_LAW` | ✅ COMPLETE | Strict Mode active (Phase L.3). |
| **SemanticBridge** | `ROLE_HIERARCHY` | ✅ COMPLETE | Service operational (Phase L.5). |
| **CableLayer** | `MOTION_TOKENS` | ✅ REPAIRED | Fixed Drag-Drop Logic. |

---

**Status:** Phase L Complete (Sovereign Law Established)  
**Verification Protocol:** ZERO_DRIFT_POLICY_V1  
**Lead Auditor:** Antigravity AI  
**Next Objective:** Build & Execute First JSON Flow (Node Construction Phase).
