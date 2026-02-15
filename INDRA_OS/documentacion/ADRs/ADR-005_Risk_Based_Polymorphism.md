# ADR-005: Sovereign Polymorphism & Cognitive Integration V2

**Status:** APPROVED
**Date:** 2026-02-14
**Author:** Antigravity & User
**Context:**  
System evolution required moving from a restrictive, whitelisted-based security model to a scalable, risk-based sovereign architecture. The original approach (static whitelists in `Logic_Axioms` and `SovereignGuard`) caused high friction for development and prevented true AI autonomy by limiting tool discovery.

## 1. Context & Motivation
- **Legacy Bottleneck:** Whitelisting every function manually created "Zombie Code" and "Access Denied" errors, halting architectural progress.
- **Cognitive Overload:** Flat-list tool exposure overwhelmed the AI context window, leading to hallucinations.
- **Redundancy:** `PublicAPI` contained hundreds of specific wrappers (`drive_search`, `sheet_create`) mirroring internal logic, violating DRY and increasing maintenance debt.

## 2. Decision: Total Polymorphism & Risk-Based Sovereignty

### A. Abolition of Static Whitelists
- **Verdict:** The concept of a "Security Whitelist" is **ABOLISHED**.
- **Change:** `SovereignGuard` now permits execution of ANY method that effectively exists on a registered node.
- **Rationale:** In a sovereign system, capability *implies* permission, unless explicitly forbidden by a higher law (Risk Policy).

### B. Risk-Based Security (Replacing Whitelists)
- **Mechanism:** Security is now enforced via **Risk Tags** in the IO Schema (e.g., `risk: "CRITICAL_DESTRUCTION"`).
- **Enforcement:** `SovereignGuard` will intercept high-risk actions at runtime and demand explicit confirmation, rather than blocking them by default.
- **Benefit:** "Open by Default" for read/safe operations; "Secure by Design" for destructive ones.

### C. MCEP V2: Hierarchical Discovery
- **Decision:** Tool discovery is now **HIERARCHICAL**.
- **Mechanism:** The AI receives a categorization tree (`mcep.getModelTooling`) and must request specific domains via `mcep.expandCategory('DRIVE')`.
- **Impact:** Reduces initial prompt size by ~80% and allows the AI to "zoom in" on capabilities as needed.

### D. Polymorphic Execution Gateway
- **Decision:** `PublicAPI` is stripped of specific wrappers.
- **Interface:** The primary interaction method is `executeAction({ action: 'node:method', payload: ... })`.
- **Exception:** A minimal set of `specializedWrappers` (e.g., `getSystemStatus`, `invoke`) remains for bootstrap and critical diagnostics.

## 3. Consequences

### Positive
- **Velocity:** New tools are immediately available to the AI without whitelist updates.
- **Maintainability:** `PublicAPI` LOC reduced by 40%. "Zombie Code" eliminated.
- **Cognitive Clarity:** AI understands system structure via domains, not flat lists.

### Negative / Risks
- **Testing:** Legacy tests expecting specific wrappers will fail and must be updated to use `executeAction`.
- **Security:** Requires disciplined implementation of `risk` tags. A missing tag defaults to "Allowed", which effectively grants full access until the Risk Policy is fully enforced (Phase 2).

## 4. Implementation Status
- **PublicAPI:** Refactored to Slim V2 (Polymorphic).
- **SovereignGuard:** Open Policy active.
- **MCEP:** V2 Hierarchical Logic active.
- **Debt:** Legacy whitelist arrays removed from `Logic_Axioms.gs`.





