# 🧠 UI Interpretation & Heuristics Policy

> **Location:** `INDRA_FRONT DEV/_documentation/specs/UI_Interpretation_Policy.md`  
> **Dharma:** Define how the Frontend interprets agnostic contracts without polluting the Core.  
> **Framework:** Axiomatic Design (Suh) & General Systems Theory (TGS).

---

## 🏗️ The Separation Axiom

| Component | Responsibility | Content |
|-----------|----------------|---------|
| **Core (Backend)** | **Functional Logic** | Data types, required flags, semantic roles. |
| **Registry (Bridge)** | **Contract Sovereignty** | The "Source of Truth" for what a method NEEDS. |
| **Interpretor (Frontend)** | **Cognitive Mapping** | Logic for icons, grouping, and interaction patterns. |

---

## 🧩 Interpretation Rules (Heuristics)

### 1. Semantic Mapping (Roles to Visuals)
Instead of forcing icons in the backend, the Frontend maps `type` and `key` to labels and icons.

*   **Rule H-1 (ID Sensing):** Any key ending in `Id` or of type `id` defaults to `role: "fingerprint"`.
*   **Rule H-2 (Security Sensing):** Keys like `token`, `apiKey`, `password` default to `type: "password"` and `role: "credential"`.
*   **Rule H-3 (Folder/File Sensing):** Keys involving `folder` or `file` trigger a search for the `folder` icon mapping.

### 2. Grouping & Layout (The "Group" Meta-tag)
To avoid the "List Tyranny", we use a single `group` tag in the IO contract.

*   **Heuristic:** If more than 3 groups exist, render as **Tabs**.
*   **Heuristic:** If 2-3 groups exist, render as **Collapsible Sections**.
*   **Heuristic:** If no groups exist, render as a single **Atomic Card**.

### 3. The "Recents" Persistence Pattern
The Frontend maintains a local cache of successful executions.

*   **Logic:** `localStorage.getItem('recents_' + methodId + '_' + fieldKey)`
*   **UI Artifact:** Render as small "Chips" below the input.
*   **UX Goal:** One-tap hydration for frequent tasks.

---

## ⚡ Performance: The Batching Strategy

To comply with **TGS Homeostasis**, the UI must not spam the backend.

1.  **Discovery Phase:** The `MethodInvoker` scans the schema for all `dataSource` entries.
2.  **Consolidation:** It requests all required data in a single multi-call (if supported) or parallelizes them with a single global "Loading" state.
3.  **Hydration:** Once all data arrives, the form "blossoms" (renders) fully.

---

## 🛠️ Implementation Specs (Frontend)

### Phase 1: Local Recents Memory
*   Update `updateField` to save to `localStorage` on successful execution.
*   Update `renderInput` to display chips from `localStorage`.

### Phase 2: Schema Resolver (The Middleware)
*   Create `brain/SchemaResolver.js`.
*   Function `resolve(rawSchema)`: Applies the Heuristics (Icons, Groups, Defaults).

### Phase 3: Conditional Mutation
*   Support `dependsOn` to hide/show fields dynamically without requiring a backend roundtrip for the layout itself.

---

## ✅ Compliance Checklist for "Clean Core"

- [ ] Does the Backend code contain CSS classes? -> **FAIL** (Move to CSS/Heuristics)
- [ ] Does the Backend define specific pixel widths? -> **FAIL** (Move to Heuristics)
- [ ] Does the Backend use roles instead of icons? -> **PASS**
- [ ] Is layout grouping logical (semantic) rather than visual? -> **PASS**
